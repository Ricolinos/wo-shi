// prisma/seed.ts
// Pobla la base de datos con 5 entradas ficticias para el feed.
// Ejecutar: npx prisma db seed  (o: npm run seed)

import { config } from "dotenv"
config({ path: ".env.local" })

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// ── usuarios ficticios ─────────────────────────────────────────────────────────

const seedUsers = [
  { username: "sofia_m",  name: "Sofía M.",  email: "sofia@seed.wo-shi.dev",   avatar: "https://i.pravatar.cc/150?u=sofia" },
  { username: "lucia_r",  name: "Lucía R.",  email: "lucia@seed.wo-shi.dev",   avatar: "https://i.pravatar.cc/150?u=lucia" },
  { username: "marco_t",  name: "Marco T.",  email: "marco@seed.wo-shi.dev",   avatar: "https://i.pravatar.cc/150?u=marco" },
  { username: "andres_p", name: "Andrés P.", email: "andres@seed.wo-shi.dev",  avatar: "https://i.pravatar.cc/150?u=andres" },
  { username: "elena_v",  name: "Elena V.",  email: "elena@seed.wo-shi.dev",   avatar: "https://i.pravatar.cc/150?u=elena" },
]

async function main() {
  console.log("🌱 Iniciando seed...")

  // Crear usuarios (upsert para no fallar si ya existen)
  const users: Record<string, string> = {}
  for (const u of seedUsers) {
    const user = await prisma.user.upsert({
      where:  { email: u.email },
      update: {},
      create: { username: u.username, name: u.name, email: u.email, avatar: u.avatar },
    })
    users[u.username] = user.id
    console.log(`  ✓ Usuario: ${u.username} (${user.id})`)
  }

  // ── Entrada 1: Sofía — 3 archivos (2 fotos + 1 video) ───────────────────────
  const entry1 = await prisma.entry.create({
    data: {
      userId:     users["sofia_m"],
      title:      "Un domingo en el Retiro",
      body:       "Caminé sola durante dos horas. El silencio me ayudó a ordenar los pensamientos que llevaban días dando vueltas en mi cabeza. A veces el parque sabe exactamente lo que necesitas.",
      date:       new Date(Date.now() - 2 * 60 * 60 * 1000),
      location:   "Madrid",
      visibility: "PUBLIC",
    },
  })
  await prisma.media.createMany({
    data: [
      { entryId: entry1.id, type: "IMAGE", url: "https://picsum.photos/seed/park1/800/800", filename: "retiro1.jpg", size: 204800 },
      { entryId: entry1.id, type: "IMAGE", url: "https://picsum.photos/seed/park2/800/800", filename: "retiro2.jpg", size: 184320 },
      { entryId: entry1.id, type: "VIDEO", url: "https://www.w3schools.com/html/mov_bbb.mp4", filename: "retiro_video.mp4", size: 1048576, duration: 9 },
    ],
  })
  const bondValentina = await prisma.bond.create({ data: { userId: users["sofia_m"], name: "Valentina", type: "PERSON", maturityLevel: 3 } })
  const bondCalma     = await prisma.bond.create({ data: { userId: users["sofia_m"], name: "Calma",     type: "EMOTION", maturityLevel: 6 } })
  const bondSoledad   = await prisma.bond.create({ data: { userId: users["sofia_m"], name: "Soledad elegida", type: "IDEA", maturityLevel: 2 } })
  const bondRetiro    = await prisma.bond.create({ data: { userId: users["sofia_m"], name: "Parque del Retiro", type: "PLACE", maturityLevel: 4 } })
  await prisma.entryBond.createMany({
    data: [
      { entryId: entry1.id, bondId: bondValentina.id, intensity: 7, proximity: 8 },
      { entryId: entry1.id, bondId: bondCalma.id,     intensity: 9, proximity: 9 },
      { entryId: entry1.id, bondId: bondSoledad.id,   intensity: 6, proximity: 5 },
      { entryId: entry1.id, bondId: bondRetiro.id,    intensity: 8, proximity: 9 },
    ],
  })
  console.log("  ✓ Entrada 1: Sofía — 3 archivos")

  // ── Entrada 2: Lucía — nota de audio ────────────────────────────────────────
  const entry2 = await prisma.entry.create({
    data: {
      userId:     users["lucia_r"],
      title:      "Lo que no pude decir en persona",
      body:       "Grabé esto caminando de vuelta a casa. No sabía que iba a llorar mientras lo decía. A veces la voz sabe cosas que las palabras escritas no alcanzan a decir.",
      date:       new Date(Date.now() - 5 * 60 * 60 * 1000),
      location:   "Ciudad de México",
      visibility: "FRIENDS",
    },
  })
  await prisma.media.create({
    data: {
      entryId:  entry2.id,
      type:     "AUDIO",
      url:      "https://www.w3schools.com/html/horse.mp3",
      filename: "nota_voz.mp3",
      size:     28160,
      duration: 107,
    },
  })
  const bondAndres   = await prisma.bond.create({ data: { userId: users["lucia_r"], name: "Andrés", type: "PERSON", maturityLevel: 8 } })
  const bondTristeza = await prisma.bond.create({ data: { userId: users["lucia_r"], name: "Tristeza", type: "EMOTION", maturityLevel: 5 } })
  const bondAmor     = await prisma.bond.create({ data: { userId: users["lucia_r"], name: "El amor no alcanza", type: "BELIEF", maturityLevel: 2 } })
  await prisma.entryBond.createMany({
    data: [
      { entryId: entry2.id, bondId: bondAndres.id,   intensity: 9, proximity: 7 },
      { entryId: entry2.id, bondId: bondTristeza.id, intensity: 8, proximity: 8 },
      { entryId: entry2.id, bondId: bondAmor.id,     intensity: 7, proximity: 6 },
    ],
  })
  console.log("  ✓ Entrada 2: Lucía — audio")

  // ── Entrada 3: Marco — 7 fotos (muestra 4 + +3) ─────────────────────────────
  const entry3 = await prisma.entry.create({
    data: {
      userId:     users["marco_t"],
      title:      "Tres días en Roma",
      body:       "Todo fue mejor de lo esperado. La ciudad te da más de lo que pedís si sabés caminar despacio. Comí bien, dormí poco, y entendí algo que no sé explicar todavía.",
      date:       new Date(Date.now() - 24 * 60 * 60 * 1000 * 2),
      location:   "Roma",
      visibility: "PUBLIC",
    },
  })
  await prisma.media.createMany({
    data: Array.from({ length: 7 }, (_, i) => ({
      entryId:  entry3.id,
      type:     "IMAGE" as const,
      url:      `https://picsum.photos/seed/rome${i + 1}/800/800`,
      filename: `roma${i + 1}.jpg`,
      size:     220000 + i * 10000,
    })),
  })
  const bondMarco   = await prisma.bond.create({ data: { userId: users["marco_t"], name: "Marco", type: "PERSON", maturityLevel: 5 } })
  const bondAsombro = await prisma.bond.create({ data: { userId: users["marco_t"], name: "Asombro", type: "EMOTION", maturityLevel: 3 } })
  const bondRoma    = await prisma.bond.create({ data: { userId: users["marco_t"], name: "Roma", type: "PLACE", maturityLevel: 2 } })
  await prisma.entryBond.createMany({
    data: [
      { entryId: entry3.id, bondId: bondMarco.id,   intensity: 8, proximity: 9 },
      { entryId: entry3.id, bondId: bondAsombro.id, intensity: 9, proximity: 8 },
      { entryId: entry3.id, bondId: bondRoma.id,    intensity: 9, proximity: 9 },
    ],
  })
  console.log("  ✓ Entrada 3: Marco — 7 fotos")

  // ── Entrada 4: Andrés — 1 foto ───────────────────────────────────────────────
  const entry4 = await prisma.entry.create({
    data: {
      userId:     users["andres_p"],
      title:      "Primera clase de piano",
      body:       "Mis manos no me obedecen todavía pero algo hizo clic hoy. El profesor me dijo que tengo oído, que eso es lo difícil de enseñar. Voy a seguir.",
      date:       new Date(Date.now() - 24 * 60 * 60 * 1000 * 2 - 3600000),
      location:   "Buenos Aires",
      visibility: "PUBLIC",
    },
  })
  await prisma.media.create({
    data: { entryId: entry4.id, type: "IMAGE", url: "https://picsum.photos/seed/piano/800/800", filename: "piano.jpg", size: 196608 },
  })
  const bondEntusiasmo = await prisma.bond.create({ data: { userId: users["andres_p"], name: "Entusiasmo",        type: "EMOTION", maturityLevel: 4 } })
  const bondAprender   = await prisma.bond.create({ data: { userId: users["andres_p"], name: "Aprender en voz alta", type: "IDEA",   maturityLevel: 1 } })
  await prisma.entryBond.createMany({
    data: [
      { entryId: entry4.id, bondId: bondEntusiasmo.id, intensity: 9, proximity: 9 },
      { entryId: entry4.id, bondId: bondAprender.id,   intensity: 7, proximity: 6 },
    ],
  })
  console.log("  ✓ Entrada 4: Andrés — 1 foto")

  // ── Entrada 5: Elena — 2 archivos (foto + video) ────────────────────────────
  const entry5 = await prisma.entry.create({
    data: {
      userId:     users["elena_v"],
      title:      "El mercado de la Boqueria a las 7am",
      body:       "Nadie habla del mercado vacío. Es otro lugar completamente. Los vendedores acomodan sus puestos en silencio, como si estuvieran preparando un escenario.",
      date:       new Date(Date.now() - 24 * 60 * 60 * 1000 * 3),
      location:   "Barcelona",
      visibility: "FRIENDS",
    },
  })
  await prisma.media.createMany({
    data: [
      { entryId: entry5.id, type: "IMAGE", url: "https://picsum.photos/seed/boqueria/800/800", filename: "boqueria.jpg",  size: 215040 },
      { entryId: entry5.id, type: "VIDEO", url: "https://www.w3schools.com/html/mov_bbb.mp4",  filename: "boqueria.mp4",  size: 1048576, duration: 9 },
    ],
  })
  const bondBoqueria = await prisma.bond.create({ data: { userId: users["elena_v"], name: "La Boqueria",       type: "PLACE",  maturityLevel: 3 } })
  const bondCalma2   = await prisma.bond.create({ data: { userId: users["elena_v"], name: "Calma",             type: "EMOTION", maturityLevel: 2 } })
  const bondCiudad   = await prisma.bond.create({ data: { userId: users["elena_v"], name: "Ciudad sin turistas", type: "IDEA", maturityLevel: 1 } })
  await prisma.entryBond.createMany({
    data: [
      { entryId: entry5.id, bondId: bondBoqueria.id, intensity: 8, proximity: 9 },
      { entryId: entry5.id, bondId: bondCalma2.id,   intensity: 7, proximity: 7 },
      { entryId: entry5.id, bondId: bondCiudad.id,   intensity: 6, proximity: 5 },
    ],
  })
  console.log("  ✓ Entrada 5: Elena — foto + video")

  console.log("\n✅ Seed completado — 5 usuarios, 5 entradas")
  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
