// src/components/layout/AppSidebar.tsx
// Sidebar izquierdo transparente. Iconos centrados verticalmente.
// Tooltip aparece al hover con transición suave.
// Estado activo basado en la ruta actual.
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/feed",
    label: "Feed",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2"   width="9" height="9" rx="2" fill="currentColor" opacity=".9"/>
        <rect x="13" y="2"  width="9" height="9" rx="2" fill="currentColor" opacity=".5"/>
        <rect x="2" y="13"  width="9" height="9" rx="2" fill="currentColor" opacity=".5"/>
        <rect x="13" y="13" width="9" height="9" rx="2" fill="currentColor" opacity=".3"/>
      </svg>
    ),
  },
  {
    href: "/journal",
    label: "Diario",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="7" y1="9"  x2="17" y2="9"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="7" y1="13" x2="17" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="7" y1="17" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/bonds",
    label: "Vínculos",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="12" cy="12" r="9"   stroke="currentColor" strokeWidth="1" strokeDasharray="3 3"/>
        <circle cx="12" cy="3"   r="2" fill="currentColor"/>
        <circle cx="20.2" cy="16.5" r="2" fill="currentColor"/>
        <circle cx="3.8"  cy="16.5" r="2" fill="currentColor"/>
      </svg>
    ),
  },
  {
    href: "/groups",
    label: "Grupos",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="8"  cy="9" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="16" cy="9" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M2 21c0-3 2.5-5 6-5h8c3.5 0 6 2 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-16 flex flex-col items-center py-4 flex-shrink-0 bg-transparent">

      {/* nav — centrado verticalmente */}
      <nav className="flex-1 flex flex-col items-center justify-center gap-1.5">
        {NAV_ITEMS.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "group relative w-11 h-11 rounded-[10px] flex items-center justify-center transition-colors",
                active
                  ? "bg-[rgba(83,74,183,0.10)] text-[#534AB7]"
                  : "text-[#b0b0c8] hover:bg-[rgba(83,74,183,0.08)] hover:text-[#534AB7]",
              ].join(" ")}
              aria-label={item.label}
            >
              {item.icon}
              {/* tooltip */}
              <span className="
                pointer-events-none absolute left-[calc(100%+10px)] top-1/2
                -translate-y-1/2 -translate-x-1
                opacity-0 group-hover:opacity-100 group-hover:translate-x-0
                transition-all duration-150
                bg-[#1a1a2e] text-white text-[11px] font-medium
                px-2.5 py-[5px] rounded-md whitespace-nowrap z-50
                before:content-[''] before:absolute before:right-full before:top-1/2
                before:-translate-y-1/2 before:border-[5px] before:border-transparent
                before:border-r-[#1a1a2e]
              ">
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* bottom: crear + perfil */}
      <div className="flex flex-col items-center gap-2">
        <Link
          href="/journal/new"
          className="group relative w-11 h-11 rounded-[10px] bg-[#534AB7] hover:bg-[#3C3489] flex items-center justify-center text-white text-2xl leading-none transition-colors"
          aria-label="Nueva entrada"
        >
          +
          <span className="
            pointer-events-none absolute left-[calc(100%+10px)] top-1/2
            -translate-y-1/2 -translate-x-1
            opacity-0 group-hover:opacity-100 group-hover:translate-x-0
            transition-all duration-150
            bg-[#534AB7] text-white text-[11px] font-medium
            px-2.5 py-[5px] rounded-md whitespace-nowrap z-50
            before:content-[''] before:absolute before:right-full before:top-1/2
            before:-translate-y-1/2 before:border-[5px] before:border-transparent
            before:border-r-[#534AB7]
          ">
            Nueva entrada
          </span>
        </Link>

        <Link
          href="/settings"
          className="group relative w-[34px] h-[34px] rounded-full bg-[#AFA9EC] border-2 border-transparent hover:border-[#534AB7] transition-colors block"
          aria-label="Mi perfil"
        >
          <span className="
            pointer-events-none absolute left-[calc(100%+10px)] top-1/2
            -translate-y-1/2 -translate-x-1
            opacity-0 group-hover:opacity-100 group-hover:translate-x-0
            transition-all duration-150
            bg-[#1a1a2e] text-white text-[11px] font-medium
            px-2.5 py-[5px] rounded-md whitespace-nowrap z-50
            before:content-[''] before:absolute before:right-full before:top-1/2
            before:-translate-y-1/2 before:border-[5px] before:border-transparent
            before:border-r-[#1a1a2e]
          ">
            Mi perfil
          </span>
        </Link>
      </div>
    </aside>
  )
}
