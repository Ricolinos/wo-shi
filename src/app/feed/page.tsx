// src/app/feed/page.tsx
// Página del feed — pantalla principal post-login.

import { Suspense } from "react"
import { Column, Row, Heading, Skeleton } from "@once-ui-system/core"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getFeedEntries } from "@/lib/actions/feed.actions"
import { FeedCard } from "@/components/feed/FeedCard"
import { BondFilterBar } from "@/components/feed/BondFilterBar"
import { PrivacyPanel } from "@/components/feed/PrivacyPanel"
import { AppShell } from "@/components/layout/AppShell"
import type { BondType, Visibility } from "@prisma/client"

type SearchParams = Promise<{ bond?: string; vis?: string }>

export default async function FeedPage({ searchParams }: { searchParams: SearchParams }) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const { bond, vis } = await searchParams
  const bondType   = bond as BondType | undefined
  const visibility = (vis ?? "ALL") as Visibility | "ALL"

  return (
    <AppShell>
      <Column fillWidth paddingY="24" paddingX="16" gap="16">
        <Heading variant="display-strong-xs">Feed</Heading>
        <BondFilterBar />
        <Row fillWidth gap="24" s={{ direction: "column" }} style={{ alignItems: "flex-start" }}>
          <Column flex={1} gap="16" maxWidth="l">
            <Suspense fallback={<FeedSkeleton />}>
              <FeedList bondType={bondType} visibility={visibility} />
            </Suspense>
          </Column>
          <PrivacyPanel />
        </Row>
      </Column>
    </AppShell>
  )
}

async function FeedList({ bondType, visibility }: { bondType?: BondType; visibility: Visibility | "ALL" }) {
  const entries = await getFeedEntries({ bondType, visibility })

  if (entries.length === 0) {
    return (
      <Column padding="40" horizontal="center">
        <Heading variant="body-default-m" onBackground="neutral-weak">
          Aún no hay entradas que mostrar.
        </Heading>
      </Column>
    )
  }

  return (
    <>
      {entries.map((entry, index) => <FeedCard key={entry.id} entry={entry} index={index} />)}
    </>
  )
}

function FeedSkeleton() {
  return (
    <Column gap="16" fillWidth>
      {[0, 1, 2].map(i => (
        <Column key={i} radius="l" border="neutral-alpha-weak" background="surface" padding="16" gap="12" fillWidth>
          <Row gap="8" vertical="center">
            <Skeleton shape="circle" width="xs" height="xs" />
            <Skeleton shape="line" width="s" />
            <Skeleton shape="line" width="s" />
          </Row>
          <Skeleton shape="block" fillWidth height="l" />
        </Column>
      ))}
    </Column>
  )
}
