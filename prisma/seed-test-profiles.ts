// prisma/seed-test-profiles.ts
// Siembra los 3 usuarios de prueba REALES de Clerk (ya creados en la instancia
// de dev de Clerk por otro agente) como filas `User` en Postgres, junto con
// follows, entradas y bonds variados para auditar la capa de negocio
// (visibilidad de feed, maduración de vínculos, TagApproval, IDOR).
//
// Idempotente: todo se hace con upsert por `id` explícito, así que se puede
// correr más de una vez sin duplicar filas.
//
// Ejecutar: npx tsx prisma/seed-test-profiles.ts

import { config } from "dotenv"
config({ path: ".env.local" })

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import type { Visibility, BondType } from "@prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// ── los 3 usuarios reales de Clerk (dev) ───────────────────────────────────────

const ana = {
  id:       "user_3GSDXHbPjvFeQxQsmEe6VeFZcs0",
  email:    "testuser1+clerk_test@example.com",
  username: "testuser1",
  name:     "Ana Prueba",
}
const bruno = {
  id:       "user_3GSDY1XIsW9ZYQPfXhqGZqYBS0h",
  email:    "testuser2+clerk_test@example.com",
  username: "testuser2",
  name:     "Bruno Prueba",
}
const carla = {
  id:       "user_3GSDYKaPGuKLKTas29PP71cEUWR",
  email:    "testuser3+clerk_test@example.com",
  username: "testuser3",
  name:     "Carla Prueba",
}

// ── helpers de fecha (offsets desde "ahora") ───────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

async function main() {
  console.log("🌱 Sembrando perfiles de prueba (Clerk dev)...")

  // ── 1. Users (mismo shape que requireDbUser: privacyConfig + feedConfig) ───
  for (const u of [ana, bruno, carla]) {
    await prisma.user.upsert({
      where:  { id: u.id },
      update: { email: u.email, username: u.username, name: u.name },
      create: {
        id:       u.id,
        email:    u.email,
        username: u.username,
        name:     u.name,
        privacyConfig: { create: {} },
        feedConfig:    { create: {} },
      },
    })
    console.log(`  ✓ Usuario: ${u.username} (${u.id})`)
  }

  // ── 2. Follows: Ana↔Bruno mutuo; Carla → Ana unidireccional (NO correspondido) ──
  await prisma.follow.createMany({
    data: [
      { followerId: ana.id,   followingId: bruno.id },
      { followerId: bruno.id, followingId: ana.id },
      { followerId: carla.id, followingId: ana.id }, // Carla sigue a Ana, Ana NO le sigue de vuelta
    ],
    skipDuplicates: true,
  })
  console.log("  ✓ Follows: Ana↔Bruno mutuo, Carla→Ana unidireccional")

  // ── 3. Entradas: 3 visibilidades × fechas variadas por usuario ──────────────
  // e0/e1 son del mismo día (para probar FRIENDS mutuo entre Ana y Bruno);
  // e2/e3 son semanas/meses atrás; e4 tiene más de un año (para el filtro "todo").
  type EntrySpec = { id: string; title: string; body: string; date: Date; visibility: Visibility }

  function entriesFor(u: { id: string; username: string }): EntrySpec[] {
    return [
      {
        id:         `st-entry-${u.username}-e0-private`,
        title:      "Notas para mí",
        body:       `Entrada privada de ${u.username} — solo para mis ojos, pensamientos sueltos del día.`,
        date:       daysAgo(0),
        visibility: "PRIVATE",
      },
      {
        id:         `st-entry-${u.username}-e1-friends`,
        title:      "Para quienes me siguen de cerca",
        body:       `Entrada FRIENDS de ${u.username} — algo que solo comparto con mis contactos cercanos.`,
        date:       daysAgo(0),
        visibility: "FRIENDS",
      },
      {
        id:         `st-entry-${u.username}-e2-public-recent`,
        title:      "Algo que puedo compartir",
        body:       `Entrada PUBLIC de ${u.username} — hace un par de semanas, sin filtro de privacidad.`,
        date:       daysAgo(14),
        visibility: "PUBLIC",
      },
      {
        id:         `st-entry-${u.username}-e3-public-old`,
        title:      "Hace unos meses",
        body:       `Entrada PUBLIC de ${u.username} — de hace unos meses, para probar filtros de período.`,
        date:       daysAgo(120),
        visibility: "PUBLIC",
      },
      {
        id:         `st-entry-${u.username}-e4-friends-oldest`,
        title:      "Hace más de un año",
        body:       `Entrada FRIENDS de ${u.username} — la más antigua del set, fuera de rango de 1 año.`,
        date:       daysAgo(400),
        visibility: "FRIENDS",
      },
    ]
  }

  const entriesByUser: Record<string, EntrySpec[]> = {
    [ana.id]:   entriesFor(ana),
    [bruno.id]: entriesFor(bruno),
    [carla.id]: entriesFor(carla),
  }

  for (const [userId, specs] of Object.entries(entriesByUser)) {
    for (const s of specs) {
      await prisma.entry.upsert({
        where:  { id: s.id },
        update: { title: s.title, body: s.body, date: s.date, visibility: s.visibility },
        create: {
          id:         s.id,
          userId,
          title:      s.title,
          body:       s.body,
          date:       s.date,
          visibility: s.visibility,
        },
      })
    }
    console.log(`  ✓ 5 entradas (PRIVATE/FRIENDS/PUBLIC, fechas variadas) para ${userId}`)
  }

  // ── 4. Bonds PERSON cruzados con linkedUserId + notified:true → TagApproval ──
  // Ana etiqueta a Bruno en su entrada FRIENDS del mismo día.
  // Bruno etiqueta a Ana en su entrada FRIENDS del mismo día.
  // Carla etiqueta a Ana (aunque el follow es unidireccional, el tagging es independiente).
  async function upsertBondFixed(opts: {
    id: string; userId: string; name: string; type: BondType
    maturityLevel: number; linkedUserId?: string
  }) {
    return prisma.bond.upsert({
      where:  { id: opts.id },
      update: { maturityLevel: opts.maturityLevel, linkedUserId: opts.linkedUserId ?? null },
      create: {
        id:            opts.id,
        userId:        opts.userId,
        name:          opts.name,
        type:          opts.type,
        maturityLevel: opts.maturityLevel,
        linkedUserId:  opts.linkedUserId ?? null,
      },
    })
  }

  async function upsertEntryBond(opts: {
    entryId: string; bondId: string; intensity: number; proximity: number; notified?: boolean
  }) {
    return prisma.entryBond.upsert({
      where:  { entryId_bondId: { entryId: opts.entryId, bondId: opts.bondId } },
      update: { intensity: opts.intensity, proximity: opts.proximity, notified: opts.notified ?? false },
      create: {
        entryId:   opts.entryId,
        bondId:    opts.bondId,
        intensity: opts.intensity,
        proximity: opts.proximity,
        notified:  opts.notified ?? false,
      },
    })
  }

  async function upsertSnapshot(opts: { id: string; bondId: string; date: Date; intensity: number; proximity: number }) {
    return prisma.bondSnapshot.upsert({
      where:  { id: opts.id },
      update: { intensity: opts.intensity, proximity: opts.proximity, date: opts.date },
      create: { id: opts.id, bondId: opts.bondId, date: opts.date, intensity: opts.intensity, proximity: opts.proximity },
    })
  }

  async function upsertTagApproval(opts: { entryId: string; bondId: string; requestedBy: string }) {
    return prisma.tagApproval.upsert({
      where:  { entryId_bondId: { entryId: opts.entryId, bondId: opts.bondId } },
      update: {},
      create: { entryId: opts.entryId, bondId: opts.bondId, requestedBy: opts.requestedBy },
    })
  }

  const bondAnaTagsBruno   = await upsertBondFixed({ id: "st-bond-ana-tags-bruno",   userId: ana.id,   name: "Bruno", type: "PERSON", maturityLevel: 1, linkedUserId: bruno.id })
  const bondBrunoTagsAna   = await upsertBondFixed({ id: "st-bond-bruno-tags-ana",   userId: bruno.id, name: "Ana",   type: "PERSON", maturityLevel: 1, linkedUserId: ana.id })
  const bondCarlaTagsAna   = await upsertBondFixed({ id: "st-bond-carla-tags-ana",   userId: carla.id, name: "Ana",   type: "PERSON", maturityLevel: 1, linkedUserId: ana.id })

  await upsertEntryBond({ entryId: entriesByUser[ana.id][1].id,   bondId: bondAnaTagsBruno.id, intensity: 8, proximity: 8, notified: true })
  await upsertTagApproval({ entryId: entriesByUser[ana.id][1].id, bondId: bondAnaTagsBruno.id, requestedBy: ana.id })

  await upsertEntryBond({ entryId: entriesByUser[bruno.id][1].id,   bondId: bondBrunoTagsAna.id, intensity: 7, proximity: 8, notified: true })
  await upsertTagApproval({ entryId: entriesByUser[bruno.id][1].id, bondId: bondBrunoTagsAna.id, requestedBy: bruno.id })

  await upsertEntryBond({ entryId: entriesByUser[carla.id][2].id,   bondId: bondCarlaTagsAna.id, intensity: 6, proximity: 5, notified: true })
  await upsertTagApproval({ entryId: entriesByUser[carla.id][2].id, bondId: bondCarlaTagsAna.id, requestedBy: carla.id })

  console.log("  ✓ Bonds PERSON cruzados (Ana↔Bruno, Carla→Ana) con TagApproval")

  // ── 5. Bonds EMOTION/IDEA repetidos para cruzar (o no) el umbral de madurez ──
  // Ana: "Calma" (EMOTION) usado en sus 5 entradas → maturityLevel = 5 (justo el umbral, vínculo maduro).
  const bondAnaCalma = await upsertBondFixed({ id: "st-bond-ana-calma", userId: ana.id, name: "Calma", type: "EMOTION", maturityLevel: 5 })
  for (const [i, e] of entriesByUser[ana.id].entries()) {
    await upsertEntryBond({ entryId: e.id, bondId: bondAnaCalma.id, intensity: 5 + (i % 3), proximity: 6 })
    await upsertSnapshot({ id: `st-snap-ana-calma-${i}`, bondId: bondAnaCalma.id, date: e.date, intensity: 5 + (i % 3), proximity: 6 })
  }

  // Ana: "Cambio de rumbo" (IDEA), solo 2 usos → maturityLevel = 2 (sigue siendo etiqueta).
  const bondAnaCambio = await upsertBondFixed({ id: "st-bond-ana-cambio", userId: ana.id, name: "Cambio de rumbo", type: "IDEA", maturityLevel: 2 })
  for (const e of entriesByUser[ana.id].slice(0, 2)) {
    await upsertEntryBond({ entryId: e.id, bondId: bondAnaCambio.id, intensity: 6, proximity: 5 })
    await upsertSnapshot({ id: `st-snap-ana-cambio-${e.id}`, bondId: bondAnaCambio.id, date: e.date, intensity: 6, proximity: 5 })
  }

  // Bruno: "Ansiedad" (EMOTION), 3 usos → maturityLevel = 3 (etiqueta, por debajo del umbral).
  const bondBrunoAnsiedad = await upsertBondFixed({ id: "st-bond-bruno-ansiedad", userId: bruno.id, name: "Ansiedad", type: "EMOTION", maturityLevel: 3 })
  for (const e of entriesByUser[bruno.id].slice(0, 3)) {
    await upsertEntryBond({ entryId: e.id, bondId: bondBrunoAnsiedad.id, intensity: 7, proximity: 4 })
    await upsertSnapshot({ id: `st-snap-bruno-ansiedad-${e.id}`, bondId: bondBrunoAnsiedad.id, date: e.date, intensity: 7, proximity: 4 })
  }

  // Carla: "Curiosidad" (IDEA), usado en sus 5 entradas y madurez forzada a 7 → claramente por encima del umbral.
  const bondCarlaCuriosidad = await upsertBondFixed({ id: "st-bond-carla-curiosidad", userId: carla.id, name: "Curiosidad", type: "IDEA", maturityLevel: 7 })
  for (const [i, e] of entriesByUser[carla.id].entries()) {
    await upsertEntryBond({ entryId: e.id, bondId: bondCarlaCuriosidad.id, intensity: 6 + (i % 4), proximity: 7 })
    await upsertSnapshot({ id: `st-snap-carla-curiosidad-${i}`, bondId: bondCarlaCuriosidad.id, date: e.date, intensity: 6 + (i % 4), proximity: 7 })
  }

  console.log("  ✓ Bonds EMOTION/IDEA sembrados (Ana y Carla cruzan el umbral de madurez, Bruno se queda como etiqueta)")

  console.log("\n✅ Seed de perfiles de prueba completado — 3 usuarios reales, follows, 15 entradas, bonds cruzados y madurados")
  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
