"use server"

// Acción de servidor para obtener entradas del feed con filtros de visibilidad y tipo de bond.
// Respeta las reglas de privacidad: PRIVATE = solo propias, FRIENDS = mutuas, PUBLIC = cualquier usuario autenticado.

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import type { BondType, Visibility } from "@prisma/client"

export type FeedEntry = {
  id: string
  title: string | null
  body: string
  date: Date
  location: string | null
  visibility: Visibility
  user: {
    id: string
    name: string | null
    username: string
    avatar: string | null
  }
  media: {
    id: string
    type: "IMAGE" | "VIDEO" | "AUDIO"
    url: string
    duration: number | null
  }[]
  entryBonds: {
    bond: {
      id: string
      name: string
      type: BondType
    }
    intensity: number
  }[]
}

export type FeedFilters = {
  bondType?: BondType
  visibility?: Visibility | "ALL"
}

export async function getFeedEntries(filters: FeedFilters = {}): Promise<FeedEntry[]> {
  const session = await auth()
  if (!session?.user?.id) return []

  const userId = session.user.id
  const { bondType, visibility } = filters

  const visibilityWhere = await buildVisibilityWhere(userId, visibility)

  const entries = await prisma.entry.findMany({
    where: {
      ...visibilityWhere,
      ...(bondType
        ? { entryBonds: { some: { bond: { type: bondType } } } }
        : {}),
    },
    orderBy: { date: "desc" },
    take: 50,
    select: {
      id:         true,
      title:      true,
      body:       true,
      date:       true,
      location:   true,
      visibility: true,
      user: {
        select: { id: true, name: true, username: true, avatar: true },
      },
      media: {
        select: { id: true, type: true, url: true, duration: true },
        orderBy: { createdAt: "asc" },
      },
      entryBonds: {
        select: {
          intensity: true,
          bond: { select: { id: true, name: true, type: true } },
        },
      },
    },
  })

  return entries
}

// ── Helper: obtener IDs de usuarios con follow mutuo ────────────────────────
// Devuelve los IDs de usuarios que se siguen mutuamente con userId:
// userId → X y X → userId.
async function getMutualFollowIds(userId: string): Promise<string[]> {
  // IDs de usuarios que userId sigue
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  })
  const followingIds = following.map(f => f.followingId)
  if (followingIds.length === 0) return []

  // De esos, filtrar los que también siguen a userId (follow mutuo)
  const mutuals = await prisma.follow.findMany({
    where: {
      followerId: { in: followingIds },
      followingId: userId,
    },
    select: { followerId: true },
  })
  return mutuals.map(f => f.followerId)
}

// Construye la cláusula WHERE según la visibilidad solicitada.
// Por defecto ("ALL") incluye: entradas propias de cualquier visibilidad +
// entradas ajenas PUBLIC + entradas FRIENDS de usuarios con follow mutuo.
async function buildVisibilityWhere(userId: string, visibility?: Visibility | "ALL") {
  if (!visibility || visibility === "ALL") {
    const mutualIds = await getMutualFollowIds(userId)
    return {
      OR: [
        // propias (cualquier visibilidad)
        { userId },
        // ajenas públicas
        { userId: { not: userId }, visibility: "PUBLIC" as Visibility },
        // ajenas de amigos con follow mutuo
        ...(mutualIds.length > 0
          ? [{ userId: { in: mutualIds }, visibility: "FRIENDS" as Visibility }]
          : []),
      ],
    }
  }

  if (visibility === "PRIVATE") {
    return { userId, visibility: "PRIVATE" as Visibility }
  }

  if (visibility === "FRIENDS") {
    const mutualIds = await getMutualFollowIds(userId)
    if (mutualIds.length === 0) return { userId, visibility: "FRIENDS" as Visibility }
    return {
      OR: [
        { userId, visibility: "FRIENDS" as Visibility },
        { userId: { in: mutualIds }, visibility: "FRIENDS" as Visibility },
      ],
    }
  }

  // PUBLIC
  return { visibility: "PUBLIC" as Visibility }
}
