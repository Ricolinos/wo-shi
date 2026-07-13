"use client"

import { Row, ToggleButton } from "@once-ui-system/core"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { BOND_TYPE_LABEL } from "@/lib/bond-subtypes"
import type { BondType } from "@prisma/client"

const TYPES: (BondType | "ALL")[] = ["ALL", "PERSON", "EMOTION", "IDEA", "BELIEF", "PLACE", "GROUP"]

export function BondFilterBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = (searchParams.get("bond") as BondType | null) ?? "ALL"

  function setType(t: BondType | "ALL") {
    const params = new URLSearchParams(searchParams.toString())
    if (t === "ALL") params.delete("bond")
    else params.set("bond", t)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Row gap="8" wrap paddingY="8">
      {TYPES.map(t => (
        <ToggleButton key={t} selected={active === t} onClick={() => setType(t)}>
          {t === "ALL" ? "Todos" : BOND_TYPE_LABEL[t]}
        </ToggleButton>
      ))}
    </Row>
  )
}
