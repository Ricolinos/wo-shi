"use client"

import { Tag } from "@once-ui-system/core"
import { BOND_TYPE_SCHEME, BOND_TYPE_LABEL } from "@/lib/bond-subtypes"
import type { BondType } from "@prisma/client"

export function BondChips({ bonds }: { bonds: { id: string; name: string; type: BondType }[] }) {
  if (!bonds.length) return null
  return (
    <>
      {bonds.map(b => (
        <Tag key={b.id} variant={BOND_TYPE_SCHEME[b.type]} label={b.name} />
      ))}
    </>
  )
}
