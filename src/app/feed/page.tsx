// src/app/feed/page.tsx
// Página del feed — pantalla principal post-login.

import { Suspense } from "react"
import { Column, Row, Heading, Skeleton } from "@once-ui-system/core"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getFeedEntries } from "@/lib/actions/feed.actions"
import { FeedHeader } from "@/components/feed/FeedHeader"
import { FeedInfiniteList } from "@/components/feed/FeedInfiniteList"
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
      <Column fillWidth gap="16">
        <FeedHeader>
          <Heading variant="display-strong-xs">Feed</Heading>
          <BondFilterBar />
        </FeedHeader>
        {/*
          Layout de 3 columnas simétrico: espaciador invisible (mismo ancho
          que PrivacyPanel, oculto al apilarse en columna en móvil) + feed +
          PrivacyPanel, para que el feed quede realmente centrado en la
          ventana en vez de solo ocupar el espacio sobrante a la izquierda
          del panel de privacidad.
        */}
        <Row fillWidth gap="24" paddingX="16" paddingBottom="24" s={{ direction: "column" }} style={{ alignItems: "flex-start" }}>
          {/* Ancho exacto en rem, no SpacingToken — debe igualar el
              max-width: 12rem de PrivacyPanel.module.css (SpacingToken "12"
              serían 12px, no 12rem: no son la misma escala). */}
          <Column style={{ width: "12rem" }} s={{ hide: true }} aria-hidden />
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
  const { entries, nextCursor } = await getFeedEntries({ bondType, visibility })

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
    <FeedInfiniteList
      key={`${bondType ?? "all"}-${visibility}`}
      initialEntries={entries}
      initialCursor={nextCursor}
      bondType={bondType}
      visibility={visibility}
    />
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
