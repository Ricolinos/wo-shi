"use client"

import { Column, Row, Text, SmartLink } from "@once-ui-system/core"
import type { BondEntry } from "@/types/bonds"

export function BondEntriesList({ entries }: { entries: BondEntry[] }) {
  return (
    <Column gap="8" style={{ width: 220 }}>
      <Text variant="label-default-s" onBackground="neutral-weak">ENTRADAS</Text>
      <Column gap="4" style={{ maxHeight: 500, overflowY: "auto" }}>
        {entries.length === 0 && <Text variant="body-default-s" onBackground="neutral-weak">Sin entradas todavía.</Text>}
        {entries.map(e => (
          <SmartLink key={e.id} href={`/journal/${e.id}`}>
            <Row gap="8" padding="8" radius="m" vertical="center">
              <Column flex={1} gap="0">
                <Text variant="body-default-s">{e.title || new Date(e.date).toLocaleDateString("es")}</Text>
                <Text variant="label-default-s" onBackground="neutral-weak">{new Date(e.date).toLocaleDateString("es")} · int. {e.intensity}</Text>
              </Column>
            </Row>
          </SmartLink>
        ))}
      </Column>
    </Column>
  )
}
