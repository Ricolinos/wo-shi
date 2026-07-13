"use client"

import { useRouter } from "next/navigation"
import { Column, Row, Text, Tag } from "@once-ui-system/core"
import { BondAvatar } from "./BondAvatar"
import { BOND_TYPE_SCHEME, BOND_TYPE_LABEL } from "@/lib/bond-subtypes"
import type { BondSummary } from "@/types/bonds"

function timeAgo(date: Date | null): string {
  if (!date) return "—"
  const diff = Date.now() - new Date(date).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return "hoy"
  if (d === 1) return "ayer"
  if (d < 7) return `hace ${d}d`
  if (d < 30) return `hace ${Math.floor(d / 7)}sem`
  return `hace ${Math.floor(d / 30)}m`
}

export function BondsList({ bonds }: { bonds: BondSummary[] }) {
  const router = useRouter()

  if (bonds.length === 0) {
    return <Text variant="body-default-m" onBackground="neutral-weak">No hay vínculos con estos filtros.</Text>
  }

  return (
    <Column gap="4" fillWidth>
      {bonds.map(bond => {
        const intensity = bond.lastSnapshot?.intensity ?? 0
        return (
          <Row
            key={bond.id}
            gap="12"
            vertical="center"
            padding="12"
            radius="m"
            border="neutral-alpha-weak"
            background="surface"
            onClick={() => router.push(`/bonds/${bond.id}`)}
            style={{ cursor: "pointer" }}
          >
            <BondAvatar name={bond.name} type={bond.type} avatar={bond.avatar} size="s" />
            <Column flex={1} gap="0">
              <Text variant="label-strong-s">{bond.name}</Text>
              <Text variant="label-default-s" onBackground="neutral-weak">{bond.subtype ?? BOND_TYPE_LABEL[bond.type]}</Text>
            </Column>
            <Tag variant={BOND_TYPE_SCHEME[bond.type]} label={BOND_TYPE_LABEL[bond.type]} />
            <Column gap="0" style={{ width: 90 }}>
              <Text variant="label-default-s" onBackground="neutral-weak">Intensidad</Text>
              <Text variant="body-default-s">{intensity > 0 ? intensity.toFixed(1) : "—"}</Text>
            </Column>
            <Text variant="label-default-s" onBackground="neutral-weak" style={{ width: 70, textAlign: "right" }}>
              {timeAgo(bond.lastActivityDate)}
            </Text>
          </Row>
        )
      })}
    </Column>
  )
}
