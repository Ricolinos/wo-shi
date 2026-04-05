// src/lib/actions/bonds.actions.ts
"use server"

import { auth }   from "@/auth"
import { prisma } from "@/lib/prisma"
import type { BondType } from "@prisma/client"
import type { BondSummary, BondDetail, BondEntry, BondPeriod, BondMaturityFilter } from "@/types/bonds"

// Calcular fecha de inicio según período
function periodStart(period: BondPeriod): Date | undefined {
  if (period === "all") return undefined
  const d = new Date()
  if (period === "3m") d.setMonth(d.getMonth() - 3)
  if (period === "6m") d.setMonth(d.getMonth() - 6)
  if (period === "1y") d.setFullYear(d.getFullYear() - 1)
  return d
}

// ── Lista de bonds para /bonds ────────────────────────────────────────────────
export async function getBondsWithSnapshots(filters: {
  type?:     BondType | "ALL"
  subtype?:  string | null
  maturity?: BondMaturityFilter
  period?:   BondPeriod
}): Promise<BondSummary[]> {
  const session = await auth()
  if (!session?.user?.id) return []
  const userId = session.user.id

  const { type, subtype, maturity = "ALL", period = "3m" } = filters
  const since = periodStart(period)

  // Filtro de madurez
  const maturityWhere =
    maturity === "tags"  ? { maturityLevel: { lt: 5 } } :
    maturity === "bonds" ? { maturityLevel: { gte: 5 } } :
    {}

  const bonds = await prisma.bond.findMany({
    where: {
      userId,
      ...maturityWhere,
      ...(type && type !== "ALL" ? { type } : {}),
      ...(subtype ? { subtype } : {}),
    },
    include: {
      snapshots: {
        where: since ? { date: { gte: since } } : {},
        orderBy: { date: "asc" },
        select: { intensity: true, proximity: true, date: true },
      },
      entryBonds: {
        where: since ? { entry: { date: { gte: since } } } : {},
        select: { id: true, createdAt: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  return bonds.map(b => {
    const snaps = b.snapshots
    const last  = snaps.at(-1) ?? null
    return {
      id:           b.id,
      name:         b.name,
      type:         b.type,
      subtype:      b.subtype,
      maturityLevel: b.maturityLevel,
      createdAt:    b.createdAt,
      lastSnapshot: last
        ? { intensity: last.intensity, proximity: last.proximity, date: last.date }
        : null,
      recentSnapshots: snaps.slice(-8).map(s => ({
        intensity: s.intensity,
        proximity: s.proximity,
        date:      s.date,
      })),
      entryCount:       b.entryBonds.length,
      lastActivityDate: b.entryBonds.at(-1)?.createdAt ?? null,
      linkedUserId:     b.linkedUserId,
      avatar:           b.avatar,
    }
  })
}

// ── Detalle de un bond para /bonds/[id] ───────────────────────────────────────
export async function getBondDetail(bondId: string): Promise<BondDetail | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  const userId = session.user.id

  const bond = await prisma.bond.findFirst({
    where: { id: bondId, userId },
    include: {
      snapshots: {
        orderBy: { date: "asc" },
        select: { id: true, intensity: true, proximity: true, date: true },
      },
      entryBonds: { select: { id: true } },
    },
  })

  if (!bond) return null

  const snaps      = bond.snapshots
  const avgIntensity = snaps.length
    ? snaps.reduce((s, n) => s + n.intensity, 0) / snaps.length
    : 0
  const lastProximity = snaps.at(-1)?.proximity ?? 5

  return {
    id:           bond.id,
    name:         bond.name,
    type:         bond.type,
    subtype:      bond.subtype,
    maturityLevel: bond.maturityLevel,
    description:  bond.description,
    avatar:       bond.avatar,
    linkedUserId: bond.linkedUserId,
    createdAt:    bond.createdAt,
    snapshots:    snaps,
    avgIntensity:   Math.round(avgIntensity * 10) / 10,
    lastProximity,
    entryCount:   bond.entryBonds.length,
  }
}

// ── Entradas relacionadas con un bond ─────────────────────────────────────────
export async function getBondEntries(bondId: string): Promise<BondEntry[]> {
  const session = await auth()
  if (!session?.user?.id) return []
  const userId = session.user.id

  const entryBonds = await prisma.entryBond.findMany({
    where: { bondId, entry: { userId } },
    orderBy: { entry: { date: "desc" } },
    take: 50,
    select: {
      intensity: true,
      entry: {
        select: { id: true, title: true, date: true },
      },
    },
  })

  return entryBonds.map(eb => ({
    id:        eb.entry.id,
    title:     eb.entry.title,
    date:      eb.entry.date,
    intensity: eb.intensity,
  }))
}

// ── Bonds del usuario para el buscador de comparación ─────────────────────────
export async function searchUserBonds(q: string): Promise<{ id: string; name: string; type: BondType }[]> {
  const session = await auth()
  if (!session?.user?.id) return []
  const userId = session.user.id

  return prisma.bond.findMany({
    where: {
      userId,
      maturityLevel: { gte: 5 },
      name: { contains: q, mode: "insensitive" },
    },
    take: 8,
    select: { id: true, name: true, type: true },
    orderBy: { updatedAt: "desc" },
  })
}
