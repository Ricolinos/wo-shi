// src/types/bonds.ts
// Tipos para la sección de Vínculos (/bonds y /bonds/[id]).

import type { BondType } from "@prisma/client"

export type BondsView = "list" | "timeline" | "graph"

export type BondMaturityFilter = "ALL" | "tags" | "bonds"
export type BondPeriod         = "3m" | "6m" | "1y" | "all"

export interface BondsFilters {
  view:     BondsView
  type:     BondType | "ALL"
  subtype:  string | null
  maturity: BondMaturityFilter
  period:   BondPeriod
}

export interface BondSummary {
  id:           string
  name:         string
  type:         BondType
  subtype:      string | null
  maturityLevel: number
  createdAt:    Date
  lastSnapshot: {
    intensity: number
    proximity: number
    date:      Date
  } | null
  recentSnapshots: {
    intensity: number
    proximity: number
    date:      Date
  }[]
  entryCount: number
  lastActivityDate: Date | null
  linkedUserId: string | null
  avatar:       string | null
}

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
  snapshots: {
    id:        string
    intensity: number
    proximity: number
    date:      Date
  }[]
  avgIntensity:    number
  lastProximity:   number
  entryCount:      number
}

export interface BondEntry {
  id:        string
  title:     string | null
  date:      Date
  intensity: number
}

export type ChartType = "line" | "bars" | "scatter"
