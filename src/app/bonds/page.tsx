import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getBondsWithSnapshots } from "@/lib/actions/bonds.actions"
import { AppShell } from "@/components/layout/AppShell"
import { BondsPage } from "@/components/bonds/BondsPage"
import type { BondType } from "@prisma/client"
import type { BondsView, BondsFilters, BondMaturityFilter, BondPeriod } from "@/types/bonds"

type SearchParams = Promise<{ view?: string; type?: string; subtype?: string; maturity?: string; period?: string }>

export default async function BondsRoute({ searchParams }: { searchParams: SearchParams }) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const sp = await searchParams

  const filters: BondsFilters = {
    view:     (sp.view as BondsView) ?? "list",
    type:     (sp.type as BondType | "ALL") ?? "ALL",
    subtype:  sp.subtype ?? null,
    maturity: (sp.maturity as BondMaturityFilter) ?? "ALL",
    period:   (sp.period as BondPeriod) ?? "3m",
  }

  const bonds = await getBondsWithSnapshots({
    type: filters.type,
    subtype: filters.subtype,
    maturity: filters.maturity,
    period: filters.period,
  })

  return (
    <AppShell>
      <BondsPage bonds={bonds} filters={filters} />
    </AppShell>
  )
}
