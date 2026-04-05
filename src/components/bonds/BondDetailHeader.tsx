// src/components/bonds/BondDetailHeader.tsx
// Header del perfil de un vínculo: avatar, nombre, métricas rápidas,
// botón Comparar y botón + entrada.
"use client"

import Link              from "next/link"
import { BondAvatar }    from "@/components/bonds/BondAvatar"
import { BOND_TYPE_COLOR, BOND_TYPE_LABEL, BOND_TYPE_BG, proximityToVisual } from "@/lib/bond-subtypes"
import type { BondDetail } from "@/types/bonds"

interface BondDetailHeaderProps {
  bond:         BondDetail
  compareActive: boolean
  onCompare:    () => void
  bondsHref:    string  // URL de retorno a /bonds con searchParams preservados
}

export function BondDetailHeader({ bond, compareActive, onCompare, bondsHref }: BondDetailHeaderProps) {
  const color          = BOND_TYPE_COLOR[bond.type]
  const lastVisual     = proximityToVisual(bond.lastProximity)
  const proximityLabel = lastVisual >= 0 ? `+${lastVisual.toFixed(1)}` : lastVisual.toFixed(1)

  const sinceDate = new Date(bond.createdAt).toLocaleDateString("es", {
    month: "short",
    year: "numeric",
  })

  return (
    <div
      className="flex items-center gap-3 px-5 flex-shrink-0 bg-white"
      style={{ height: 60, borderBottom: "0.5px solid #e2e2ef" }}
    >
      {/* Botón atrás */}
      <Link
        href={bondsHref}
        className="flex items-center gap-1 text-[11px] text-[#9999aa] hover:text-[#534AB7] transition-colors flex-shrink-0"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        Vínculos
      </Link>

      <div style={{ width: "0.5px", height: 20, background: "#e2e2ef", flexShrink: 0 }}/>

      {/* Avatar */}
      <BondAvatar name={bond.name} type={bond.type} avatar={bond.avatar} size={36} />

      {/* Nombre + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-[#1a1a2e] leading-tight truncate">{bond.name}</p>
        <p className="text-[10px] text-[#9999aa]">
          {BOND_TYPE_LABEL[bond.type]}
          {bond.subtype && ` · ${bond.subtype}`}
          {" · vínculo desde "}
          {sinceDate}
        </p>
      </div>

      {/* Chips métricas */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px]"
          style={{ background: BOND_TYPE_BG[bond.type], color }}
        >
          <span className="font-medium">{bond.avgIntensity.toFixed(1)}</span>
          <span className="opacity-70">intensidad</span>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-[#eeedfe] text-[#534AB7]">
          <span className="font-medium">{proximityLabel}</span>
          <span className="opacity-70">cercanía</span>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-[#f5f5f5] text-[#666]">
          <span className="font-medium">{bond.entryCount}</span>
          <span className="opacity-70">entradas</span>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onCompare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-medium transition-colors"
          style={{
            background: compareActive ? "#3C3489" : "#534AB7",
            color: "#fff",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <circle cx="8"  cy="12" r="5" stroke="white" strokeWidth="1.8"/>
            <circle cx="16" cy="12" r="5" stroke="white" strokeWidth="1.8" opacity="0.6"/>
          </svg>
          Comparar
        </button>
        <Link
          href={`/journal/new?bond=${bond.id}`}
          className="px-3 py-1.5 rounded-[8px] text-[11px] bg-[#f5f5f5] text-[#666] hover:bg-[#eeedfe] hover:text-[#534AB7] transition-colors"
        >
          + entrada
        </Link>
      </div>
    </div>
  )
}
