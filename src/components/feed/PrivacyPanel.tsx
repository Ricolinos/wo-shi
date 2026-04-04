// src/components/feed/PrivacyPanel.tsx
// Panel lateral derecho para filtrar entradas por visibilidad.
// Actualiza el searchParam "vis" en la URL.
"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import type { Visibility } from "@prisma/client"

type Option = {
  value: Visibility | "ALL"
  label: string
  icon: React.ReactNode
  bg: string
}

const OPTIONS: Option[] = [
  {
    value: "ALL",
    label: "Todo",
    bg: "#EEEDFE",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="1"   y="1"   width="5.5" height="5.5" rx="1.2" fill="#534AB7" opacity=".9"/>
        <rect x="7.5" y="1"   width="5.5" height="5.5" rx="1.2" fill="#534AB7" opacity=".5"/>
        <rect x="1"   y="7.5" width="5.5" height="5.5" rx="1.2" fill="#534AB7" opacity=".5"/>
        <rect x="7.5" y="7.5" width="5.5" height="5.5" rx="1.2" fill="#534AB7" opacity=".3"/>
      </svg>
    ),
  },
  {
    value: "PRIVATE",
    label: "Solo yo",
    bg: "#f4f4f8",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="2" y="5.5" width="10" height="6.5" rx="1.5" stroke="#555" strokeWidth="1.1"/>
        <path d="M4.5 5.5V4.5a2.5 2.5 0 015 0v1" stroke="#555" strokeWidth="1.1" strokeLinecap="round"/>
        <circle cx="7" cy="8.8" r="1" fill="#555"/>
      </svg>
    ),
  },
  {
    value: "FRIENDS",
    label: "Amigos",
    bg: "#f4f4f8",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="5" cy="5.5" r="2" stroke="#555" strokeWidth="1.1"/>
        <circle cx="9" cy="5.5" r="2" stroke="#555" strokeWidth="1.1"/>
        <path d="M1.5 12c0-1.5 1.5-2.5 3.5-2.5s3.5 1 3.5 2.5" stroke="#555" strokeWidth="1.1" strokeLinecap="round"/>
        <path d="M9 9.5c1.5 0 3.5.8 3.5 2.5" stroke="#555" strokeWidth="1.1" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    value: "PUBLIC",
    label: "Público",
    bg: "#f4f4f8",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5.5" stroke="#555" strokeWidth="1.1"/>
        <path d="M7 1.5s-2.5 2-2.5 5.5 2.5 5.5 2.5 5.5" stroke="#555" strokeWidth=".9"/>
        <path d="M7 1.5s2.5 2 2.5 5.5-2.5 5.5-2.5 5.5" stroke="#555" strokeWidth=".9"/>
        <line x1="1.5" y1="7" x2="12.5" y2="7" stroke="#555" strokeWidth=".9"/>
      </svg>
    ),
  },
]

export function PrivacyPanel() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const active       = (searchParams.get("vis") ?? "ALL") as Visibility | "ALL"

  function select(value: Visibility | "ALL") {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "ALL") params.delete("vis")
    else params.set("vis", value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <aside className="w-[182px] flex-shrink-0 pt-1">
      <p className="text-[9px] font-medium text-[#aaa] uppercase tracking-[0.6px] mb-2 pl-0.5">
        Privacidad
      </p>
      {OPTIONS.map(opt => {
        const isActive = opt.value === active
        return (
          <button
            key={opt.value}
            onClick={() => select(opt.value)}
            className={[
              "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg mb-0.5 transition-colors text-left",
              isActive
                ? "bg-white shadow-[0_0_0_0.5px_#e2e2ef]"
                : "hover:bg-white",
            ].join(" ")}
          >
            <span
              className="w-7 h-7 rounded-[7px] flex items-center justify-center flex-shrink-0"
              style={{ background: isActive ? opt.bg : "#f4f4f8" }}
            >
              {opt.icon}
            </span>
            <span className={`text-[11px] ${isActive ? "text-[#1a1a2e] font-medium" : "text-[#555]"}`}>
              {opt.label}
            </span>
            {isActive && (
              <span className="ml-auto w-[6px] h-[6px] rounded-full bg-[#534AB7] flex-shrink-0" />
            )}
          </button>
        )
      })}
    </aside>
  )
}
