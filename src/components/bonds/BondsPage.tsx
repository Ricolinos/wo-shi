"use client"

import { RevealFx } from "@once-ui-system/core"
import { BondsList } from "./BondsList"
import { BondsTimeline } from "./BondsTimeline"
import { BondsGraph } from "./BondsGraph"
import type { BondSummary, BondsFilters } from "@/types/bonds"

export function BondsPage({ bonds, filters }: { bonds: BondSummary[]; filters: BondsFilters }) {
  return (
    <RevealFx key={filters.view} translateY="8" delay={0} fillWidth>
      {filters.view === "list" && <BondsList bonds={bonds} />}
      {filters.view === "timeline" && <BondsTimeline bonds={bonds} />}
      {filters.view === "graph" && <BondsGraph bonds={bonds} />}
    </RevealFx>
  )
}
