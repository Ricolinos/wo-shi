// src/app/feed/page.tsx
// Página del feed — pantalla principal post-login.
// Server Component: verifica auth, lee searchParams, llama a getFeedEntries.

import { redirect }       from "next/navigation"
import { Suspense }       from "react"
import { auth }           from "@/auth"
import { getFeedEntries } from "@/lib/actions/feed.actions"
import { FeedCard }       from "@/components/feed/FeedCard"
import { AppSidebar }     from "@/components/layout/AppSidebar"
import { BondFilterBar }  from "@/components/feed/BondFilterBar"
import { PrivacyPanel }   from "@/components/feed/PrivacyPanel"
import type { BondType, Visibility } from "@prisma/client"

type SearchParams = Promise<{ bond?: string; vis?: string }>

export default async function FeedPage({ searchParams }: { searchParams: SearchParams }) {
  // Verificar sesión
  const session = await auth()
  if (!session?.user) redirect("/auth")

  // Leer filtros desde la URL
  const { bond, vis } = await searchParams
  const bondType   = bond as BondType | undefined
  const visibility = (vis ?? "ALL") as Visibility | "ALL"

  // Obtener entradas
  const entries = await getFeedEntries({
    bondType,
    visibility,
  })

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f0eff8]">

      {/* ── TOPBAR — ancho 100% ── */}
      <header className="w-full h-[50px] bg-white flex items-stretch flex-shrink-0 z-50" style={{ borderBottom: "0.5px solid #e2e2ef" }}>

        {/* logo + búsqueda */}
        <div className="flex items-center gap-2 px-4 flex-shrink-0 w-[240px]" style={{ borderRight: "0.5px solid #e2e2ef" }}>
          {/* Logo SVG — nodo central con satélites */}
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" className="flex-shrink-0">
            <circle cx="13" cy="13" r="4" fill="#7F77DD"/>
            <circle cx="13" cy="3"  r="2.5" fill="#AFA9EC"/>
            <circle cx="23" cy="18" r="2.5" fill="#AFA9EC"/>
            <circle cx="3"  cy="18" r="2.5" fill="#AFA9EC"/>
            <line x1="13" y1="9"  x2="13" y2="5.5"  stroke="#CECBF6" strokeWidth="1"/>
            <line x1="17" y1="15" x2="21" y2="16"   stroke="#CECBF6" strokeWidth="1"/>
            <line x1="9"  y1="15" x2="5"  y2="16"   stroke="#CECBF6" strokeWidth="1"/>
          </svg>

          {/* caja de búsqueda */}
          <div className="flex-1 flex items-center gap-1.5 bg-[#f4f4f8] rounded-[7px] px-2.5 h-[30px]">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="flex-shrink-0 text-[#b0b0c8]">
              <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.2"/>
              <line x1="8.5" y1="8.5" x2="11.5" y2="11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar en wo-shi"
              className="bg-transparent border-none outline-none text-[12px] text-[#1a1a2e] placeholder:text-[#b0b0c8] w-full font-[inherit]"
            />
          </div>
        </div>

        {/* filtro de vínculos — tabs centrados */}
        <Suspense fallback={<div className="flex-1" />}>
          <BondFilterBar />
        </Suspense>
      </header>

      {/* ── BODY: sidebar + feed + panel privacidad ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* sidebar transparente */}
        <AppSidebar />

        {/* feed wrapper — feed centrado con espaciador izquierdo */}
        {/* items-start: los items crecen con su contenido (no stretch) → overflow-y-auto funciona */}
        <div className="flex-1 flex items-start justify-center overflow-y-auto px-6 py-7 gap-6 min-w-0">

          {/* espaciador: mismo ancho que PrivacyPanel → feed visualmente centrado */}
          <div className="w-[182px] flex-shrink-0" />

          {/* feed */}
          <main className="flex flex-col gap-4 w-full max-w-[540px]">
            {entries.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-[14px] font-medium text-[#1a1a2e] mb-2">El feed está vacío</p>
                <p className="text-[12px] text-[#999]">
                  Aún no hay entradas que mostrar con estos filtros.
                </p>
              </div>
            ) : (
              entries.map(entry => (
                <FeedCard key={entry.id} entry={entry} />
              ))
            )}
          </main>

          {/* panel de privacidad */}
          <Suspense fallback={<div className="w-[182px] flex-shrink-0" />}>
            <PrivacyPanel />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
