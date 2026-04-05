// src/app/bonds/page.tsx
// Server Component de /bonds. Verifica auth, lee searchParams,
// llama a getBondsWithSnapshots y pasa los datos a BondsPage.

import { redirect }              from "next/navigation"
import { Suspense }              from "react"
import { auth }                  from "@/auth"
import { getBondsWithSnapshots } from "@/lib/actions/bonds.actions"
import { AppSidebar }            from "@/components/layout/AppSidebar"
import { BondsPage }             from "@/components/bonds/BondsPage"
import type { BondType }         from "@prisma/client"
import type { BondsView, BondsFilters, BondMaturityFilter, BondPeriod } from "@/types/bonds"

type SearchParams = Promise<{
  view?:     string
  type?:     string
  subtype?:  string
  maturity?: string
  period?:   string
}>

export default async function BondsRoute({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth()
  if (!session?.user) redirect("/auth")

  const sp = await searchParams

  const filters: BondsFilters = {
    view:     (sp.view as BondsView)               ?? "list",
    type:     (sp.type as BondType | "ALL")         ?? "ALL",
    subtype:  sp.subtype ?? null,
    maturity: (sp.maturity as BondMaturityFilter)   ?? "ALL",
    period:   (sp.period as BondPeriod)             ?? "3m",
  }

  const bonds = await getBondsWithSnapshots({
    type:     filters.type,
    subtype:  filters.subtype,
    maturity: filters.maturity,
    period:   filters.period,
  })

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0eff8]">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        <Suspense>
          <BondsPage bonds={bonds} filters={filters} />
        </Suspense>
      </div>
    </div>
  )
}
