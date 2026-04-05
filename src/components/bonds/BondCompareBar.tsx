// src/components/bonds/BondCompareBar.tsx
// Barra de modo comparar. Visible solo cuando compareActive = true.
// Muestra chips de los bonds comparados y un buscador para añadir más.
"use client"

import { useState, useRef, useEffect } from "react"
import { searchUserBonds }             from "@/lib/actions/bonds.actions"
import { BondAvatar }                  from "@/components/bonds/BondAvatar"
import { BOND_TYPE_COLOR }             from "@/lib/bond-subtypes"
import type { BondType }               from "@prisma/client"

interface CompareChip {
  id:   string
  name: string
  type: BondType
}

interface BondCompareBarProps {
  baseBond:       CompareChip
  compareChips:   CompareChip[]
  onAdd:          (chip: CompareChip) => void
  onRemove:       (id: string) => void
  onExit:         () => void
}

export function BondCompareBar({
  baseBond,
  compareChips,
  onAdd,
  onRemove,
  onExit,
}: BondCompareBarProps) {
  const [query,      setQuery]      = useState("")
  const [results,    setResults]    = useState<CompareChip[]>([])
  const [loading,    setLoading]    = useState(false)
  const [dropOpen,   setDropOpen]   = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (query.trim().length < 1) { setResults([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      const data = await searchUserBonds(query)
      // Filtrar el bond base y los ya añadidos
      const added = new Set([baseBond.id, ...compareChips.map(c => c.id)])
      setResults(data.filter(d => !added.has(d.id)))
      setLoading(false)
    }, 250)
    return () => clearTimeout(t)
  }, [query, baseBond.id, compareChips])

  function Chip({ chip, removable }: { chip: CompareChip; removable: boolean }) {
    const color = BOND_TYPE_COLOR[chip.type]
    return (
      <div
        className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full text-[11px]"
        style={{ background: color, color: "#fff" }}
      >
        <BondAvatar name={chip.name} type={chip.type} size={16} />
        <span className="font-medium">{chip.name}</span>
        {removable && (
          <button
            onClick={() => onRemove(chip.id)}
            className="ml-0.5 text-[13px] leading-none opacity-70 hover:opacity-100"
          >×</button>
        )}
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-2 px-5 flex-shrink-0 flex-wrap"
      style={{
        minHeight: 44,
        background: "#eeedfe",
        border: "0.5px solid #cac7f4",
        borderRadius: 0,
        paddingTop: 8,
        paddingBottom: 8,
      }}
    >
      <span className="text-[10px] font-medium text-[#534AB7] flex-shrink-0">Comparando:</span>

      {/* Bond base (no removable) */}
      <Chip chip={baseBond} removable={false} />

      {/* Chips añadidos */}
      {compareChips.map(c => <Chip key={c.id} chip={c} removable={true} />)}

      {/* Buscador */}
      <div className="relative">
        <button
          onClick={() => { setDropOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }}
          className="flex items-center gap-1 px-3 py-1 rounded-full text-[11px] text-[#534AB7] bg-white transition-colors hover:bg-[#f5f5ff]"
          style={{ border: "0.5px solid #cac7f4" }}
        >
          <span className="text-[14px] leading-none">+</span> añadir vínculo
        </button>

        {dropOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 z-50 bg-white rounded-[10px] shadow-lg"
          style={{ minWidth: 220, border: "0.5px solid #e2e2ef" }}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setDropOpen(true)}
            onBlur={() => setTimeout(() => setDropOpen(false), 150)}
            placeholder="Buscar vínculo..."
            className="w-full px-3 py-2 text-[12px] outline-none bg-transparent"
            style={{ borderBottom: "0.5px solid #f0f0f0" }}
          />
          {loading && <p className="px-3 py-2 text-[11px] text-[#9999aa]">Buscando…</p>}
          {!loading && results.map(r => (
            <button
              key={r.id}
              onClick={() => { onAdd(r); setQuery(""); setResults([]); setDropOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-left hover:bg-[#f7f7fc] transition-colors"
            >
              <BondAvatar name={r.name} type={r.type} size={22} />
              <span>{r.name}</span>
            </button>
          ))}
        </div>
        )}
      </div>

      <div className="flex-1"/>

      <button
        onClick={onExit}
        className="text-[10px] text-[#9999aa] hover:text-[#534AB7] transition-colors flex-shrink-0"
      >
        Salir de comparación ×
      </button>
    </div>
  )
}
