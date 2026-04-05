// src/components/bonds/BondDetailPage.tsx
// Client Component raíz de /bonds/[id].
// Gestiona: tipo de gráfica, período, modo comparar y bonds comparados.
"use client"

import { useState, useCallback } from "react"
import { getBondDetail }          from "@/lib/actions/bonds.actions"
import { BondDetailHeader }       from "@/components/bonds/BondDetailHeader"
import { BondDetailSubtoolbar }   from "@/components/bonds/BondDetailSubtoolbar"
import { BondDetailChart }        from "@/components/bonds/BondDetailChart"
import { BondCompareBar }         from "@/components/bonds/BondCompareBar"
import { BondEntriesList }        from "@/components/bonds/BondEntriesList"
import type { BondDetail, BondEntry, ChartType, BondPeriod } from "@/types/bonds"
import type { BondType } from "@prisma/client"

interface CompareChip { id: string; name: string; type: BondType }

interface BondDetailPageProps {
  bond:         BondDetail
  entries:      BondEntry[]
  bondsHref:    string
}

export function BondDetailPage({ bond, entries, bondsHref }: BondDetailPageProps) {
  const [chartType,     setChartType]     = useState<ChartType>("line")
  const [period,        setPeriod]        = useState<BondPeriod>("6m")
  const [compareActive, setCompareActive] = useState(false)
  const [compareChips,  setCompareChips]  = useState<CompareChip[]>([])
  const [compareBonds,  setCompareBonds]  = useState<BondDetail[]>([])

  const baseBond: CompareChip = { id: bond.id, name: bond.name, type: bond.type }

  const handleAddCompare = useCallback(async (chip: CompareChip) => {
    const detail = await getBondDetail(chip.id)
    if (!detail) return
    setCompareChips(prev => [...prev, chip])
    setCompareBonds(prev => [...prev, detail])
  }, [])

  const handleRemoveCompare = useCallback((id: string) => {
    setCompareChips(prev => prev.filter(c => c.id !== id))
    setCompareBonds(prev => prev.filter(b => b.id !== id))
  }, [])

  const handleExitCompare = useCallback(() => {
    setCompareActive(false)
    setCompareChips([])
    setCompareBonds([])
  }, [])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <BondDetailHeader
        bond={bond}
        compareActive={compareActive}
        onCompare={() => setCompareActive(v => !v)}
        bondsHref={bondsHref}
      />

      {compareActive && (
        <BondCompareBar
          baseBond={baseBond}
          compareChips={compareChips}
          onAdd={handleAddCompare}
          onRemove={handleRemoveCompare}
          onExit={handleExitCompare}
        />
      )}

      <BondDetailSubtoolbar
        bondName={bond.name}
        bondType={bond.type}
        chartType={chartType}
        period={period}
        onChartType={setChartType}
        onPeriod={setPeriod}
        compareNames={compareChips.map(c => c.name)}
      />

      <div className="flex flex-1 overflow-hidden">
        <BondDetailChart
          bond={bond}
          chartType={chartType}
          period={period}
          compareBonds={compareBonds}
        />
        <BondEntriesList
          entries={entries}
          bondType={bond.type}
        />
      </div>
    </div>
  )
}
