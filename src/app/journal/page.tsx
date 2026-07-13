import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Column, Row, Heading, Text, Tag, SmartLink, Button } from "@once-ui-system/core"
import { getJournalEntries } from "@/lib/actions/entry.actions"
import { AppShell } from "@/components/layout/AppShell"
import { BOND_TYPE_SCHEME } from "@/lib/bond-subtypes"

const VISIBILITY_LABEL = { PRIVATE: "Solo yo", FRIENDS: "Amigos", PUBLIC: "Público" } as const

export default async function JournalListPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const entries = await getJournalEntries()

  return (
    <AppShell>
      <Column fillWidth maxWidth="m" paddingY="24" paddingX="16" gap="16" style={{ margin: "0 auto" }}>
        <Row horizontal="between" vertical="center">
          <Heading variant="display-strong-xs">Diario</Heading>
          <SmartLink href="/journal/new"><Button variant="primary" prefixIcon="add">Nueva entrada</Button></SmartLink>
        </Row>

        {entries.length === 0 ? (
          <Column padding="40" horizontal="center">
            <Text variant="body-default-m" onBackground="neutral-weak">Aún no has escrito ninguna entrada.</Text>
          </Column>
        ) : (
          <Column gap="8">
            {entries.map(entry => (
              <SmartLink key={entry.id} href={`/journal/${entry.id}`}>
                <Row fillWidth gap="12" padding="16" radius="l" border="neutral-alpha-weak" background="surface" vertical="center">
                  <Column flex={1} gap="4">
                    <Row gap="8" vertical="center">
                      <Text variant="label-strong-s">{entry.title || new Date(entry.date).toLocaleDateString("es")}</Text>
                      <Tag variant="neutral" label={VISIBILITY_LABEL[entry.visibility]} />
                    </Row>
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
        )}
      </Column>
    </AppShell>
  )
}
