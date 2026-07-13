"use server"

// Server action para obtener entradas del feed con filtros de visibilidad y tipo de bond.
// Respeta las reglas de privacidad: PRIVATE = solo propias, FRIENDS = mutuas, PUBLIC = cualquier usuario autenticado.

import { requireDbUser } from "@/lib/user"
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
  const userId = await requireDbUser()
  if (!userId) return []

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

async function getMutualFollowIds(userId: string): Promise<string[]> {
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  })
  const followingIds = following.map(f => f.followingId)
  if (followingIds.length === 0) return []

  const mutuals = await prisma.follow.findMany({
    where: {
      followerId: { in: followingIds },
      followingId: userId,
    },
    select: { followerId: true },
  })
  return mutuals.map(f => f.followerId)
}

async function buildVisibilityWhere(userId: string, visibility?: Visibility | "ALL") {
  if (!visibility || visibility === "ALL") {
    const mutualIds = await getMutualFollowIds(userId)
    return {
      OR: [
        { userId },
        { userId: { not: userId }, visibility: "PUBLIC" as Visibility },
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

  return { visibility: "PUBLIC" as Visibility }
}
