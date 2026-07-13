"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Column, Row } from "@once-ui-system/core"
import { BondDetailHeader } from "./BondDetailHeader"
import { BondDetailSubtoolbar } from "./BondDetailSubtoolbar"
import { BondDetailChart } from "./BondDetailChart"
import { BondCompareBar } from "./BondCompareBar"
import { BondEntriesList } from "./BondEntriesList"
import { getBondDetail } from "@/lib/actions/bonds.actions"
import type { BondDetail, BondEntry, ChartType, BondPeriod } from "@/types/bonds"
import type { BondType } from "@prisma/client"

type ComparedBond = { id: string; name: string; type: BondType; snapshots: { intensity: number; proximity: number; date: Date }[] }

export function BondDetailPage({ bond, entries }: { bond: BondDetail; entries: BondEntry[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [chartType, setChartType] = useState<ChartType>("line")
  const [period, setPeriod] = useState<BondPeriod>("3m")
  const [comparing, setComparing] = useState(searchParams.has("compare"))
  const [compared, setCompared] = useState<ComparedBond[]>([])

  useEffect(() => {
    const ids = searchParams.get("compare")?.split(",").filter(Boolean) ?? []
    Promise.all(ids.map(id => getBondDetail(id))).then(results => {
      setCompared(results.filter((r): r is BondDetail => r !== null).map(r => ({ id: r.id, name: r.name, type: r.type, snapshots: r.snapshots })))
    })
  }, [searchParams])

  function updateCompareParam(ids: string[]) {
    const params = new URLSearchParams(searchParams.toString())
    if (ids.length === 0) params.delete("compare")
    else params.set("compare", ids.join(","))
    router.push(`/bonds/${bond.id}?${params.toString()}`)
  }

  function addCompare(b: { id: string; name: string; type: BondType }) {
    const ids = [...compared.map(c => c.id), b.id]
    updateCompareParam(ids)
  }
  function removeCompare(id: string) {
    updateCompareParam(compared.map(c => c.id).filter(i => i !== id))
  }
  function exitCompare() {
    setComparing(false)
    updateCompareParam([])
  }

  return (
    <Column fillWidth gap="16" paddingY="24" paddingX="16" maxWidth="l" style={{ margin: "0 auto" }}>
      <BondDetailHeader bond={bond} comparing={comparing} onToggleCompare={() => setComparing(v => !v)} />

      {comparing && (
        <BondCompareBar
          baseName={bond.name}
          comparedIds={compared.map(c => ({ id: c.id, name: c.name }))}
          onAdd={addCompare}
          onRemove={removeCompare}
          onExit={exitCompare}
        />
      )}

      <BondDetailSubtoolbar chartType={chartType} onChartType={setChartType} period={period} onPeriod={setPeriod} />

      <Row gap="24" fillWidth s={{ direction: "column" }} style={{ alignItems: "flex-start" }} wrap>
        <Column flex={1}>
          <BondDetailChart
            name={bond.name}
            snapshots={bond.snapshots}
            chartType={chartType}
            compared={comparing ? compared.map(c => ({ name: c.name, snapshots: c.snapshots })) : []}
          />
        </Column>
        <BondEntriesList entries={entries} />
      </Row>
    </Column>
  )
}
