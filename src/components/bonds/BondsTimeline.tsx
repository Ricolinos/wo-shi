"use client"

import { Column, LineChart, Text } from "@once-ui-system/core"
import { proximityToVisual } from "@/lib/bond-subtypes"
import type { BondSummary } from "@/types/bonds"
import type { DataPoint } from "@once-ui-system/core"

type SeriesConfig = { key: string; color?: string }

export function BondsTimeline({ bonds }: { bonds: BondSummary[] }) {
  const active = bonds.filter(b => b.recentSnapshots.length > 0)

  if (active.length === 0) {
    return <Text variant="body-default-m" onBackground="neutral-weak">No hay datos de evolución en este período.</Text>
  }

  // Formato "wide": cada fecha es una fila, cada bond es una columna con su cercanía visual (-10..+10)
  const dateSet = new Set<string>()
  active.forEach(b => b.recentSnapshots.forEach(s => dateSet.add(new Date(s.date).toISOString().slice(0, 10))))
  const dates = Array.from(dateSet).sort()

  const data: DataPoint[] = dates.map(date => {
    const row: DataPoint = { label: date }
    active.forEach(b => {
      const snap = b.recentSnapshots.find(s => new Date(s.date).toISOString().slice(0, 10) === date)
      if (snap) row[b.name] = Math.round(proximityToVisual(snap.proximity) * 10) / 10
    })
    return row
  })

  const series: SeriesConfig[] = active.map(b => ({ key: b.name }))

  return (
    <Column gap="8" fillWidth>
      <LineChart
        fillWidth
        height={22}
        data={data}
        series={series}
        axis="both"
        grid="both"
        legend={{ display: true, position: "top-right" }}
      />
    </Column>
  )
}
