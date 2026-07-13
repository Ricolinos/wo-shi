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
export function proximityToVisual(proximity: number): number {
  return ((proximity - 1) / 9) * 20 - 10
}

// Once UI solo expone 7 roles semánticos de color a nivel de componente
// (neutral/brand/accent/info/danger/warning/success) — no un hex libre por
// tipo. Se reparten los 7 tipos de Bond sobre esos 7 roles.
export const BOND_TYPE_SCHEME: Record<BondType, "neutral" | "brand" | "accent" | "info" | "danger" | "warning" | "success"> = {
  PERSON:  "warning",
  BELIEF:  "danger",
  IDEA:    "accent",
  EMOTION: "success",
  PLACE:   "info",
  GROUP:   "info",
  OTHER:   "neutral",
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
