// src/components/bonds/BondsGraph.tsx
// Vista grafo de /bonds. Usuario al centro.
// Distancia = presencia (entryCount). Grosor = intensidad. Tamaño = antigüedad.
"use client"

import { useRouter } from "next/navigation"
import { BOND_TYPE_COLOR } from "@/lib/bond-subtypes"
import type { BondSummary } from "@/types/bonds"
import type { BondType }    from "@prisma/client"

interface BondsGraphProps {
  bonds: BondSummary[]
}

const SVG_W    = 600
const SVG_H    = 500
const CX       = SVG_W / 2
const CY       = SVG_H / 2
const R_MIN    = 70   // radio mínimo (presencia alta = muy cerca)
const R_MAX    = 220  // radio máximo (presencia baja = lejos)
const NODE_MIN = 10   // tamaño mínimo de nodo (bond reciente)
const NODE_MAX = 22   // tamaño máximo de nodo (bond antiguo)
const LINE_MIN = 1.2  // grosor mínimo de línea (intensidad baja)
const LINE_MAX = 5    // grosor máximo de línea (intensidad alta)

function getInitials(name: string): string {
  const parts = name.trim().split(" ")
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

const SQUARE_TYPES: BondType[] = ["IDEA", "BELIEF", "EMOTION", "PLACE", "GROUP", "OTHER"]

export function BondsGraph({ bonds }: BondsGraphProps) {
  const router = useRouter()

  if (bonds.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[13px] text-[#9999aa]">No hay vínculos que mostrar.</p>
      </div>
    )
  }

  const maxEntries = Math.max(...bonds.map(b => b.entryCount), 1)
  const maxAge     = Math.max(...bonds.map(b =>
    Date.now() - new Date(b.createdAt).getTime()
  ), 1)

  // Calcular posición, tamaño y grosor para cada bond
  const nodes = bonds.map((bond, i) => {
    const angle    = (i / bonds.length) * 2 * Math.PI - Math.PI / 2
    // presencia alta → distancia baja (cerca del centro)
    const presence = bond.entryCount / maxEntries  // 0-1
    const radius   = R_MAX - presence * (R_MAX - R_MIN)
    const x        = CX + Math.cos(angle) * radius
    const y        = CY + Math.sin(angle) * radius

    // tamaño = antigüedad
    const ageRatio = (Date.now() - new Date(bond.createdAt).getTime()) / maxAge
    const nodeR    = NODE_MIN + ageRatio * (NODE_MAX - NODE_MIN)

    // grosor = intensidad promedio
    const intensity = bond.lastSnapshot?.intensity ?? 5
    const lineW     = LINE_MIN + ((intensity - 1) / 9) * (LINE_MAX - LINE_MIN)

    return { bond, x, y, nodeR, lineW, angle }
  })

  return (
    <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ maxWidth: 600, maxHeight: 500 }}
      >
        {/* Círculos de referencia */}
        <circle cx={CX} cy={CY} r={R_MIN + (R_MAX - R_MIN) * 0.33}
          fill="none" stroke="#f0f0f0" strokeWidth="0.5" strokeDasharray="3 3"/>
        <circle cx={CX} cy={CY} r={R_MIN + (R_MAX - R_MIN) * 0.75}
          fill="none" stroke="#f0f0f0" strokeWidth="0.5" strokeDasharray="3 3"/>

        {/* Líneas de conexión */}
        {nodes.map(({ bond, x, y, lineW }) => (
          <line
            key={`line-${bond.id}`}
            x1={CX} y1={CY} x2={x} y2={y}
            stroke={BOND_TYPE_COLOR[bond.type]}
            strokeWidth={lineW}
            opacity="0.45"
            style={{ pointerEvents: "none" }}
          />
        ))}

        {/* Nodo usuario (centro) */}
        <circle cx={CX} cy={CY} r="22" fill="#534AB7"/>
        <circle cx={CX} cy={CY} r="22" fill="none" stroke="#7F77DD" strokeWidth="2"/>
        <text x={CX} y={CY + 4} textAnchor="middle" fontSize="11" fill="white" fontWeight="500">Yo</text>

        {/* Nodos de bonds */}
        {nodes.map(({ bond, x, y, nodeR }) => {
          const color    = BOND_TYPE_COLOR[bond.type]
          const initials = getInitials(bond.name)
          const isSquare = SQUARE_TYPES.includes(bond.type)
          const fontSize = nodeR * 0.5

          return (
            <g
              key={`node-${bond.id}`}
              style={{ cursor: "pointer" }}
              onClick={() => router.push(`/bonds/${bond.id}`)}
            >
              {isSquare ? (
                <rect
                  x={x - nodeR} y={y - nodeR}
                  width={nodeR * 2} height={nodeR * 2}
                  rx="7" fill={color}
                />
              ) : (
                <circle cx={x} cy={y} r={nodeR} fill={color}/>
              )}
              <text
                x={x} y={y + fontSize * 0.35}
                textAnchor="middle"
                fontSize={fontSize}
                fill="white"
                fontWeight="500"
                style={{ pointerEvents: "none" }}
              >
                {initials}
              </text>
              {/* Etiqueta bajo el nodo */}
              <text
                x={x}
                y={y + nodeR + 12}
                textAnchor="middle"
                fontSize="9"
                fill="#555566"
                style={{ pointerEvents: "none" }}
              >
                {bond.name.length > 10 ? bond.name.slice(0, 9) + "…" : bond.name}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
