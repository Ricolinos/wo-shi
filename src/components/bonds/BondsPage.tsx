"use client"

import { Column } from "@once-ui-system/core"
import { BondsToolbar } from "./BondsToolbar"
import { BondsList } from "./BondsList"
import { BondsTimeline } from "./BondsTimeline"
import { BondsGraph } from "./BondsGraph"
import type { BondSummary, BondsFilters } from "@/types/bonds"

export function BondsPage({ bonds, filters }: { bonds: BondSummary[]; filters: BondsFilters }) {
  return (
    <Column fillWidth gap="24" paddingY="24" paddingX="16" maxWidth="l" style={{ margin: "0 auto" }}>
      <BondsToolbar filters={filters} />
      {filters.view === "list" && <BondsList bonds={bonds} />}
      {filters.view === "timeline" && <BondsTimeline bonds={bonds} />}
      {filters.view === "graph" && <BondsGraph bonds={bonds} />}
    </Column>
  )
}
