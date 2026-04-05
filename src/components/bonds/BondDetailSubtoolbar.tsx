// src/components/bonds/BondDetailSubtoolbar.tsx
// Sub-toolbar del detalle de un vínculo: toggle de tipo de gráfica,
// toggle de período y leyenda inline.
"use client"

import { BOND_TYPE_COLOR } from "@/lib/bond-subtypes"
import type { BondType } from "@prisma/client"
import type { ChartType, BondPeriod } from "@/types/bonds"

interface BondDetailSubtoolbarProps {
  bondName:    string
  bondType:    BondType
  chartType:   ChartType
  period:      BondPeriod
  onChartType: (t: ChartType) => void
  onPeriod:    (p: BondPeriod) => void
  compareNames: string[]  // nombres de bonds en modo comparar
}

const CHART_OPTS: { value: ChartType; label: string }[] = [
  { value: "line",    label: "Línea" },
  { value: "bars",    label: "Barras" },
  { value: "scatter", label: "Dispersión" },
]

const PERIOD_OPTS: { value: BondPeriod; label: string }[] = [
  { value: "3m",  label: "3m" },
  { value: "6m",  label: "6m" },
  { value: "1y",  label: "1a" },
  { value: "all", label: "Todo" },
]

export function BondDetailSubtoolbar({
  bondName,
  bondType,
  chartType,
  period,
  onChartType,
  onPeriod,
  compareNames,
}: BondDetailSubtoolbarProps) {
  const color = BOND_TYPE_COLOR[bondType]

  return (
    <div
      className="flex items-center gap-3 px-5 flex-shrink-0 bg-[#fafafa]"
      style={{ height: 40, borderBottom: "0.5px solid #f0f0f0" }}
    >
      {/* Tipo de gráfica */}
      <div className="flex gap-0.5 bg-[#eeecfc] rounded-[8px] p-0.5">
        {CHART_OPTS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChartType(opt.value)}
            className="px-3 py-1 rounded-[6px] text-[10px] transition-colors"
            style={{
              background: chartType === opt.value ? "#534AB7" : "transparent",
              color:      chartType === opt.value ? "#fff"    : "#888",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div style={{ width: "0.5px", height: 16, background: "#e2e2ef" }}/>

      {/* Período */}
      <div className="flex gap-0.5 bg-[#eeecfc] rounded-[8px] p-0.5">
        {PERIOD_OPTS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onPeriod(opt.value)}
            className="px-2.5 py-1 rounded-[6px] text-[10px] transition-colors"
            style={{
              background: period === opt.value ? "#534AB7" : "transparent",
              color:      period === opt.value ? "#fff"    : "#888",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1"/>

      {/* Leyenda */}
      <div className="flex items-center gap-3 text-[10px] text-[#888]">
        <span className="flex items-center gap-1.5">
          <svg width="16" height="4" viewBox="0 0 16 4">
            <line x1="0" y1="2" x2="16" y2="2" stroke="#534AB7" strokeWidth="1.2" strokeDasharray="3 2" opacity="0.5"/>
          </svg>
          Yo (ref.)
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="16" height="4" viewBox="0 0 16 4">
            <line x1="0" y1="2" x2="16" y2="2" stroke={color} strokeWidth="2"/>
          </svg>
          {bondName}
        </span>
        {compareNames.map((name, i) => (
          <span key={i} className="flex items-center gap-1.5 opacity-70">
            <svg width="16" height="4" viewBox="0 0 16 4">
              <line x1="0" y1="2" x2="16" y2="2" stroke="#888" strokeWidth="2"/>
            </svg>
            {name}
          </span>
        ))}
      </div>
    </div>
  )
}
