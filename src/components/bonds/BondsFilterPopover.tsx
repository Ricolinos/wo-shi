// src/components/bonds/BondsFilterPopover.tsx
// Dropdown de filtros secundarios: subtipo, madurez y período.
// Se abre desde BondsToolbar al hacer clic en el botón "Filtros".
"use client"

import { useRef, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { BOND_SUBTYPES } from "@/lib/bond-subtypes"
import type { BondType } from "@prisma/client"
import type { BondMaturityFilter, BondPeriod } from "@/types/bonds"

interface BondsFilterPopoverProps {
  activeType:    BondType | "ALL"
  activeSubtype: string | null
  activeMaturity: BondMaturityFilter
  activePeriod:  BondPeriod
  onClose:       () => void
}

const MATURITY_OPTIONS: { value: BondMaturityFilter; label: string }[] = [
  { value: "ALL",   label: "Todos" },
  { value: "tags",  label: "Etiquetas" },
  { value: "bonds", label: "Vínculos maduros" },
]

const PERIOD_OPTIONS: { value: BondPeriod; label: string }[] = [
  { value: "3m",  label: "3 meses" },
  { value: "6m",  label: "6 meses" },
  { value: "1y",  label: "1 año" },
  { value: "all", label: "Todo" },
]

export function BondsFilterPopover({
  activeType,
  activeSubtype,
  activeMaturity,
  activePeriod,
  onClose,
}: BondsFilterPopoverProps) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const ref          = useRef<HTMLDivElement>(null)

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [onClose])

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null || value === "ALL" || value === "all") params.delete(key)
    else params.set(key, value)
    router.push(`${pathname}?${params.toString()}`)
  }

  // Subtipos disponibles según tipo activo
  const availableSubtypes = activeType === "ALL"
    ? Object.values(BOND_SUBTYPES).flat()
    : BOND_SUBTYPES[activeType] ?? []

  return (
    <div
      ref={ref}
      className="absolute right-0 top-[calc(100%+6px)] z-50 bg-white rounded-[12px] shadow-lg"
      style={{
        border: "0.5px solid #e2e2ef",
        minWidth: 360,
        padding: "14px 16px",
        display: "flex",
        gap: 20,
      }}
    >
      {/* Subtipo */}
      {availableSubtypes.length > 0 && (
        <div style={{ flex: 1 }}>
          <p className="text-[10px] font-medium text-[#9999aa] uppercase tracking-wide mb-2">Subtipo</p>
          <div className="flex flex-wrap gap-1.5">
            {availableSubtypes.map(sub => (
              <button
                key={sub}
                onClick={() => setParam("subtype", activeSubtype === sub ? null : sub)}
                className="px-2.5 py-1 rounded-full text-[11px] transition-colors"
                style={{
                  background: activeSubtype === sub ? "#eeedfe" : "#f5f5f5",
                  color:      activeSubtype === sub ? "#534AB7" : "#666",
                  border:     "0.5px solid transparent",
                }}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ width: "0.5px", background: "#e2e2ef", alignSelf: "stretch" }} />

      {/* Madurez */}
      <div>
        <p className="text-[10px] font-medium text-[#9999aa] uppercase tracking-wide mb-2">Madurez</p>
        <div className="flex flex-col gap-1.5">
          {MATURITY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setParam("maturity", opt.value)}
              className="px-2.5 py-1 rounded-full text-[11px] transition-colors text-left"
              style={{
                background: activeMaturity === opt.value ? "#eeedfe" : "#f5f5f5",
                color:      activeMaturity === opt.value ? "#534AB7" : "#666",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: "0.5px", background: "#e2e2ef", alignSelf: "stretch" }} />

      {/* Período */}
      <div>
        <p className="text-[10px] font-medium text-[#9999aa] uppercase tracking-wide mb-2">Período</p>
        <div className="flex flex-col gap-1.5">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setParam("period", opt.value)}
              className="px-2.5 py-1 rounded-full text-[11px] transition-colors text-left"
              style={{
                background: activePeriod === opt.value ? "#eeedfe" : "#f5f5f5",
                color:      activePeriod === opt.value ? "#534AB7" : "#666",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
