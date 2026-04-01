// src/lib/actions/entry.actions.ts
"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { put } from "@vercel/blob"   // npm install @vercel/blob
import type { EntryDraft, PersonBond, EmotionBond, IdeaBond } from "@/types/journal"

const MATURITY_THRESHOLD = 5

type SaveResult =
  | { ok: true;  entryId: string }
  | { ok: false; error: string }

export async function saveEntry(formData: FormData): Promise<SaveResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: "No autenticado" }
  const userId = session.user.id

  // ── parsear draft ──────────────────────────────────────────────────────────
  let draft: EntryDraft & { isDraft?: boolean }
  try {
    draft = JSON.parse(formData.get("draft") as string)
  } catch {
    return { ok: false, error: "Datos inválidos" }
  }

  if (!draft.body?.trim()) return { ok: false, error: "El cuerpo de la entrada no puede estar vacío" }

  // ── subir media a Vercel Blob ──────────────────────────────────────────────
  const mediaUploads: { id: string; url: string; type: string; filename: string; size: number }[] = []

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("media-") || !(value instanceof File)) continue
    const mediaId = key.replace("media-", "")
    const localMedia = draft.media.find(m => m.id === mediaId)
    if (!localMedia) continue

    const blob = await put(`wo-shi/${userId}/${Date.now()}-${value.name}`, value, {
      access: "private",
    })
    mediaUploads.push({
      id: mediaId,
      url: blob.url,
      type: localMedia.type,
      filename: value.name,
      size: value.size,
    })
  }

  // ── transacción principal ──────────────────────────────────────────────────
  const entry = await prisma.$transaction(async tx => {

    // 1. crear la entrada
    const newEntry = await tx.entry.create({
      data: {
        userId,
        title:      draft.title?.trim() || null,
        body:       draft.body.trim(),
        date:       new Date(`${draft.date}T${draft.time}`),
        location:   draft.location ?? null,
        latitude:   draft.latitude ?? null,
        longitude:  draft.longitude ?? null,
        visibility: draft.visibility,
        editAccess: draft.editAccess,
      },
    })

    // 2. media
    if (mediaUploads.length) {
      await tx.media.createMany({
        data: mediaUploads.map(m => ({
          entryId:  newEntry.id,
          type:     m.type as any,
          url:      m.url,
          filename: m.filename,
          size:     m.size,
        })),
      })
    }

    // 3. vínculos de personas
    for (const p of draft.persons) {
      const bond = await upsertBond(tx, userId, p.name, "PERSON", p.bondId, p.linkedUserId)
      await tx.entryBond.create({
        data: {
          entryId:   newEntry.id,
          bondId:    bond.id,
          intensity: p.intensity,
          proximity: p.proximity,
          notified:  p.notified,
          note:      p.privateNote ?? null,
        },
      })
      await createSnapshot(tx, bond.id, p.intensity, p.proximity)
      await checkMaturity(tx, bond.id)

      // crear TagApproval si el vínculo está ligado a un usuario y se notifica
      if (p.linkedUserId && p.notified) {
        await tx.tagApproval.upsert({
          where:  { entryId_bondId: { entryId: newEntry.id, bondId: bond.id } },
          create: { entryId: newEntry.id, bondId: bond.id, requestedBy: userId },
          update: {},
        })
      }
    }

    // 4. vínculos de emociones/sentimientos/estado de ánimo
    for (const e of draft.emotions) {
      const bond = await upsertBond(tx, userId, e.name, "EMOTION", e.bondId)
      await tx.entryBond.create({
        data: {
          entryId:   newEntry.id,
          bondId:    bond.id,
          intensity: e.intensity,
          proximity: e.intensity, // para emociones usamos intensity como ambas dimensiones
        },
      })
      await createSnapshot(tx, bond.id, e.intensity, e.intensity)
      await checkMaturity(tx, bond.id)
    }

    // 5. vínculos de ideas/creencias
    for (const i of draft.ideas) {
      const type = i.type === "IDEA" ? "IDEA" : "BELIEF"
      const bond = await upsertBond(tx, userId, i.name, type as any, i.bondId)
      await tx.entryBond.create({
        data: {
          entryId:   newEntry.id,
          bondId:    bond.id,
          intensity: i.relevance,
          proximity: i.relevance,
        },
      })
      await createSnapshot(tx, bond.id, i.relevance, i.relevance)
      await checkMaturity(tx, bond.id)
    }

    return newEntry
  })

  return { ok: true, entryId: entry.id }
}

// ── helpers de transacción ────────────────────────────────────────────────────

async function upsertBond(
  tx: any,
  userId: string,
  name: string,
  type: string,
  bondId?: string,
  linkedUserId?: string,
) {
  if (bondId) {
    // incrementar maturity level
    return tx.bond.update({
      where: { id: bondId },
      data: { maturityLevel: { increment: 1 }, updatedAt: new Date() },
    })
  }
  // buscar por nombre y tipo
  const existing = await tx.bond.findFirst({
    where: { userId, name, type },
  })
  if (existing) {
    return tx.bond.update({
      where: { id: existing.id },
      data: { maturityLevel: { increment: 1 }, updatedAt: new Date() },
    })
  }
  // crear nuevo
  return tx.bond.create({
    data: { userId, name, type, maturityLevel: 1, linkedUserId: linkedUserId ?? null },
  })
}

async function createSnapshot(tx: any, bondId: string, intensity: number, proximity: number) {
  await tx.bondSnapshot.create({
    data: { bondId, intensity, proximity, date: new Date() },
  })
}

async function checkMaturity(tx: any, bondId: string) {
  // si alcanza el umbral actualiza el maturityLevel para que la UI lo muestre como "entity"
  const bond = await tx.bond.findUnique({ where: { id: bondId } })
  if (bond && bond.maturityLevel === MATURITY_THRESHOLD) {
    // ya maduró — aquí podríamos enviar una notificación interna al usuario
    // por ahora solo lo marcamos en updatedAt
    await tx.bond.update({ where: { id: bondId }, data: { updatedAt: new Date() } })
  }
}

// ── API route: buscar vínculos/usuarios ────────────────────────────────────────
// Este endpoint es consumido por PersonModal para el buscador en tiempo real.
// Crear en: src/app/api/bonds/search/route.ts

export async function searchBondsAndUsers(userId: string, q: string, type?: string) {
  const [users, bonds] = await Promise.all([
    // buscar usuarios de wo-shi
    prisma.user.findMany({
      where: {
        AND: [
          { id: { not: userId } },
          { OR: [
            { username: { contains: q, mode: "insensitive" } },
            { name:     { contains: q, mode: "insensitive" } },
          ]},
        ],
      },
      take: 5,
      select: { id: true, username: true, name: true, avatar: true },
    }),
    // buscar vínculos existentes del usuario
    prisma.bond.findMany({
      where: {
        userId,
        type: type as any ?? undefined,
        name: { contains: q, mode: "insensitive" },
      },
      take: 5,
      include: { _count: { select: { entryBonds: true } } },
    }),
  ])

  const results = [
    ...users.map(u => ({
      id:       u.id,
      name:     u.name ?? u.username,
      username: u.username,
      avatar:   u.avatar ?? undefined,
      isUser:   true,
      bondId:   bonds.find(b => b.linkedUserId === u.id)?.id,
      mentions: bonds.find(b => b.linkedUserId === u.id)?._count.entryBonds,
    })),
    ...bonds
      .filter(b => !users.some(u => b.linkedUserId === u.id))
      .map(b => ({
        id:       b.id,
        name:     b.name,
        isUser:   false,
        bondId:   b.id,
        mentions: b._count.entryBonds,
      })),
  ]

  return results
}
