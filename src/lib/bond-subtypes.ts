// src/lib/bond-subtypes.ts
// Vocabulario controlado de subtipos de Bond.
// Los valores válidos se definen aquí — no en la DB — para poder extenderlos sin migraciones.

import type { BondType } from "@prisma/client"

export const BOND_SUBTYPES: Record<BondType, string[]> = {
  PERSON:  ["familiar", "amistad", "pareja", "laboral", "mentor", "conocido"],
  BELIEF:  ["religión", "política", "filosofía", "moral", "espiritual"],
  IDEA:    ["concepto", "proyecto", "teoría", "meta", "hábito"],
  EMOTION: ["recurrente", "situacional", "crónica"],
  PLACE:   ["hogar", "ciudad", "lugar significativo"],
  GROUP:   ["familia", "amigos", "trabajo", "comunidad"],
  OTHER:   [],
}

// Transformar proximity (1-10) a escala visual centrada en 0 (-10 a +10)
// proximity 1 → -10, proximity 5.5 → 0, proximity 10 → +10
export function proximityToVisual(proximity: number): number {
  return ((proximity - 1) / 9) * 20 - 10
}

// Color de fondo por tipo de Bond (paleta wo-shi)
export const BOND_TYPE_COLOR: Record<BondType, string> = {
  PERSON:  "#D85A30",
  BELIEF:  "#D4537E",
  IDEA:    "#BA7517",
  EMOTION: "#1D9E75",
  PLACE:   "#378ADD",
  GROUP:   "#378ADD",
  OTHER:   "#9999aa",
}

// Color de fondo suave (chip) por tipo
export const BOND_TYPE_BG: Record<BondType, string> = {
  PERSON:  "#fff0eb",
  BELIEF:  "#fdf0f5",
  IDEA:    "#fdf6e8",
  EMOTION: "#edf8f4",
  PLACE:   "#edf4fd",
  GROUP:   "#edf4fd",
  OTHER:   "#f5f5f5",
}

// Label en español por tipo
export const BOND_TYPE_LABEL: Record<BondType, string> = {
  PERSON:  "Persona",
  BELIEF:  "Creencia",
  IDEA:    "Idea",
  EMOTION: "Emoción",
  PLACE:   "Lugar",
  GROUP:   "Grupo",
  OTHER:   "Otro",
}
