// src/components/bonds/BondEntriesList.tsx
// Panel derecho del detalle de un vínculo.
// Lista scrolleable de entradas relacionadas ordenadas por fecha descendente.
"use client"

import Link from "next/link"
import type { BondEntry } from "@/types/bonds"
import { BOND_TYPE_COLOR } from "@/lib/bond-subtypes"
import type { BondType } from "@prisma/client"

interface BondEntriesListProps {
  entries:  BondEntry[]
  bondType: BondType
}

export function BondEntriesList({ entries, bondType }: BondEntriesListProps) {
  const color = BOND_TYPE_COLOR[bondType]

  return (
    <div
      className="flex flex-col flex-shrink-0"
      style={{ width: 210, borderLeft: "0.5px solid #e2e2ef" }}
    >
      <div
        className="px-4 py-2.5 flex-shrink-0 text-[10px] font-medium text-[#9999aa] uppercase tracking-wide"
        style={{ borderBottom: "0.5px solid #f0f0f0" }}
      >
        Entradas
      </div>

      <div className="flex-1 overflow-y-auto">
        {entries.length === 0 && (
          <p className="px-4 py-6 text-[11px] text-[#9999aa] text-center">Sin entradas registradas.</p>
        )}
        {entries.map(entry => (
          <Link
            key={entry.id}
            href={`/journal/${entry.id}`}
            className="block px-4 py-2.5 transition-colors hover:bg-[#fafafa]"
            style={{ borderBottom: "0.5px solid #f5f5f5" }}
          >
            <p className="text-[12px] font-medium text-[#1a1a2e] truncate">
              {entry.title ?? "Sin título"}
            </p>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-[10px] text-[#9999aa]">
                {new Date(entry.date).toLocaleDateString("es", { day: "numeric", month: "short" })}
              </p>
              <div className="flex items-center gap-1">
                <div className="w-12 h-1 bg-[#f0f0f0] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(entry.intensity / 10) * 100}%`, background: color }}
                  />
                </div>
                <span className="text-[10px] text-[#9999aa]">{entry.intensity.toFixed(1)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
