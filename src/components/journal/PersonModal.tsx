// src/components/journal/PersonModal.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { ModalShell } from "./ModalShell"
import type { PersonBond } from "@/types/journal"

interface SearchResult {
  id: string
  name: string
  username?: string
  avatar?: string
  isUser: boolean       // true = usuario de wo-shi
  bondId?: string       // si ya existe como vínculo previo
  mentions?: number
}

interface Props {
  onClose: () => void
  onAdd: (person: PersonBond) => void
  existing: PersonBond[]
}

// botones reutilizables
function Btn({ children, onClick, variant = "secondary" }: {
  children: React.ReactNode
  onClick?: () => void
  variant?: "primary" | "secondary"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm transition-colors ${
        variant === "primary"
          ? "bg-[#534AB7] text-white hover:bg-[#3C3489]"
          : "border border-[var(--color-border-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background-secondary)]"
      }`}
    >
      {children}
    </button>
  )
}

export function PersonModal({ onClose, onAdd, existing }: Props) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [notified, setNotified] = useState(false)
  const [intensity, setIntensity] = useState(5)
  const [proximity, setProximity] = useState(5)
  const [privateNote, setPrivateNote] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // buscar usuarios/vínculos
  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setIsLoading(true)
    try {
      const res = await fetch(`/api/bonds/search?q=${encodeURIComponent(q)}&type=PERSON`)
      const data = await res.json()
      setResults(data.results ?? [])
    } catch {
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => search(query), 300)
    return () => clearTimeout(t)
  }, [query, search])

  function handleSelect(r: SearchResult) {
    setSelected(r)
    if (!r.isUser) setNotified(false)
  }

  function handleAdd() {
    if (!selected) return
    onAdd({
      bondId: selected.bondId,
      name: selected.name,
      linkedUserId: selected.isUser ? selected.id : undefined,
      isUser: selected.isUser,
      notified: selected.isUser ? notified : false,
      intensity,
      proximity,
      privateNote: privateNote.trim() || undefined,
    })
    onClose()
  }

  function handleAddExternal() {
    if (!query.trim()) return
    onAdd({
      name: query.trim(),
      isUser: false,
      notified: false,
      intensity,
      proximity,
    })
    onClose()
  }

  const alreadyAdded = (id: string) => existing.some(p => p.linkedUserId === id || p.name === id)

  return (
    <ModalShell
      title="Agregar persona"
      onClose={onClose}
      footer={
        <>
          <Btn onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" onClick={handleAdd}>
            Agregar persona
          </Btn>
        </>
      }
    >
      {/* buscador */}
      <div className="px-5 pt-4 pb-2">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.2"/>
            <line x1="8.5" y1="8.5" x2="12" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nombre o @usuario…"
            className="w-full pl-8 pr-3 py-2 text-sm bg-[var(--color-background-secondary)] border border-[var(--color-border-secondary)] rounded-lg outline-none focus:border-[#7F77DD] focus:bg-[var(--color-background-primary)] focus:ring-2 focus:ring-[#EEEDFE] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
          />
        </div>
      </div>

      {/* resultados */}
      <div className="px-3 pb-2 max-h-48 overflow-y-auto">
        {isLoading && (
          <p className="text-xs text-[var(--color-text-tertiary)] px-2 py-3">Buscando…</p>
        )}
        {!isLoading && results.map(r => (
          <button
            key={r.id}
            type="button"
            disabled={alreadyAdded(r.id)}
            onClick={() => handleSelect(r)}
            className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors ${
              selected?.id === r.id
                ? "bg-[#EEEDFE]"
                : alreadyAdded(r.id)
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-[var(--color-background-secondary)]"
            }`}
          >
            {/* avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
              r.isUser ? "bg-[#EEEDFE] text-[#534AB7]" : "bg-[var(--color-background-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border-secondary)]"
            }`}>
              {r.avatar ? <img src={r.avatar} className="w-full h-full rounded-full object-cover" alt="" /> : r.name.slice(0,2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{r.name}</p>
              <p className="text-xs text-[var(--color-text-tertiary)] truncate">
                {r.username ? `@${r.username} · wo-shi` : `vínculo externo${r.mentions ? ` · ${r.mentions} menciones` : ""}`}
              </p>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${
              r.isUser ? "bg-[#E1F5EE] text-[#0F6E56]" : "bg-[var(--color-background-secondary)] text-[var(--color-text-tertiary)] border border-[var(--color-border-tertiary)]"
            }`}>
              {r.isUser ? "usuario" : "externo"}
            </span>
            {selected?.id === r.id && (
              <div className="w-4 h-4 rounded-full bg-[#534AB7] flex items-center justify-center flex-shrink-0">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l2 2L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            )}
          </button>
        ))}

        {/* agregar como nuevo externo */}
        {query.trim().length > 1 && !results.some(r => r.name.toLowerCase() === query.toLowerCase()) && (
          <button
            type="button"
            onClick={handleAddExternal}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg border border-dashed border-[var(--color-border-secondary)] hover:bg-[var(--color-background-secondary)] transition-colors mt-1"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--color-background-secondary)] border border-[var(--color-border-secondary)] flex items-center justify-center text-sm text-[var(--color-text-tertiary)]">+</div>
            <div>
              <span className="text-xs text-[var(--color-text-secondary)]">Agregar como nuevo vínculo: </span>
              <span className="text-xs font-medium text-[var(--color-text-primary)]">"{query.trim()}"</span>
            </div>
          </button>
        )}
      </div>

      {/* config de la persona seleccionada */}
      {selected && (
        <div className="border-t border-[var(--color-border-tertiary)] px-5 pt-4 pb-5">
          <p className="text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-3">{selected.name}</p>

          {/* notificar toggle — solo para usuarios */}
          {selected.isUser && (
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--color-text-primary)]">Notificar a esta persona</p>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">Le avisará que aparece en esta entrada</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={notified} onChange={e => setNotified(e.target.checked)} className="sr-only peer"/>
                  <div className="w-9 h-5 bg-[var(--color-border-secondary)] peer-checked:bg-[#534AB7] rounded-full transition-colors"/>
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4"/>
                </label>
              </div>
              {notified && (
                <div className="mt-2 p-2.5 rounded-lg bg-[#FAEEDA] border border-[#FAC775]">
                  <p className="text-xs text-[#854F0B] leading-relaxed">Al notificar, esta persona verá que la mencionaste. Asegúrate de que la privacidad de la entrada lo permita.</p>
                </div>
              )}
            </div>
          )}

          {/* intensidad */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-[var(--color-text-primary)]">Intensidad del vínculo</span>
              <span className="text-xs font-medium text-[#534AB7]">{intensity}</span>
            </div>
            <input type="range" min={1} max={10} step={1} value={intensity} onChange={e => setIntensity(+e.target.value)} className="w-full accent-[#534AB7]"/>
            <div className="flex justify-between text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
              <span>leve</span><span>moderado</span><span>intenso</span>
            </div>
          </div>

          {/* proximidad */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-[var(--color-text-primary)]">Proximidad</span>
              <span className="text-xs font-medium text-[#534AB7]">{proximity}</span>
            </div>
            <input type="range" min={1} max={10} step={1} value={proximity} onChange={e => setProximity(+e.target.value)} className="w-full accent-[#534AB7]"/>
            <div className="flex justify-between text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
              <span>distante</span><span>cercano</span><span>muy cercano</span>
            </div>
          </div>

          {/* nota privada */}
          <div>
            <p className="text-xs text-[var(--color-text-secondary)] mb-1.5">Nota privada (solo tú la ves)</p>
            <textarea
              value={privateNote}
              onChange={e => setPrivateNote(e.target.value)}
              rows={2}
              placeholder="Ej: la mencioné pero no quiero que lo sepa…"
              className="w-full px-3 py-2 text-xs border border-[var(--color-border-secondary)] rounded-lg bg-[var(--color-background-primary)] text-[var(--color-text-primary)] outline-none focus:border-[#7F77DD] resize-none leading-relaxed placeholder:text-[var(--color-text-tertiary)]"
            />
          </div>
        </div>
      )}
    </ModalShell>
  )
}
