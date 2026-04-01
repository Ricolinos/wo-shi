// src/components/journal/IdeaModal.tsx
"use client"

import { useState } from "react"
import { ModalShell } from "./ModalShell"
import type { IdeaBond } from "@/types/journal"

type TabId = "IDEA" | "BELIEF"

interface RecentBond {
  bondId: string
  name: string
  type: TabId
  mentions: number
  isMature: boolean
}

interface Props {
  onClose: () => void
  onAdd: (items: IdeaBond[]) => void
  existing: IdeaBond[]
  recentBonds?: RecentBond[]
}

const MATURITY_THRESHOLD = 5

export function IdeaModal({ onClose, onAdd, existing, recentBonds = [] }: Props) {
  const [tab, setTab] = useState<TabId>("IDEA")
  const [textInput, setTextInput] = useState("")
  const [selected, setSelected] = useState<Map<string, IdeaBond>>(
    new Map(existing.map(i => [i.bondId ?? i.name, i]))
  )
  const [activeKey, setActiveKey] = useState<string | null>(null)

  const isIdea = tab === "IDEA"
  const accentColor = isIdea ? "#BA7517" : "#D4537E"
  const focusRing  = isIdea ? "focus:border-[#EF9F27] focus:ring-[#FAEEDA]" : "focus:border-[#D4537E] focus:ring-[#FBEAF0]"
  const chipClass  = isIdea
    ? "bg-[#FAEEDA] text-[#854F0B] border-[#FAC775]"
    : "bg-[#FBEAF0] text-[#993556] border-[#F4C0D1]"

  const filteredRecent = recentBonds.filter(b => b.type === tab)

  function addNew() {
    const name = textInput.trim()
    if (!name) return
    const key = `new-${name}`
    const next = new Map(selected)
    next.set(key, { name, type: tab, relevance: 5, isNew: true })
    setSelected(next)
    setActiveKey(key)
    setTextInput("")
  }

  function toggleRecent(b: RecentBond) {
    const next = new Map(selected)
    if (next.has(b.bondId)) {
      next.delete(b.bondId)
      if (activeKey === b.bondId) setActiveKey(null)
    } else {
      next.set(b.bondId, { bondId: b.bondId, name: b.name, type: b.type, relevance: 5, isNew: false })
      setActiveKey(b.bondId)
    }
    setSelected(next)
  }

  function setRelevance(key: string, v: number) {
    const next = new Map(selected)
    const item = next.get(key)
    if (item) next.set(key, { ...item, relevance: v })
    setSelected(next)
  }

  function remove(key: string) {
    const next = new Map(selected)
    next.delete(key)
    if (activeKey === key) setActiveKey(null)
    setSelected(next)
  }

  function handleConfirm() {
    onAdd(Array.from(selected.values()))
    onClose()
  }

  const activeItem = activeKey ? selected.get(activeKey) : null
  const activeMentions = activeKey
    ? (recentBonds.find(b => b.bondId === activeKey)?.mentions ?? 0)
    : 0
  const activeMature = activeMentions >= MATURITY_THRESHOLD

  return (
    <ModalShell
      title="Ideas y creencias"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm border border-[var(--color-border-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background-secondary)] transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={handleConfirm} className="px-4 py-2 rounded-lg text-sm bg-[#534AB7] text-white hover:bg-[#3C3489] transition-colors font-medium">
            Agregar al registro
          </button>
        </>
      }
    >
      {/* tabs */}
      <div className="flex border-b border-[var(--color-border-tertiary)]">
        {(["IDEA","BELIEF"] as TabId[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs border-b-2 -mb-px transition-all ${
              tab === t
                ? t === "IDEA"
                  ? "text-[#854F0B] border-[#BA7517] font-medium"
                  : "text-[#993556] border-[#D4537E] font-medium"
                : "text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text-primary)]"
            }`}
          >
            {t === "IDEA" ? "Ideas" : "Creencias"}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4 pb-2">
        {/* input de nueva idea/creencia */}
        <div className="relative mb-2">
          <textarea
            value={textInput}
            onChange={e => setTextInput(e.target.value.slice(0, 120))}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addNew() } }}
            rows={2}
            placeholder={isIdea
              ? "Escribe una idea que surgió en esta situación…"
              : "Una creencia que guía o limita tu forma de ver esto…"
            }
            className={`w-full px-3 py-2 pr-10 text-sm border border-[var(--color-border-secondary)] rounded-lg bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] outline-none resize-none leading-relaxed placeholder:text-[var(--color-text-tertiary)] focus:ring-2 ${focusRing}`}
          />
          <span className="absolute bottom-2 right-2 text-[10px] text-[var(--color-text-tertiary)]">
            {120 - textInput.length}
          </span>
        </div>
        <button
          type="button"
          onClick={addNew}
          style={{ background: accentColor }}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-80"
        >
          + Registrar {isIdea ? "idea" : "creencia"}
        </button>
      </div>

      {/* vínculos anteriores */}
      {filteredRecent.length > 0 && (
        <div className="px-4 pb-3">
          <div className="h-px bg-[var(--color-border-tertiary)] my-3"/>
          <p className="text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2">
            {isIdea ? "Ideas" : "Creencias"} anteriores — selecciona para vincular
          </p>
          <div className="flex flex-col gap-1.5">
            {filteredRecent.map(b => {
              const isSel = selected.has(b.bondId)
              return (
                <button
                  key={b.bondId}
                  type="button"
                  onClick={() => toggleRecent(b)}
                  className={`w-full flex items-start justify-between gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                    isSel
                      ? isIdea ? "bg-[#FAEEDA] border-[#FAC775]" : "bg-[#FBEAF0] border-[#F4C0D1]"
                      : "border-[var(--color-border-tertiary)] hover:border-[var(--color-border-secondary)] hover:bg-[var(--color-background-secondary)]"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--color-text-primary)] leading-snug">{b.name}</p>
                    <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">{b.mentions} menciones</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full mt-1 inline-block ${
                      b.isMature
                        ? "bg-[#EEEDFE] text-[#534AB7] border border-[#CECBF6]"
                        : "bg-[var(--color-background-secondary)] text-[var(--color-text-tertiary)] border border-[var(--color-border-tertiary)]"
                    }`}>
                      {b.isMature ? "vínculo ✦" : "etiqueta"}
                    </span>
                  </div>
                  {isSel && (
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: accentColor }}>
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l2 2L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* relevancia del ítem activo */}
      {activeItem && (
        <div className="border-t border-[var(--color-border-tertiary)] px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-[var(--color-text-primary)]">
              Relevancia en esta entrada:{" "}
              <span className="font-medium" style={{ color: accentColor }}>
                {activeItem.name.length > 30 ? activeItem.name.slice(0,30)+"…" : activeItem.name}
              </span>
            </span>
            <span className="text-xs font-medium" style={{ color: accentColor }}>{activeItem.relevance}</span>
          </div>
          <input
            type="range" min={1} max={10} step={1}
            value={activeItem.relevance}
            onChange={e => setRelevance(activeKey!, +e.target.value)}
            className="w-full"
            style={{ accentColor }}
          />
          <div className="flex justify-between text-[10px] text-[var(--color-text-tertiary)] mt-0.5 mb-2">
            <span>tangencial</span><span>presente</span><span>central</span>
          </div>
          {!activeItem.isNew && (
            <div className={`p-2 rounded-lg border text-xs leading-relaxed ${
              activeMature
                ? "bg-[#E1F5EE] border-[#9FE1CB] text-[#0F6E56]"
                : "bg-[#EEEDFE] border-[#CECBF6] text-[#534AB7]"
            }`}>
              {activeMature
                ? "Este pensamiento ya maduró a vínculo. Esta entrada actualizará su evolución en el grafo."
                : `Con ${MATURITY_THRESHOLD - activeMentions} mención${MATURITY_THRESHOLD - activeMentions === 1 ? "" : "es"} más se convertirá en un vínculo propio con su propio timeline.`
              }
            </div>
          )}
        </div>
      )}

      {/* chips resumen */}
      {selected.size > 0 && (
        <div className="border-t border-[var(--color-border-tertiary)] px-4 py-3">
          <p className="text-[10px] text-[var(--color-text-tertiary)] mb-2">Vinculados a esta entrada</p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(selected.entries()).map(([key, item]) => (
              <span key={key} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border ${chipClass}`}>
                <span className="max-w-[160px] truncate">{item.name}</span>
                <button type="button" onClick={() => remove(key)} className="opacity-50 hover:opacity-100 ml-0.5 leading-none flex-shrink-0">✕</button>
              </span>
            ))}
          </div>
        </div>
      )}
    </ModalShell>
  )
}
