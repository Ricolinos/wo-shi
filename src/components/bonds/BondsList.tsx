// src/components/bonds/BondsList.tsx
// Vista lista de /bonds. Tabla con columnas ordenables.
// Mini-gráfica de tendencia de cercanía (escala -10/+10, centrada en 0).
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BondAvatar }        from "@/components/bonds/BondAvatar"
import { BOND_TYPE_COLOR, BOND_TYPE_LABEL, BOND_TYPE_BG, proximityToVisual } from "@/lib/bond-subtypes"
import type { BondSummary } from "@/types/bonds"

interface BondsListProps {
  bonds: BondSummary[]
}

type SortKey = "name" | "intensity" | "activity"

function timeAgo(date: Date | null): string {
  if (!date) return "—"
  const diff = Date.now() - new Date(date).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return "hoy"
  if (d === 1) return "ayer"
  if (d < 7)  return `hace ${d}d`
  if (d < 30) return `hace ${Math.floor(d / 7)}sem`
  return `hace ${Math.floor(d / 30)}m`
}

export function BondsList({ bonds }: BondsListProps) {
  const router  = useRouter()
  const [sort, setSort] = useState<SortKey>("activity")

  const sorted = [...bonds].sort((a, b) => {
    if (sort === "name")      return a.name.localeCompare(b.name)
    if (sort === "intensity") return (b.lastSnapshot?.intensity ?? 0) - (a.lastSnapshot?.intensity ?? 0)
    // activity: por fecha de última actividad
    const aDate = a.lastActivityDate ? new Date(a.lastActivityDate).getTime() : 0
    const bDate = b.lastActivityDate ? new Date(b.lastActivityDate).getTime() : 0
    return bDate - aDate
  })

  if (bonds.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[13px] text-[#9999aa]">No hay vínculos con estos filtros.</p>
      </div>
    )
  }

  function ColHeader({ label, sortKey }: { label: string; sortKey: SortKey }) {
    const active = sort === sortKey
    return (
      <button
        onClick={() => setSort(sortKey)}
        className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide transition-colors"
        style={{ color: active ? "#534AB7" : "#9999aa" }}
      >
        {label}
        {active && <span className="text-[10px]">↕</span>}
      </button>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div
        className="grid items-center px-4 py-2 sticky top-0 bg-white z-10"
        style={{
          gridTemplateColumns: "1.8fr 90px 1.4fr 90px 70px",
          gap: 12,
          borderBottom: "0.5px solid #e2e2ef",
        }}
      >
        <ColHeader label="Vínculo"    sortKey="name" />
        <span className="text-[10px] font-medium text-[#9999aa] uppercase tracking-wide">Tipo</span>
        <span className="text-[10px] font-medium text-[#9999aa] uppercase tracking-wide">Evolución</span>
        <ColHeader label="Intensidad" sortKey="intensity" />
        <ColHeader label="Actividad"  sortKey="activity" />
      </div>

      {/* Filas */}
      {sorted.map(bond => {
        const color     = BOND_TYPE_COLOR[bond.type]
        const intensity = bond.lastSnapshot?.intensity ?? 0
        const snaps     = bond.recentSnapshots

        return (
          <div
            key={bond.id}
            onClick={() => router.push(`/bonds/${bond.id}`)}
            className="grid items-center px-4 cursor-pointer transition-colors hover:bg-[#fafafa]"
            style={{
              gridTemplateColumns: "1.8fr 90px 1.4fr 90px 70px",
              gap: 12,
              padding: "10px 16px",
              borderBottom: "0.5px solid #f5f5f5",
            }}
          >
            {/* Vínculo */}
            <div className="flex items-center gap-2.5 min-w-0">
              <BondAvatar name={bond.name} type={bond.type} avatar={bond.avatar} size={36} />
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-[#1a1a2e] truncate">{bond.name}</p>
                <p className="text-[10px] text-[#9999aa]">{bond.subtype ?? BOND_TYPE_LABEL[bond.type]}</p>
              </div>
            </div>

            {/* Tipo chip */}
            <div>
              <span
                className="px-2 py-0.5 rounded-full text-[10px]"
                style={{ background: BOND_TYPE_BG[bond.type], color }}
              >
                {BOND_TYPE_LABEL[bond.type]}
              </span>
            </div>

            {/* Evolución mini-gráfica */}
            <div>
              {snaps.length > 0 ? (
                <svg width="100%" height="32" viewBox={`0 0 180 32`} preserveAspectRatio="none">
                  {/* zona neutral */}
                  <rect x="0" y="10" width="180" height="12" fill="#f7f7fc"/>
                  {/* línea 0 */}
                  <line x1="0" y1="16" x2="180" y2="16" stroke="#e0e0ec" strokeWidth="0.8"/>
                  <polyline
                    points={snaps.map((s, i) => {
                      const x = snaps.length === 1 ? 90 : (i / (snaps.length - 1)) * 170 + 5
                      // mapear proximity a y: 0 (visual) → y=16, +10 → y=4, -10 → y=28
                      const visual = proximityToVisual(s.proximity)
                      const y = 16 - (visual / 10) * 12
                      return `${x},${y}`
                    }).join(" ")}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {snaps.length > 0 && (() => {
                    const last = snaps[snaps.length - 1]
                    const visual = proximityToVisual(last.proximity)
                    const y = 16 - (visual / 10) * 12
                    return <circle cx="175" cy={y} r="3" fill={color}/>
                  })()}
                </svg>
              ) : (
                <span className="text-[10px] text-[#9999aa]">sin datos</span>
              )}
            </div>

            {/* Intensidad */}
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-1 bg-[#f0f0f0] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(intensity / 10) * 100}%`, background: color }}
                />
              </div>
              <span className="text-[10px] text-[#9999aa] w-6 text-right">
                {intensity > 0 ? intensity.toFixed(1) : "—"}
              </span>
            </div>

            {/* Actividad */}
            <div>
              <span className="text-[10px] text-[#9999aa]">
                {timeAgo(bond.lastActivityDate)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
