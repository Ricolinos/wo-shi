// src/components/bonds/BondsTimeline.tsx
// Vista timeline de /bonds. Eje Y centrado en 0 (-10 a +10).
// Cada vínculo = una línea coloreada por tipo. Hover = tooltip.
// Clic en línea = navegar a /bonds/[id].
"use client"

import { useState, useRef } from "react"
import { useRouter }         from "next/navigation"
import { BOND_TYPE_COLOR, proximityToVisual } from "@/lib/bond-subtypes"
import type { BondSummary } from "@/types/bonds"

interface BondsTimelineProps {
  bonds: BondSummary[]
}

interface Tooltip {
  x: number
  y: number
  name: string
  date: Date
  proximity: number
  intensity: number
}

// Altura del área de gráfica en unidades SVG
const CHART_H = 200
const CHART_TOP = 20    // espacio para label "+10"
const CHART_BOT = 20    // espacio para eje X
const LABEL_W   = 52    // ancho para labels del eje Y
const LABEL_RIGHT = 72  // ancho para etiquetas al final de cada línea

export function BondsTimeline({ bonds }: BondsTimelineProps) {
  const router  = useRouter()
  const svgRef  = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)

  // Filtrar bonds que tienen snapshots
  const active = bonds.filter(b => b.recentSnapshots.length > 0)

  if (active.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[13px] text-[#9999aa]">No hay datos de evolución en este período.</p>
      </div>
    )
  }

  // Recolectar todas las fechas para el eje X
  const allDates = active
    .flatMap(b => b.recentSnapshots.map(s => new Date(s.date).getTime()))
  const minTime = Math.min(...allDates)
  const maxTime = Math.max(...allDates)
  const timeRange = maxTime - minTime || 1

  function dateToX(date: Date, svgWidth: number): number {
    const t = new Date(date).getTime()
    const availW = svgWidth - LABEL_W - LABEL_RIGHT
    return LABEL_W + ((t - minTime) / timeRange) * availW
  }

  // Mapear visual (-10 a +10) a coordenada Y
  function visualToY(visual: number): number {
    // visual=+10 → y=CHART_TOP, visual=-10 → y=CHART_TOP+CHART_H
    return CHART_TOP + ((10 - visual) / 20) * CHART_H
  }

  const yZero  = visualToY(0)
  const yPlus5 = visualToY(5)
  const yMinus5 = visualToY(-5)

  return (
    <div className="flex-1 overflow-auto p-6">
      <svg
        ref={svgRef}
        width="100%"
        height={CHART_TOP + CHART_H + CHART_BOT + 20}
        style={{ overflow: "visible" }}
      >
        {/* Renderizado dinámico — el SVG necesita saber su ancho real */}
        {/* Usamos un foreignObject trick: renderizamos con viewBox y preserveAspectRatio */}
        <SVGContent
          active={active}
          dateToX={dateToX}
          visualToY={visualToY}
          yZero={yZero}
          yPlus5={yPlus5}
          yMinus5={yMinus5}
          tooltip={tooltip}
          setTooltip={setTooltip}
          onBondClick={id => router.push(`/bonds/${id}`)}
        />
      </svg>
    </div>
  )
}

// Componente interno para el contenido SVG
// Se separa para poder usar hooks dentro de un SVG sin problemas
function SVGContent({
  active,
  dateToX,
  visualToY,
  yZero,
  yPlus5,
  yMinus5,
  tooltip,
  setTooltip,
  onBondClick,
}: {
  active:       BondSummary[]
  dateToX:      (d: Date, w: number) => number
  visualToY:    (v: number) => number
  yZero:        number
  yPlus5:       number
  yMinus5:      number
  tooltip:      Tooltip | null
  setTooltip:   (t: Tooltip | null) => void
  onBondClick:  (id: string) => void
}) {
  // Usamos un ancho fijo para las coordenadas SVG
  const SVG_W = 900

  return (
    <>
      {/* Eje Y labels */}
      <text x={LABEL_W - 6} y={CHART_TOP + 4}   textAnchor="end" fontSize="9" fill="#bbb">+10</text>
      <text x={LABEL_W - 6} y={yPlus5 + 4}       textAnchor="end" fontSize="9" fill="#bbb">+5</text>
      <text x={LABEL_W - 6} y={yZero + 4}         textAnchor="end" fontSize="9" fill="#999" fontWeight="500">0</text>
      <text x={LABEL_W - 6} y={yMinus5 + 4}       textAnchor="end" fontSize="9" fill="#bbb">-5</text>
      <text x={LABEL_W - 6} y={CHART_TOP + CHART_H + 4} textAnchor="end" fontSize="9" fill="#bbb">-10</text>
      <text x={SVG_W - LABEL_RIGHT + 4} y={CHART_TOP + 4} fontSize="8" fill="#ccc" fontStyle="italic">muy cercano</text>
      <text x={SVG_W - LABEL_RIGHT + 4} y={CHART_TOP + CHART_H + 4} fontSize="8" fill="#ccc" fontStyle="italic">muy lejano</text>

      {/* Grid lines */}
      <line x1={LABEL_W} y1={CHART_TOP}            x2={SVG_W - LABEL_RIGHT} y2={CHART_TOP}            stroke="#f0f0f0" strokeWidth="0.5"/>
      <line x1={LABEL_W} y1={yPlus5}               x2={SVG_W - LABEL_RIGHT} y2={yPlus5}               stroke="#f0f0f0" strokeWidth="0.5"/>
      <line x1={LABEL_W} y1={CHART_TOP + CHART_H}  x2={SVG_W - LABEL_RIGHT} y2={CHART_TOP + CHART_H}  stroke="#f0f0f0" strokeWidth="0.5"/>
      <line x1={LABEL_W} y1={yMinus5}              x2={SVG_W - LABEL_RIGHT} y2={yMinus5}              stroke="#f0f0f0" strokeWidth="0.5"/>

      {/* Zona neutral sombreada */}
      <rect x={LABEL_W} y={yPlus5} width={SVG_W - LABEL_W - LABEL_RIGHT} height={yMinus5 - yPlus5}
        fill="#f7f7fc" opacity="0.7"/>

      {/* Línea 0 */}
      <line x1={LABEL_W} y1={yZero} x2={SVG_W - LABEL_RIGHT} y2={yZero} stroke="#e0e0ec" strokeWidth="1.2"/>

      {/* Líneas de cada bond */}
      {active.map(bond => {
        const color = BOND_TYPE_COLOR[bond.type]
        const snaps = bond.recentSnapshots
        if (snaps.length === 0) return null

        const points = snaps.map(s => {
          const x = dateToX(s.date, SVG_W)
          const y = visualToY(proximityToVisual(s.proximity))
          return { x, y, s }
        })

        const polyPoints = points.map(p => `${p.x},${p.y}`).join(" ")
        const last = points[points.length - 1]

        return (
          <g key={bond.id}>
            <polyline
              points={polyPoints}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ cursor: "pointer" }}
              onClick={() => onBondClick(bond.id)}
            />
            {/* Puntos interactivos */}
            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="4"
                fill={color}
                opacity="0"
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setTooltip({
                  x: p.x, y: p.y,
                  name: bond.name,
                  date: new Date(p.s.date),
                  proximity: p.s.proximity,
                  intensity: p.s.intensity,
                })}
                onMouseLeave={() => setTooltip(null)}
                onClick={() => onBondClick(bond.id)}
              />
            ))}
            {/* Punto final visible */}
            <circle cx={last.x} cy={last.y} r="4" fill={color} style={{ pointerEvents: "none" }}/>
            {/* Etiqueta */}
            <text x={last.x + 8} y={last.y + 4} fontSize="9" fill={color} fontWeight="500">
              {bond.name}
            </text>
          </g>
        )
      })}

      {/* Tooltip */}
      {tooltip && (
        <g>
          <rect
            x={tooltip.x + 8} y={tooltip.y - 26}
            width="130" height="34"
            rx="5" fill="#1a1a2e" opacity="0.9"
          />
          <text x={tooltip.x + 14} y={tooltip.y - 12} fontSize="8.5" fill="white">
            {tooltip.name} · {new Date(tooltip.date).toLocaleDateString("es", { day: "numeric", month: "short" })}
          </text>
          <text x={tooltip.x + 14} y={tooltip.y + 2} fontSize="8" fill="#aaa">
            cercanía: {proximityToVisual(tooltip.proximity).toFixed(1)} · intensidad: {tooltip.intensity.toFixed(1)}
          </text>
        </g>
      )}
    </>
  )
}
