"use client"

import { Column, LineChart, BarChart, Text } from "@once-ui-system/core"
import { proximityToVisual } from "@/lib/bond-subtypes"
import type { ChartType } from "@/types/bonds"
import type { DataPoint } from "@once-ui-system/core"

type Snap = { intensity: number; proximity: number; date: Date }

export function BondDetailChart({
  name, snapshots, chartType, compared = [],
}: {
  name: string
  snapshots: Snap[]
  chartType: ChartType
  compared?: { name: string; snapshots: Snap[] }[]
}) {
  if (snapshots.length === 0) {
    return <Text variant="body-default-m" onBackground="neutral-weak">Aún no hay evolución registrada para este período.</Text>
  }

  if (chartType === "scatter") {
    const W = 560, H = 300
    const points = [
      { name, snaps: snapshots, color: "brand" },
      ...compared.map(c => ({ name: c.name, snaps: c.snapshots, color: "accent" })),
    ]
    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: 700 }}>
        <line x1={40} y1={H - 30} x2={W - 10} y2={H - 30} stroke="var(--neutral-alpha-medium)" />
        <line x1={40} y1={10} x2={40} y2={H - 30} stroke="var(--neutral-alpha-medium)" />
        {points.map((p, pi) => p.snaps.map((s, i) => (
          <circle
            key={`${pi}-${i}`}
            cx={40 + (s.intensity / 10) * (W - 60)}
            cy={H - 30 - (s.proximity / 10) * (H - 50)}
            r={5}
            fill={pi === 0 ? "var(--brand-solid-strong)" : "var(--accent-solid-strong)"}
            opacity={0.75}
          />
        )))}
        <text x={W / 2} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--neutral-on-background-weak)">Intensidad →</text>
        <text x={12} y={H / 2} fontSize="10" fill="var(--neutral-on-background-weak)" transform={`rotate(-90 12 ${H / 2})`}>Cercanía →</text>
      </svg>
    )
  }

  const dateSet = new Set<string>()
  snapshots.forEach(s => dateSet.add(new Date(s.date).toISOString().slice(0, 10)))
  compared.forEach(c => c.snapshots.forEach(s => dateSet.add(new Date(s.date).toISOString().slice(0, 10))))
  const dates = Array.from(dateSet).sort()

  const data: DataPoint[] = dates.map(date => {
    const row: DataPoint = { label: date, "Yo (referencia)": 0 }
    const own = snapshots.find(s => new Date(s.date).toISOString().slice(0, 10) === date)
    if (own) row[name] = Math.round(proximityToVisual(own.proximity) * 10) / 10
    compared.forEach(c => {
      const s = c.snapshots.find(s => new Date(s.date).toISOString().slice(0, 10) === date)
      if (s) row[c.name] = Math.round(proximityToVisual(s.proximity) * 10) / 10
    })
    return row
  })

  const seriesConfig = [{ key: "Yo (referencia)" }, { key: name }, ...compared.map(c => ({ key: c.name }))]

  return (
    <Column fillWidth>
      {chartType === "bars" ? (
        <BarChart fillWidth height={22} data={data} series={seriesConfig} axis="both" grid="both" legend={{ display: true, position: "top-right" }} />
      ) : (
        <LineChart fillWidth height={22} data={data} series={seriesConfig} axis="both" grid="both" legend={{ display: true, position: "top-right" }} />
      )}
    </Column>
  )
}
