// src/types/bonds.ts
// Tipos para la sección de Vínculos (/bonds y /bonds/[id]).

import type { BondType } from "@prisma/client"

// ── Vistas disponibles en /bonds ──────────────────────────────────────────────
export type BondsView = "list" | "timeline" | "graph"

// ── Filtros de /bonds (sincronizados con URL searchParams) ────────────────────
export type BondMaturityFilter = "ALL" | "tags" | "bonds"
export type BondPeriod         = "3m" | "6m" | "1y" | "all"

export interface BondsFilters {
  view:     BondsView
  type:     BondType | "ALL"
  subtype:  string | null
  maturity: BondMaturityFilter
  period:   BondPeriod
}

// ── Datos que llegan del Server Component a /bonds ────────────────────────────
export interface BondSummary {
  id:           string
  name:         string
  type:         BondType
  subtype:      string | null
  maturityLevel: number
  createdAt:    Date
  // último snapshot
  lastSnapshot: {
    intensity: number
    proximity: number
    date:      Date
  } | null
  // snapshots del período para mini-gráfica (lista)
  recentSnapshots: {
    intensity: number
    proximity: number
    date:      Date
  }[]
  // para el grafo: conteo de entradas en el período
  entryCount: number
  // para la lista: tiempo relativo
  lastActivityDate: Date | null
  // si es usuario de wo-shi
  linkedUserId: string | null
  avatar:       string | null
}

// ── Datos para /bonds/[id] ────────────────────────────────────────────────────
export interface BondDetail {
  id:           string
  name:         string
  type:         BondType
  subtype:      string | null
  maturityLevel: number
  description:  string | null
  avatar:       string | null
  linkedUserId: string | null
  createdAt:    Date
  // todos los snapshots (para la gráfica)
  snapshots: {
    id:        string
    intensity: number
    proximity: number
    date:      Date
  }[]
  // métricas resumidas
  avgIntensity:    number
  lastProximity:   number  // último snapshot proximity, sin transformar
  entryCount:      number
}

export interface BondEntry {
  id:        string
  title:     string | null
  date:      Date
  intensity: number  // del EntryBond
}

// ── Tipo de gráfica en /bonds/[id] ────────────────────────────────────────────
export type ChartType = "line" | "bars" | "scatter"
