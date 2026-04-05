// src/components/bonds/BondDetailChart.tsx
// Gráfica principal del perfil de un vínculo.
// Modos: línea, barras y dispersión. Eje Y centrado en 0 (-10/+10).
// Soporta modo comparar: superpone múltiples líneas.
"use client"

import { useState } from "react"
import { BOND_TYPE_COLOR, proximityToVisual } from "@/lib/bond-subtypes"
import type { BondDetail } from "@/types/bonds"
import type { ChartType, BondPeriod } from "@/types/bonds"
import type { BondType } from "@prisma/client"

interface BondDetailChartProps {
  bond:          BondDetail
  chartType:     ChartType
  period:        BondPeriod
  // bonds comparados (puede ser vacío)
  compareBonds:  BondDetail[]
}

interface TooltipState {
  x: number; y: number
  name: string; date: Date
  proximity: number; intensity: number
}

const SVG_W   = 900
const SVG_H   = 220
const PAD_L   = 36
const PAD_R   = 80
const PAD_T   = 16
const PAD_B   = 24

function yFromVisual(visual: number): number {
  // visual +10 → y=PAD_T, visual -10 → y=SVG_H-PAD_B
  const chartH = SVG_H - PAD_T - PAD_B
  return PAD_T + ((10 - visual) / 20) * chartH
}

function filterByPeriod<T extends { date: Date }>(items: T[], period: BondPeriod): T[] {
  if (period === "all") return items
  const d = new Date()
  if (period === "3m") d.setMonth(d.getMonth() - 3)
  if (period === "6m") d.setMonth(d.getMonth() - 6)
  if (period === "1y") d.setFullYear(d.getFullYear() - 1)
  return items.filter(s => new Date(s.date) >= d)
}

export function BondDetailChart({ bond, chartType, period, compareBonds }: BondDetailChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const allBonds  = [bond, ...compareBonds]
  const yZero     = yFromVisual(0)
  const yPlus5    = yFromVisual(5)
  const yMinus5   = yFromVisual(-5)
  const chartW    = SVG_W - PAD_L - PAD_R

  // Calcular rango de fechas
  const allSnaps  = allBonds.flatMap(b => filterByPeriod(b.snapshots.map(s => ({ ...s, date: new Date(s.date) })), period))
  const dates     = allSnaps.map(s => s.date.getTime())
  const minTime   = dates.length ? Math.min(...dates) : Date.now() - 86400000 * 90
  const maxTime   = dates.length ? Math.max(...dates) : Date.now()
  const timeRange = maxTime - minTime || 1

  function dateToX(date: Date): number {
    return PAD_L + ((date.getTime() - minTime) / timeRange) * chartW
  }

  // Etiquetas del eje X
  const xLabels: { x: number; label: string }[] = []
  for (let i = 0; i <= 4; i++) {
    const t = minTime + (timeRange * i) / 4
    xLabels.push({
      x: PAD_L + (chartW * i) / 4,
      label: new Date(t).toLocaleDateString("es", { month: "short", day: "numeric" }),
    })
  }

  function renderLine(b: BondDetail, isBase: boolean) {
    const color = BOND_TYPE_COLOR[b.type as BondType]
    const snaps = filterByPeriod(b.snapshots.map(s => ({ ...s, date: new Date(s.date) })), period)
    if (snaps.length === 0) return null

    const points = snaps.map(s => ({
      x: dateToX(s.date),
      y: yFromVisual(proximityToVisual(s.proximity)),
      s,
    }))

    return (
      <g key={b.id}>
        <polyline
          points={points.map(p => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke={color}
          strokeWidth={isBase ? 2 : 1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={isBase ? 1 : 0.75}
        />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={5} fill={color} opacity={0}
            style={{ cursor: "crosshair" }}
            onMouseEnter={() => setTooltip({ x: p.x, y: p.y, name: b.name, date: p.s.date, proximity: p.s.proximity, intensity: p.s.intensity })}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
        <circle cx={points.at(-1)!.x} cy={points.at(-1)!.y} r="4" fill={color} style={{ pointerEvents: "none" }}/>
      </g>
    )
  }

  function renderBars(b: BondDetail, isBase: boolean) {
    const color = BOND_TYPE_COLOR[b.type as BondType]
    const snaps = filterByPeriod(b.snapshots.map(s => ({ ...s, date: new Date(s.date) })), period)
    if (snaps.length === 0) return null
    const barW = Math.min(12, chartW / (snaps.length + 1))
    const offset = isBase ? -barW / 2 - 1 : barW / 2 + 1

    return (
      <g key={b.id}>
        {snaps.map((s, i) => {
          const x     = dateToX(s.date) + offset
          const visual = proximityToVisual(s.proximity)
          const y     = visual >= 0 ? yFromVisual(visual) : yZero
          const h     = Math.abs(yFromVisual(visual) - yZero)
          return (
            <rect key={i} x={x - barW / 2} y={y} width={barW} height={Math.max(h, 2)}
              fill={color} opacity={isBase ? 0.8 : 0.5} rx="2"/>
          )
        })}
      </g>
    )
  }

  function renderScatter(b: BondDetail, isBase: boolean) {
    const color = BOND_TYPE_COLOR[b.type as BondType]
    const snaps = filterByPeriod(b.snapshots.map(s => ({ ...s, date: new Date(s.date) })), period)
    if (snaps.length === 0) return null

    return (
      <g key={b.id}>
        {snaps.map((s, i) => {
          const x = dateToX(s.date)
          const y = yFromVisual(proximityToVisual(s.proximity))
          const r = 3 + (s.intensity / 10) * 5
          return (
            <circle key={i} cx={x} cy={y} r={r} fill={color} opacity={isBase ? 0.75 : 0.5}
              style={{ cursor: "crosshair" }}
              onMouseEnter={() => setTooltip({ x, y, name: b.name, date: s.date, proximity: s.proximity, intensity: s.intensity })}
              onMouseLeave={() => setTooltip(null)}
            />
          )
        })}
      </g>
    )
  }

  return (
    <div className="flex-1 overflow-hidden p-5">
      <svg width="100%" height="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ overflow: "visible" }}>
        {/* Eje Y */}
        <text x={PAD_L - 6} y={PAD_T + 4}             textAnchor="end" fontSize="9" fill="#bbb">+10</text>
        <text x={PAD_L - 6} y={yPlus5 + 4}             textAnchor="end" fontSize="9" fill="#bbb">+5</text>
        <text x={PAD_L - 6} y={yZero + 4}              textAnchor="end" fontSize="9" fill="#999" fontWeight="500">0</text>
        <text x={PAD_L - 6} y={yMinus5 + 4}            textAnchor="end" fontSize="9" fill="#bbb">-5</text>
        <text x={PAD_L - 6} y={SVG_H - PAD_B + 4}      textAnchor="end" fontSize="9" fill="#bbb">-10</text>

        {/* Grid */}
        <line x1={PAD_L} y1={PAD_T}            x2={SVG_W - PAD_R} y2={PAD_T}            stroke="#f0f0f0" strokeWidth="0.5"/>
        <line x1={PAD_L} y1={yPlus5}            x2={SVG_W - PAD_R} y2={yPlus5}           stroke="#f0f0f0" strokeWidth="0.5"/>
        <line x1={PAD_L} y1={SVG_H - PAD_B}     x2={SVG_W - PAD_R} y2={SVG_H - PAD_B}   stroke="#f0f0f0" strokeWidth="0.5"/>
        <line x1={PAD_L} y1={yMinus5}           x2={SVG_W - PAD_R} y2={yMinus5}          stroke="#f0f0f0" strokeWidth="0.5"/>
        <rect x={PAD_L} y={yPlus5} width={chartW} height={yMinus5 - yPlus5} fill="#f7f7fc" opacity="0.7"/>
        <line x1={PAD_L} y1={yZero} x2={SVG_W - PAD_R} y2={yZero} stroke="#e0e0ec" strokeWidth="1.2"/>

        {/* Línea ref. usuario */}
        <line x1={PAD_L} y1={yZero} x2={SVG_W - PAD_R} y2={yZero}
          stroke="#534AB7" strokeWidth="1" strokeDasharray="5 3" opacity="0.4"/>

        {/* Eje X fechas */}
        {xLabels.map((l, i) => (
          <text key={i} x={l.x} y={SVG_H - 4} textAnchor="middle" fontSize="8" fill="#bbb">{l.label}</text>
        ))}

        {/* Series */}
        {allBonds.map((b, i) =>
          chartType === "line"    ? renderLine(b, i === 0) :
          chartType === "bars"    ? renderBars(b, i === 0) :
          renderScatter(b, i === 0)
        )}

        {/* Tooltip */}
        {tooltip && (
          <g>
            <rect x={tooltip.x + 8} y={tooltip.y - 28} width={145} height={36} rx="5" fill="#1a1a2e" opacity="0.9"/>
            <text x={tooltip.x + 15} y={tooltip.y - 13} fontSize="8.5" fill="white">
              {tooltip.name} · {new Date(tooltip.date).toLocaleDateString("es", { day: "numeric", month: "short" })}
            </text>
            <text x={tooltip.x + 15} y={tooltip.y + 2} fontSize="8" fill="#aaa">
              cercanía: {proximityToVisual(tooltip.proximity).toFixed(1)} · int: {tooltip.intensity.toFixed(1)}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
