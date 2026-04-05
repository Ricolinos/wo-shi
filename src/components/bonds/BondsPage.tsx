// src/components/bonds/BondsPage.tsx
// Client Component raíz de /bonds. Recibe los bonds del Server Component,
// renderiza la toolbar y la vista activa según los filtros de la URL.
"use client"

import { BondsToolbar }  from "@/components/bonds/BondsToolbar"
import { BondsList }     from "@/components/bonds/BondsList"
import { BondsTimeline } from "@/components/bonds/BondsTimeline"
import { BondsGraph }    from "@/components/bonds/BondsGraph"
import type { BondSummary, BondsFilters } from "@/types/bonds"

interface BondsPageProps {
  bonds:   BondSummary[]
  filters: BondsFilters
}

export function BondsPage({ bonds, filters }: BondsPageProps) {
  return (
    <div className="flex flex-col h-full">
      <BondsToolbar filters={filters} />

      {filters.view === "list" && <BondsList bonds={bonds} />}
      {filters.view === "timeline" && <BondsTimeline bonds={bonds} />}
      {filters.view === "graph" && <BondsGraph bonds={bonds} />}
    </div>
  )
}
