"use client"

import { useRouter } from "next/navigation"
import { Text } from "@once-ui-system/core"

// Referencia de "ahora" fijada a nivel de módulo (no impura durante el render);
// alcanza para el tamaño decorativo de los nodos por antigüedad.
const NOW = Date.now()
import type { BondSummary } from "@/types/bonds"

const SVG_W = 600
const SVG_H = 460
const CX = SVG_W / 2
const CY = SVG_H / 2
const R_MIN = 70
const R_MAX = 200
const NODE_MIN = 14
const NODE_MAX = 30

// Colores fijos por rol semántico — coinciden con BOND_TYPE_SCHEME pero como
// hex, porque un <circle fill> de SVG no puede resolver tokens CSS de Once UI.
const SCHEME_HEX: Record<string, string> = {
  warning: "#c2701c", danger: "#c23b5a", accent: "#5b52c9",
  success: "#1f9e6c", info: "#3574c9", neutral: "#8a8a99",
}
import { BOND_TYPE_SCHEME } from "@/lib/bond-subtypes"

export function BondsGraph({ bonds }: { bonds: BondSummary[] }) {
  const router = useRouter()

  const maxEntries = Math.max(...bonds.map(b => b.entryCount), 1)
  const maxAge = Math.max(...bonds.map(b => NOW - new Date(b.createdAt).getTime()), 1)

  const nodes = bonds.map((bond, i) => {
    const angle = (i / bonds.length) * 2 * Math.PI - Math.PI / 2
    const presence = bond.entryCount / maxEntries
    const radius = R_MAX - presence * (R_MAX - R_MIN)
    const x = CX + Math.cos(angle) * radius
    const y = CY + Math.sin(angle) * radius
    const ageRatio = (NOW - new Date(bond.createdAt).getTime()) / maxAge
    const nodeSize = NODE_MIN + ageRatio * (NODE_MAX - NODE_MIN)
    const color = SCHEME_HEX[BOND_TYPE_SCHEME[bond.type]]
    return { bond, x, y, nodeSize, color }
  })

  if (bonds.length === 0) {
    return <Text variant="body-default-m" onBackground="neutral-weak">No hay vínculos que mostrar.</Text>
  }

  return (
    <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ maxWidth: 700 }}>
      <circle cx={CX} cy={CY} r={R_MIN} fill="none" stroke="var(--neutral-alpha-weak)" strokeDasharray="3 3" />
      <circle cx={CX} cy={CY} r={R_MAX} fill="none" stroke="var(--neutral-alpha-weak)" strokeDasharray="3 3" />

      {nodes.map(({ bond, x, y }) => (
        <line key={`line-${bond.id}`} x1={CX} y1={CY} x2={x} y2={y} stroke="var(--neutral-alpha-medium)" strokeWidth={1 + (bond.lastSnapshot?.intensity ?? 1) / 2.5} />
      ))}

      <circle cx={CX} cy={CY} r={18} fill="var(--brand-solid-strong)" />
      <text x={CX} y={CY + 4} textAnchor="middle" fontSize="10" fill="var(--brand-on-solid-strong)">Tú</text>

      {nodes.map(({ bond, x, y, nodeSize, color }) => (
        <g key={bond.id} style={{ cursor: "pointer" }} onClick={() => router.push(`/bonds/${bond.id}`)}>
          <circle cx={x} cy={y} r={nodeSize} fill={color} />
          <text x={x} y={y + nodeSize + 12} textAnchor="middle" fontSize="10" fill="var(--neutral-on-background-weak)">
            {bond.name.length > 12 ? bond.name.slice(0, 12) + "…" : bond.name}
          </text>
        </g>
      ))}
    </svg>
  )
}
