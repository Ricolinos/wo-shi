// src/lib/user.ts
// Puente Clerk ↔ base de datos.
// Clerk es la fuente de verdad de identidad; la tabla User guarda el perfil
// de aplicación (username, bio, configs) con el userId de Clerk como PK.
// requireDbUser() garantiza que la fila exista antes de operar con datos.

import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function requireDbUser(): Promise<string | null> {
  const { userId } = await auth()
  if (!userId) return null

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })
  if (existing) return userId

  const cu = await currentUser()
  if (!cu) return null

  const email = cu.emailAddresses[0]?.emailAddress ?? `${userId}@sin-email.local`
  const base =
    cu.username ??
    email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 20)

  try {
    await prisma.user.create({
      data: {
        id: userId,
        email,
        username: base,
        name: [cu.firstName, cu.lastName].filter(Boolean).join(" ") || null,
        avatar: cu.imageUrl || null,
        privacyConfig: { create: {} },
        feedConfig: { create: {} },
      },
    })
  } catch {
    await prisma.user.create({
      data: {
        id: userId,
        email,
        username: `${base.slice(0, 14)}_${userId.slice(-5).toLowerCase()}`,
        name: [cu.firstName, cu.lastName].filter(Boolean).join(" ") || null,
        avatar: cu.imageUrl || null,
        privacyConfig: { create: {} },
        feedConfig: { create: {} },
      },
    })
  }

  return userId
}
