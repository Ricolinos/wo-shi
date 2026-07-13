// src/lib/user.ts
// Puente Clerk ↔ base de datos.
// Clerk es la fuente de verdad de identidad; la tabla User guarda el perfil
// de aplicación (username, bio, configs) con el userId de Clerk como PK.
// requireDbUser() garantiza que la fila exista antes de operar con datos.

import { auth, currentUser } from "@clerk/nextjs/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

/**
 * True si `err` es un choque de unicidad de Prisma (P2002) sobre `field`.
 */
function isUniqueConstraintOn(err: unknown, field: string): boolean {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== "P2002") return false
  const target = err.meta?.target
  return Array.isArray(target) ? target.includes(field) : target === field
}

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

  const profileData = {
    id: userId,
    email,
    name: [cu.firstName, cu.lastName].filter(Boolean).join(" ") || null,
    avatar: cu.imageUrl || null,
    privacyConfig: { create: {} },
    feedConfig: { create: {} },
  }

  try {
    await prisma.user.create({ data: { ...profileData, username: base } })
    return userId
  } catch (err) {
    // Dos requests concurrentes del mismo usuario nuevo (mismo userId de
    // Clerk) pueden llegar aquí a la vez: el que pierde la carrera choca
    // contra el `id` (PK), no contra el `username`. En ese caso el otro
    // request ya dejó la fila lista — no hay nada que reintentar.
    if (isUniqueConstraintOn(err, "id")) return userId

    // Colisión de `username` (dos usuarios nuevos derivan el mismo prefijo
    // desde su email) — reintenta una vez con un sufijo único.
    if (isUniqueConstraintOn(err, "username")) {
      const retryUsername = `${base.slice(0, 14)}_${userId.slice(-5).toLowerCase()}`
      try {
        await prisma.user.create({ data: { ...profileData, username: retryUsername } })
        return userId
      } catch (retryErr) {
        if (isUniqueConstraintOn(retryErr, "id")) return userId
        throw retryErr
      }
    }

    throw err
  }
}
