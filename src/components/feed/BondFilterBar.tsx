// src/components/feed/BondFilterBar.tsx
// Barra de tabs de filtro por tipo de vínculo.
// Scroll horizontal con flechas que aparecen al hover y degradados en los bordes.
"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import type { BondType } from "@prisma/client"

type Tab = {
  value: BondType | "ALL"
  label: string
  icon: React.ReactNode
}

const TABS: Tab[] = [
  {
    value: "ALL",
    label: "Todos",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2"   width="9" height="9" rx="2" fill="currentColor" opacity=".85"/>
        <rect x="13" y="2"  width="9" height="9" rx="2" fill="currentColor" opacity=".5"/>
        <rect x="2" y="13"  width="9" height="9" rx="2" fill="currentColor" opacity=".5"/>
        <rect x="13" y="13" width="9" height="9" rx="2" fill="currentColor" opacity=".28"/>
      </svg>
    ),
  },
  {
    value: "PERSON",
    label: "Personas",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    value: "EMOTION",
    label: "Emociones",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <path d="M12 21s-8-5.5-8-12a8 8 0 0116 0c0 6.5-8 12-8 12z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    value: "IDEA",
    label: "Ideas",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    ),
  },
  {
    value: "BELIEF",
    label: "Creencias",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <path d="M12 3l2.5 6.5L21 10l-5 4.8 1.2 6.7L12 18.2 6.8 21.5 8 14.8 3 10l6.5-.5L12 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    value: "PLACE",
    label: "Lugares",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C8.5 2 5 5 5 9c0 6 7 13 7 13s7-7 7-13c0-4-3.5-7-7-7z" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="12" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.3"/>
      </svg>
    ),
  },
  {
    value: "GROUP",
    label: "Grupos",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <circle cx="8"  cy="9" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="16" cy="9" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M2 21c0-3 2.5-5 6-5h8c3.5 0 6 2 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
]

export function BondFilterBar() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const active       = (searchParams.get("bond") ?? "ALL") as BondType | "ALL"

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

  function scroll(dir: 1 | -1) {
    barRef.current?.scrollBy({ left: dir * 200, behavior: "smooth" })
  }

  function select(value: BondType | "ALL") {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "ALL") params.delete("bond")
    else params.set("bond", value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="group/bar relative flex-1 overflow-hidden flex items-stretch">

      {/* degradado izquierdo */}
      <div
        className="pointer-events-none absolute left-0 top-0 bottom-0 w-14 z-10 transition-opacity duration-200"
        style={{
          background: "linear-gradient(to right, white 20%, transparent)",
          opacity: canLeft ? 1 : 0,
        }}
      />
      {/* degradado derecho */}
      <div
        className="pointer-events-none absolute right-0 top-0 bottom-0 w-14 z-10 transition-opacity duration-200"
        style={{
          background: "linear-gradient(to left, white 20%, transparent)",
          opacity: canRight ? 1 : 0,
        }}
      />

      {/* flecha izquierda */}
      {canLeft && (
        <button
          onClick={() => scroll(-1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20
            w-[26px] h-[26px] rounded-full bg-white border border-[#e2e2ef]
            flex items-center justify-center text-[14px] text-[#555]
            shadow-sm opacity-0 group-hover/bar:opacity-100 transition-opacity"
          aria-label="Ir a la izquierda"
        >
          ‹
        </button>
      )}
      {/* flecha derecha */}
      {canRight && (
        <button
          onClick={() => scroll(1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20
            w-[26px] h-[26px] rounded-full bg-white border border-[#e2e2ef]
            flex items-center justify-center text-[14px] text-[#555]
            shadow-sm opacity-0 group-hover/bar:opacity-100 transition-opacity"
          aria-label="Ir a la derecha"
        >
          ›
        </button>
      )}

      {/* tabs — centrados */}
      <div
        ref={barRef}
        className="flex items-center justify-center overflow-x-auto px-10 flex-1"
        style={{ scrollbarWidth: "none" }}
      >
        {TABS.map(tab => {
          const isActive = tab.value === active
          return (
            <button
              key={tab.value}
              onClick={() => select(tab.value)}
              className={[
                "flex flex-col items-center justify-center gap-[3px]",
                "px-4 h-full text-[10px] whitespace-nowrap flex-shrink-0",
                "border-b-2 transition-colors",
                isActive
                  ? "text-[#534AB7] font-medium border-[#534AB7]"
                  : "text-[#888] border-transparent hover:text-[#534AB7]",
              ].join(" ")}
            >
              {tab.icon}
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
