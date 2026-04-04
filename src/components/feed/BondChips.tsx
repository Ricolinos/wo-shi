// src/components/feed/BondChips.tsx
// Renderiza los chips de vínculos de una entrada, coloreados por tipo de bond.

import type { BondType } from "@prisma/client"

type Bond = {
  id: string
  name: string
  type: BondType
}

type Props = {
  bonds: Bond[]
}

// Colores por tipo de bond (de la paleta de wo-shi)
const BOND_COLORS: Record<BondType, string> = {
  PERSON:  "bg-[#EEEDFE] text-[#534AB7] border-[#CECBF6]",
  EMOTION: "bg-[#FAECE7] text-[#993C1D] border-[#F5C4B3]",
  IDEA:    "bg-[#FAEEDA] text-[#854F0B] border-[#FAC775]",
  BELIEF:  "bg-[#FBEAF0] text-[#993556] border-[#F4C0D1]",
  PLACE:   "bg-[#EAF2FD] text-[#2563A8] border-[#9EC9F5]",
  GROUP:   "bg-[#E6F0FE] text-[#1D4ED8] border-[#93C5FD]",
  OTHER:   "bg-[#F4F4F8] text-[#555566] border-[#C8C8D8]",
}

export function BondChips({ bonds }: Props) {
  if (bonds.length === 0) return null

  return (
    <div className="flex flex-wrap gap-[5px] mt-2.5">
      {bonds.map(bond => (
        <span
          key={bond.id}
          className={`text-[9px] px-[9px] py-[3px] rounded-full border border-solid ${BOND_COLORS[bond.type]}`}
        >
          {bond.name}
        </span>
      ))}
    </div>
  )
}
