"use client"

import { Row, Column, Text, Tag, Button, IconButton, SmartLink } from "@once-ui-system/core"
import { BondAvatar } from "./BondAvatar"
import { BOND_TYPE_LABEL } from "@/lib/bond-subtypes"
import type { BondDetail } from "@/types/bonds"

export function BondDetailHeader({ bond, comparing, onToggleCompare }: { bond: BondDetail; comparing: boolean; onToggleCompare: () => void }) {
  return (
    <Row gap="16" vertical="center" wrap>
      <SmartLink href="/bonds"><IconButton icon="chevronLeft" variant="secondary" size="xl" aria-label="Volver a Vínculos" /></SmartLink>
      <BondAvatar name={bond.name} type={bond.type} avatar={bond.avatar} size="l" />
      <Column flex={1} gap="4">
        <Text variant="display-strong-xs">{bond.name}</Text>
        <Text variant="label-default-s" onBackground="neutral-weak">
          {bond.subtype ?? BOND_TYPE_LABEL[bond.type]} · vínculo desde {new Date(bond.createdAt).toLocaleDateString("es")}
        </Text>
        <Row gap="8">
          <Tag variant="brand" label={`Intensidad prom. ${bond.avgIntensity}`} />
          <Tag variant="accent" label={`${bond.entryCount} entradas`} />
        </Row>
      </Column>
      <Button variant={comparing ? "primary" : "secondary"} onClick={onToggleCompare}>Comparar</Button>
      <SmartLink href="/journal/new"><Button variant="secondary" prefixIcon="add">Entrada</Button></SmartLink>
    </Row>
  )
}
