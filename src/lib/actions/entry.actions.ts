// src/lib/actions/entry.actions.ts
"use server"

import { requireDbUser } from "@/lib/user"
import { prisma } from "@/lib/prisma"
import { put } from "@vercel/blob"
import type { Prisma, MediaType, BondType } from "@prisma/client"
import type { EntryDraft } from "@/types/journal"

const MATURITY_THRESHOLD = 5

type SaveResult =
  | { ok: true;  entryId: string }
  | { ok: false; error: string }

// ── /journal (lista) y /journal/[id] (detalle) — solo entradas propias ────────

export async function getJournalEntries() {
  const userId = await requireDbUser()
  if (!userId) return []

  return prisma.entry.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 100,
    select: {
      id: true, title: true, body: true, date: true, location: true, visibility: true,
      createdAt: true, editCount: true,
      media: { select: { id: true, type: true, url: true }, take: 1 },
      entryBonds: { select: { bond: { select: { id: true, name: true, type: true } } } },
    },
  })
}

export async function getJournalEntry(entryId: string) {
  const userId = await requireDbUser()
  if (!userId) return null

  return prisma.entry.findFirst({
    where: { id: entryId, userId },
    select: {
      id: true, title: true, body: true, date: true, location: true, latitude: true, longitude: true, visibility: true, editAccess: true,
      createdAt: true, editCount: true,
      media: { select: { id: true, type: true, url: true, duration: true } },
      entryBonds: {
        select: {
          intensity: true, proximity: true, note: true,
          bond: { select: { id: true, name: true, type: true, linkedUserId: true } },
        },
      },
    },
  })
}

export async function saveEntry(formData: FormData): Promise<SaveResult> {
  const userId = await requireDbUser()
  if (!userId) return { ok: false, error: "No autenticado" }

  let draft: EntryDraft & { isDraft?: boolean }
  try {
    draft = JSON.parse(formData.get("draft") as string)
  } catch {
    return { ok: false, error: "Datos inválidos" }
  }

  if (!draft.body?.trim()) return { ok: false, error: "El cuerpo de la entrada no puede estar vacío" }

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

  let entry
  try {
    entry = await prisma.$transaction(async tx => {
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

      if (mediaUploads.length) {
        await tx.media.createMany({
          data: mediaUploads.map(m => ({
            entryId:  newEntry.id,
            type:     m.type as MediaType,
            url:      m.url,
            filename: m.filename,
            size:     m.size,
          })),
        })
      }

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

        if (p.linkedUserId && p.notified) {
          await tx.tagApproval.upsert({
            where:  { entryId_bondId: { entryId: newEntry.id, bondId: bond.id } },
            create: { entryId: newEntry.id, bondId: bond.id, requestedBy: userId },
            update: {},
          })
        }
      }

      for (const e of draft.emotions) {
        const bond = await upsertBond(tx, userId, e.name, "EMOTION", e.bondId)
        await tx.entryBond.create({
          data: {
            entryId:   newEntry.id,
            bondId:    bond.id,
            intensity: e.intensity,
            proximity: e.intensity,
          },
        })
        await createSnapshot(tx, bond.id, e.intensity, e.intensity)
        await checkMaturity(tx, bond.id)
      }

      for (const i of draft.ideas) {
        const type: BondType = i.type === "IDEA" ? "IDEA" : "BELIEF"
        const bond = await upsertBond(tx, userId, i.name, type, i.bondId)
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
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo guardar la entrada" }
  }

  return { ok: true, entryId: entry.id }
}

export async function updateEntry(entryId: string, formData: FormData): Promise<SaveResult> {
  const userId = await requireDbUser()
  if (!userId) return { ok: false, error: "No autenticado" }

  // anti-IDOR: la entrada debe pertenecer al usuario antes de mutarla
  const owned = await prisma.entry.findFirst({ where: { id: entryId, userId }, select: { id: true } })
  if (!owned) return { ok: false, error: "Entrada no encontrada" }

  let draft: EntryDraft & { isDraft?: boolean }
  try {
    draft = JSON.parse(formData.get("draft") as string)
  } catch {
    return { ok: false, error: "Datos inválidos" }
  }

  if (!draft.body?.trim()) return { ok: false, error: "El cuerpo de la entrada no puede estar vacío" }

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

  let entry
  try {
    entry = await prisma.$transaction(async tx => {
      const updatedEntry = await tx.entry.update({
        where: { id: entryId },
        data: {
          title:      draft.title?.trim() || null,
          body:       draft.body.trim(),
          date:       new Date(`${draft.date}T${draft.time}`),
          location:   draft.location ?? null,
          latitude:   draft.latitude ?? null,
          longitude:  draft.longitude ?? null,
          visibility: draft.visibility,
          editAccess: draft.editAccess,
          editCount:  { increment: 1 },
        },
      })

      if (mediaUploads.length) {
        await tx.media.createMany({
          data: mediaUploads.map(m => ({
            entryId:  updatedEntry.id,
            type:     m.type as MediaType,
            url:      m.url,
            filename: m.filename,
            size:     m.size,
          })),
        })
      }

      // fuera de alcance de esta versión: no se editan persons/emotions/ideas
      // (bonds ya materializados con snapshots de madurez) — si el FormData
      // los trae, se ignoran deliberadamente.

      return updatedEntry
    })
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo actualizar la entrada" }
  }

  return { ok: true, entryId: entry.id }
}

async function upsertBond(
  tx: Prisma.TransactionClient,
  userId: string,
  name: string,
  type: BondType,
  bondId?: string,
  linkedUserId?: string,
) {
  if (bondId) {
    // verificar que el bond pertenece al usuario antes de mutarlo (evita IDOR)
    const owned = await tx.bond.findFirst({ where: { id: bondId, userId }, select: { id: true } })
    if (!owned) throw new Error("Vínculo no encontrado")

    return tx.bond.update({
      where: { id: bondId },
      data: { maturityLevel: { increment: 1 }, updatedAt: new Date() },
    })
  }

  const existing = await tx.bond.findFirst({ where: { userId, name, type } })
  if (existing) {
    return tx.bond.update({
      where: { id: existing.id },
      data: { maturityLevel: { increment: 1 }, updatedAt: new Date() },
    })
  }

  return tx.bond.create({
    data: { userId, name, type, maturityLevel: 1, linkedUserId: linkedUserId ?? null },
  })
}

async function createSnapshot(tx: Prisma.TransactionClient, bondId: string, intensity: number, proximity: number) {
  await tx.bondSnapshot.create({
    data: { bondId, intensity, proximity, date: new Date() },
  })
}

async function checkMaturity(tx: Prisma.TransactionClient, bondId: string) {
  const bond = await tx.bond.findUnique({ where: { id: bondId } })
  if (bond && bond.maturityLevel === MATURITY_THRESHOLD) {
    await tx.bond.update({ where: { id: bondId }, data: { updatedAt: new Date() } })
  }
}

// ── búsqueda de vínculos/usuarios (consumida por /api/bonds/search) ───────────

export async function searchBondsAndUsers(userId: string, q: string, type?: string) {
  const [users, bonds] = await Promise.all([
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
    prisma.bond.findMany({
      where: {
        userId,
        type: (type as BondType) ?? undefined,
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
