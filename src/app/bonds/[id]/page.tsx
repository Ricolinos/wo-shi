import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import { Column, Row, Skeleton } from "@once-ui-system/core"
import { getBondDetail, getBondEntries } from "@/lib/actions/bonds.actions"
import { AppShell } from "@/components/layout/AppShell"
import { BondDetailPage } from "@/components/bonds/BondDetailPage"

export default function BondDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AppShell>
      <Suspense fallback={<BondDetailSkeleton />}>
        <BondDetailContent params={params} />
      </Suspense>
    </AppShell>
  )
}

async function BondDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const { id } = await params
  const [bond, entries] = await Promise.all([getBondDetail(id), getBondEntries(id)])
  if (!bond) notFound()

  return <BondDetailPage bond={bond} entries={entries} />
}

function BondDetailSkeleton() {
  return (
    <Column fillWidth gap="16" paddingY="24" paddingX="16" maxWidth="l" style={{ margin: "0 auto" }}>
      <Row gap="12" vertical="center">
        <Skeleton shape="circle" width="l" height="l" />
        <Column flex={1} gap="4">
          <Skeleton shape="line" width="m" />
          <Skeleton shape="line" width="s" />
        </Column>
      </Row>
      <Row gap="24" fillWidth wrap>
        <Column flex={1}>
          <Skeleton shape="block" fillWidth height="xl" />
        </Column>
        <Column gap="8" fillWidth>
          <Skeleton shape="line" width="s" />
          <Skeleton shape="block" fillWidth height="l" />
          <Skeleton shape="block" fillWidth height="l" />
        </Column>
      </Row>
    </Column>
  )
}
