import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Column, Row, Heading, Text, Tag, SmartLink, Button, Skeleton } from "@once-ui-system/core"
import { getJournalEntries } from "@/lib/actions/entry.actions"
import { AppShell } from "@/components/layout/AppShell"
import { BOND_TYPE_SCHEME } from "@/lib/bond-subtypes"
import { EntryTimestamps } from "@/components/journal/EntryTimestamps"

const VISIBILITY_LABEL = { PRIVATE: "Solo yo", FRIENDS: "Amigos", PUBLIC: "Público" } as const

export default async function JournalListPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  return (
    <AppShell>
      <Column fillWidth maxWidth="m" paddingY="24" paddingX="16" gap="16" style={{ margin: "0 auto" }}>
        <Row horizontal="between" vertical="center">
          <Heading variant="display-strong-xs">Diario</Heading>
          <SmartLink href="/journal/new"><Button variant="primary" prefixIcon="add">Nueva entrada</Button></SmartLink>
        </Row>

        <Suspense fallback={<JournalSkeleton />}>
          <JournalList />
        </Suspense>
      </Column>
    </AppShell>
  )
}

async function JournalList() {
  const entries = await getJournalEntries()

  if (entries.length === 0) {
    return (
      <Column padding="40" horizontal="center">
        <Text variant="body-default-m" onBackground="neutral-weak">Aún no has escrito ninguna entrada.</Text>
      </Column>
    )
  }

  return (
    <Column gap="8">
      {entries.map(entry => (
        <SmartLink key={entry.id} href={`/journal/${entry.id}`}>
          <Row fillWidth gap="12" padding="16" radius="l" border="neutral-alpha-weak" background="surface" vertical="center">
            <Column flex={1} gap="4">
              <Row gap="8" vertical="center">
                <Text variant="label-strong-s">{entry.title || new Date(entry.date).toLocaleDateString("es")}</Text>
                <Tag variant="neutral" label={VISIBILITY_LABEL[entry.visibility]} />
              </Row>
              <EntryTimestamps createdAt={entry.createdAt} editCount={entry.editCount} />
              <Text variant="body-default-s" onBackground="neutral-weak" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {entry.body}
              </Text>
              {entry.entryBonds.length > 0 && (
                <Row gap="4" wrap>
                  {entry.entryBonds.slice(0, 5).map(eb => (
                    <Tag key={eb.bond.id} variant={BOND_TYPE_SCHEME[eb.bond.type]} label={eb.bond.name} />
                  ))}
                </Row>
              )}
            </Column>
          </Row>
        </SmartLink>
      ))}
    </Column>
  )
}

function JournalSkeleton() {
  return (
    <Column gap="8" fillWidth>
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
