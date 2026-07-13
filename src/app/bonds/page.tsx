import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Column, Row, Skeleton } from "@once-ui-system/core"
import { getBondsWithSnapshots } from "@/lib/actions/bonds.actions"
import { AppShell } from "@/components/layout/AppShell"
import { BondsToolbar } from "@/components/bonds/BondsToolbar"
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

  return (
    <AppShell>
      <Column fillWidth gap="24" paddingY="24" paddingX="16" maxWidth="l" style={{ margin: "0 auto" }}>
        <BondsToolbar filters={filters} />
        <Suspense fallback={<BondsSkeleton />}>
          <BondsResults filters={filters} />
        </Suspense>
      </Column>
    </AppShell>
  )
}

async function BondsResults({ filters }: { filters: BondsFilters }) {
  const bonds = await getBondsWithSnapshots({
    type: filters.type,
    subtype: filters.subtype,
    maturity: filters.maturity,
    period: filters.period,
  })

  return <BondsPage bonds={bonds} filters={filters} />
}

function BondsSkeleton() {
  return (
    <Column gap="4" fillWidth>
      {[0, 1, 2, 3].map(i => (
        <Row key={i} gap="12" vertical="center" padding="12" radius="m" border="neutral-alpha-weak" background="surface">
          <Skeleton shape="circle" width="xs" height="xs" />
          <Column flex={1} gap="4">
            <Skeleton shape="line" width="s" />
            <Skeleton shape="line" width="xs" />
          </Column>
        </Row>
      ))}
    </Column>
  )
}
