import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import { Column, Row, Heading, Text, Tag, IconButton, SmartLink, Media } from "@once-ui-system/core"
import { getJournalEntry } from "@/lib/actions/entry.actions"
import { AppShell } from "@/components/layout/AppShell"
import { BOND_TYPE_SCHEME } from "@/lib/bond-subtypes"

const VISIBILITY_LABEL = { PRIVATE: "Solo yo", FRIENDS: "Amigos", PUBLIC: "Público" } as const

export default async function JournalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const { id } = await params
  const entry = await getJournalEntry(id)
  if (!entry) notFound()

  return (
    <AppShell>
      <Column fillWidth maxWidth="m" paddingY="24" paddingX="16" gap="16" style={{ margin: "0 auto" }}>
        <Row gap="12" vertical="center">
          <SmartLink href="/journal"><IconButton icon="chevronLeft" variant="secondary" aria-label="Volver al diario" /></SmartLink>
          <Column flex={1} gap="0">
            <Heading variant="display-strong-xs">{entry.title || "Entrada sin título"}</Heading>
            <Text variant="label-default-s" onBackground="neutral-weak">
              {new Date(entry.date).toLocaleString("es", { dateStyle: "long", timeStyle: "short" })}
              {entry.location ? ` · ${entry.location}` : ""}
            </Text>
          </Column>
          <Tag variant="neutral" label={VISIBILITY_LABEL[entry.visibility]} />
        </Row>

        {entry.media.filter(m => m.type !== "AUDIO").length > 0 && (
          <Row gap="8" wrap>
            {entry.media.filter(m => m.type !== "AUDIO").map(m => (
              <Media key={m.id} src={m.url} alt="" width={160} height={160} radius="m" objectFit="cover" />
            ))}
          </Row>
        )}

        <Text variant="body-default-m" style={{ whiteSpace: "pre-wrap" }}>{entry.body}</Text>

        {entry.entryBonds.length > 0 && (
          <Column gap="8" paddingTop="16" borderTop="neutral-alpha-weak">
            <Text variant="label-default-s" onBackground="neutral-weak">Vínculos en esta entrada</Text>
            <Row gap="8" wrap>
              {entry.entryBonds.map(eb => (
                <SmartLink key={eb.bond.id} href={`/bonds/${eb.bond.id}`}>
                  <Tag variant={BOND_TYPE_SCHEME[eb.bond.type]} label={`${eb.bond.name} · ${eb.intensity}`} />
                </SmartLink>
              ))}
            </Row>
          </Column>
        )}
      </Column>
    </AppShell>
  )
}
