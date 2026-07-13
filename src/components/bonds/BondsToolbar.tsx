"use client"

import { Row, Column, ToggleButton, SegmentedControl, Text } from "@once-ui-system/core"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { BOND_TYPE_LABEL } from "@/lib/bond-subtypes"
import type { BondType } from "@prisma/client"
import type { BondsFilters } from "@/types/bonds"

const TYPE_TABS: { value: BondType | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  ...(["PERSON", "EMOTION", "IDEA", "BELIEF", "PLACE", "GROUP", "OTHER"] as BondType[]).map(t => ({ value: t, label: BOND_TYPE_LABEL[t] })),
]

const MATURITY_OPTS = [
  { value: "ALL", label: "Todos" },
  { value: "tags", label: "Etiquetas" },
  { value: "bonds", label: "Vínculos maduros" },
]

const PERIOD_OPTS = [
  { value: "3m", label: "3 meses" },
  { value: "6m", label: "6 meses" },
  { value: "1y", label: "1 año" },
  { value: "all", label: "Todo" },
]

export function BondsToolbar({ filters }: { filters: BondsFilters }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === "ALL") params.delete(key)
    else params.set(key, value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Column gap="12" fillWidth>
      <Row horizontal="between" vertical="center" wrap gap="12">
        <SegmentedControl
          fillWidth={false}
          selected={filters.view}
          buttons={[
            { value: "list", label: "Lista" },
            { value: "timeline", label: "Línea de tiempo" },
            { value: "graph", label: "Grafo" },
          ]}
          onToggle={(v: string) => setParam("view", v === "list" ? null : v)}
        />
        <Row gap="8" wrap>
          <Text variant="label-default-s" onBackground="neutral-weak" style={{whiteSpace:"nowrap"}}>Madurez:</Text>
          {MATURITY_OPTS.map(o => (
            <ToggleButton key={o.value} size="xl" selected={filters.maturity === o.value} onClick={() => setParam("maturity", o.value)}>{o.label}</ToggleButton>
          ))}
          <Text variant="label-default-s" onBackground="neutral-weak">Período:</Text>
          {PERIOD_OPTS.map(o => (
            <ToggleButton key={o.value} size="xl" selected={filters.period === o.value} onClick={() => setParam("period", o.value)}>{o.label}</ToggleButton>
          ))}
        </Row>
      </Row>

      <Row gap="4" wrap>
        {TYPE_TABS.map(t => (
          <ToggleButton key={t.value} size="xl" selected={filters.type === t.value} onClick={() => setParam("type", t.value)}>{t.label}</ToggleButton>
        ))}
      </Row>
    </Column>
  )
}
