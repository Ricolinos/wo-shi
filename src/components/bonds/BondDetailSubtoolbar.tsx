"use client"

import { Row, SegmentedControl, ToggleButton } from "@once-ui-system/core"
import type { ChartType, BondPeriod } from "@/types/bonds"

const PERIODS: { value: BondPeriod; label: string }[] = [
  { value: "3m", label: "3m" }, { value: "6m", label: "6m" }, { value: "1y", label: "1a" }, { value: "all", label: "Todo" },
]

export function BondDetailSubtoolbar({
  chartType, onChartType, period, onPeriod,
}: {
  chartType: ChartType
  onChartType: (t: ChartType) => void
  period: BondPeriod
  onPeriod: (p: BondPeriod) => void
}) {
  return (
    <Row horizontal="between" vertical="center" wrap gap="12">
      <SegmentedControl
        fillWidth={false}
        selected={chartType}
        buttons={[{ value: "line", label: "Línea" }, { value: "bars", label: "Barras" }, { value: "scatter", label: "Dispersión" }]}
        onToggle={v => onChartType(v as ChartType)}
      />
      <Row gap="4" wrap>
        {PERIODS.map(p => (
          <ToggleButton key={p.value} size="xl" selected={period === p.value} onClick={() => onPeriod(p.value)}>{p.label}</ToggleButton>
        ))}
      </Row>
    </Row>
  )
}
