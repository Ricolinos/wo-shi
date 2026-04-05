// src/components/bonds/BondsToolbar.tsx
// Barra superior de /bonds: toggles de vista (timeline/grafo/lista) +
// chips de tipo de bond (scroll horizontal) + botón Filtros que abre popover.
"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { BondsFilterPopover } from "@/components/bonds/BondsFilterPopover"
import { BOND_TYPE_LABEL }    from "@/lib/bond-subtypes"
import type { BondType }      from "@prisma/client"
import type { BondsView, BondsFilters } from "@/types/bonds"

interface BondsToolbarProps {
  filters: BondsFilters
}

const TYPE_TABS: { value: BondType | "ALL"; label: string }[] = [
  { value: "ALL",     label: "Todos" },
  { value: "PERSON",  label: BOND_TYPE_LABEL.PERSON },
  { value: "EMOTION", label: BOND_TYPE_LABEL.EMOTION },
  { value: "IDEA",    label: BOND_TYPE_LABEL.IDEA },
  { value: "BELIEF",  label: BOND_TYPE_LABEL.BELIEF },
  { value: "PLACE",   label: BOND_TYPE_LABEL.PLACE },
  { value: "GROUP",   label: BOND_TYPE_LABEL.GROUP },
  { value: "OTHER",   label: BOND_TYPE_LABEL.OTHER },
]

const VIEW_ICONS: Record<BondsView, React.ReactNode> = {
  timeline: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <line x1="3" y1="7"  x2="21" y2="7"  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <line x1="3" y1="17" x2="21" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
    </svg>
  ),
  graph: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" fill="currentColor"/>
      <circle cx="12" cy="4"  r="2" fill="currentColor" opacity="0.6"/>
      <circle cx="20" cy="17" r="2" fill="currentColor" opacity="0.6"/>
      <circle cx="4"  cy="17" r="2" fill="currentColor" opacity="0.6"/>
      <line x1="12" y1="9"  x2="12" y2="6"  stroke="currentColor" strokeWidth="1.5"/>
      <line x1="14.5" y1="13.5" x2="18.5" y2="15.5" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="9.5"  y1="13.5" x2="5.5"  y2="15.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  list: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <line x1="4" y1="7"  x2="20" y2="7"  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="4" y1="17" x2="14" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
}

export function BondsToolbar({ filters }: BondsToolbarProps) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [popoverOpen, setPopoverOpen] = useState(false)

  const barRef      = useRef<HTMLDivElement>(null)
  const [canLeft,  setCanLeft]  = useState(false)
  const [canRight, setCanRight] = useState(false)

  const updateArrows = useCallback(() => {
    const el = barRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  useEffect(() => {
    const el = barRef.current
    if (!el) return
    updateArrows()
    el.addEventListener("scroll", updateArrows)
    window.addEventListener("resize", updateArrows)
    return () => {
      el.removeEventListener("scroll", updateArrows)
      window.removeEventListener("resize", updateArrows)
    }
  }, [updateArrows])

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === "ALL") params.delete(key)
    else params.set(key, value)
    router.push(`${pathname}?${params.toString()}`)
  }

  function scroll(dir: 1 | -1) {
    barRef.current?.scrollBy({ left: dir * 180, behavior: "smooth" })
  }

  // Hay filtros secundarios activos
  const hasSecondaryFilters =
    filters.subtype !== null ||
    filters.maturity !== "ALL" ||
    filters.period !== "3m"

  return (
    <div
      className="flex items-stretch flex-shrink-0 bg-white"
      style={{ height: 48, borderBottom: "0.5px solid #e2e2ef" }}
    >
      {/* Título */}
      <div className="flex items-center px-5 flex-shrink-0" style={{ borderRight: "0.5px solid #e2e2ef" }}>
        <span className="text-[13px] font-medium text-[#1a1a2e]">Vínculos</span>
      </div>

      {/* View toggles */}
      <div className="flex items-center px-3 flex-shrink-0" style={{ borderRight: "0.5px solid #e2e2ef" }}>
        <div className="flex gap-0.5 bg-[#f0f0f8] rounded-[8px] p-0.5">
          {(["timeline", "graph", "list"] as BondsView[]).map(v => (
            <button
              key={v}
              onClick={() => setParam("view", v === "list" ? null : v)}
              title={v === "timeline" ? "Línea de tiempo" : v === "graph" ? "Grafo" : "Lista"}
              className="w-8 h-7 rounded-[6px] flex items-center justify-center transition-colors"
              style={{
                background: filters.view === v ? "#534AB7" : "transparent",
                color:      filters.view === v ? "#fff"    : "#999",
              }}
            >
              {VIEW_ICONS[v]}
            </button>
          ))}
        </div>
      </div>

      {/* Chips de tipo — scroll horizontal */}
      <div className="group/bar relative flex-1 overflow-hidden flex items-stretch">
        {/* degradados */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 z-10 transition-opacity duration-200"
          style={{ background: "linear-gradient(to right, white 20%, transparent)", opacity: canLeft ? 1 : 0 }} />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 z-10 transition-opacity duration-200"
          style={{ background: "linear-gradient(to left, white 20%, transparent)", opacity: canRight ? 1 : 0 }} />

        {canLeft && (
          <button onClick={() => scroll(-1)}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-[22px] h-[22px] rounded-full bg-white flex items-center justify-center text-[13px] text-[#555] opacity-0 group-hover/bar:opacity-100 transition-opacity"
            style={{ border: "0.5px solid #e2e2ef", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>‹</button>
        )}
        {canRight && (
          <button onClick={() => scroll(1)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-[22px] h-[22px] rounded-full bg-white flex items-center justify-center text-[13px] text-[#555] opacity-0 group-hover/bar:opacity-100 transition-opacity"
            style={{ border: "0.5px solid #e2e2ef", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>›</button>
        )}

        <div ref={barRef}
          className="flex items-center gap-1 overflow-x-auto px-3 flex-1"
          style={{ scrollbarWidth: "none" }}>
          {TYPE_TABS.map(tab => {
            const active = tab.value === filters.type
            return (
              <button
                key={tab.value}
                onClick={() => setParam("type", tab.value)}
                className="px-3 py-1 rounded-full text-[11px] whitespace-nowrap flex-shrink-0 transition-colors"
                style={{
                  background: active ? "#534AB7" : "#f5f5f5",
                  color:      active ? "#fff"    : "#666",
                  fontWeight: active ? 500 : 400,
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Botón Filtros */}
      <div className="relative flex items-center px-3 flex-shrink-0" style={{ borderLeft: "0.5px solid #e2e2ef" }}>
        <button
          onClick={() => setPopoverOpen(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] transition-colors"
          style={{
            background: hasSecondaryFilters ? "#eeedfe" : "#f5f5f5",
            color:      hasSecondaryFilters ? "#534AB7" : "#666",
            border:     hasSecondaryFilters ? "0.5px solid #cac7f4" : "0.5px solid transparent",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M7 12h10M11 18h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          Filtros
          {hasSecondaryFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#534AB7]" />
          )}
        </button>

        {popoverOpen && (
          <BondsFilterPopover
            activeType={filters.type}
            activeSubtype={filters.subtype}
            activeMaturity={filters.maturity}
            activePeriod={filters.period}
            onClose={() => setPopoverOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
