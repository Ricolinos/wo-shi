// src/components/journal/EmotionModal.tsx
"use client"

import { useState } from "react"
import { ModalShell } from "./ModalShell"
import type { EmotionBond } from "@/types/journal"

type TabId = "emotion" | "feeling" | "mood"

const CATEGORIES: Record<TabId, { label: string; color: string; groups: { name: string; items: string[] }[] }> = {
  emotion: {
    label: "Emociones",
    color: "coral",
    groups: [
      { name: "Alegría y bienestar", items: ["Alegría", "Euforia", "Alivio", "Entusiasmo", "Orgullo", "Satisfacción"] },
      { name: "Tristeza y pérdida",  items: ["Tristeza", "Nostalgia", "Melancolía", "Duelo", "Decepción"] },
      { name: "Miedo y tensión",     items: ["Ansiedad", "Miedo", "Inseguridad", "Vergüenza", "Pánico"] },
      { name: "Enojo y frustración", items: ["Enojo", "Frustración", "Resentimiento", "Irritación"] },
      { name: "Sorpresa",            items: ["Asombro", "Confusión", "Incredulidad"] },
    ],
  },
  feeling: {
    label: "Sentimientos",
    color: "teal",
    groups: [
      { name: "Conexión",         items: ["Conexión", "Amor", "Pertenencia", "Intimidad", "Ternura"] },
      { name: "Crecimiento",      items: ["Gratitud", "Esperanza", "Curiosidad", "Admiración", "Inspiración"] },
      { name: "Ruptura",          items: ["Soledad", "Desconexión", "Abandono", "Traición", "Rechazo"] },
      { name: "Autorreferencia",  items: ["Autocompasión", "Autocrítica", "Autoaceptación"] },
    ],
  },
  mood: {
    label: "Estado de ánimo",
    color: "amber",
    groups: [
      { name: "Energía alta",   items: ["Activo", "Inspirado", "Inquieto", "Agitado"] },
      { name: "Energía baja",   items: ["Agotado", "Tranquilo", "Adormecido", "Letárgico"] },
      { name: "Claridad mental",items: ["Enfocado", "Confundido", "Disperso", "Lúcido"] },
    ],
  },
}

const COLOR_CLASSES: Record<string, { tag: string; sel: string; chip: string }> = {
  coral: {
    tag:  "bg-[#FAECE7] text-[#993C1D] border-[#F5C4B3] hover:bg-[#F5C4B3]",
    sel:  "bg-[#D85A30] text-white border-[#D85A30]",
    chip: "bg-[#FAECE7] text-[#993C1D] border-[#F5C4B3]",
  },
  teal: {
    tag:  "bg-[#E1F5EE] text-[#0F6E56] border-[#9FE1CB] hover:bg-[#9FE1CB]",
    sel:  "bg-[#1D9E75] text-white border-[#1D9E75]",
    chip: "bg-[#E1F5EE] text-[#0F6E56] border-[#9FE1CB]",
  },
  amber: {
    tag:  "bg-[#FAEEDA] text-[#854F0B] border-[#FAC775] hover:bg-[#FAC775]",
    sel:  "bg-[#BA7517] text-white border-[#BA7517]",
    chip: "bg-[#FAEEDA] text-[#854F0B] border-[#FAC775]",
  },
}

const MATURITY_THRESHOLD = 5

interface Props {
  onClose: () => void
  onAdd: (items: EmotionBond[]) => void
  existing: EmotionBond[]
  bondMentions?: Record<string, number>  // nombre → menciones previas
}

export function EmotionModal({ onClose, onAdd, existing, bondMentions = {} }: Props) {
  const [tab, setTab] = useState<TabId>("emotion")
  const [selected, setSelected] = useState<Map<string, EmotionBond>>(new Map(
    existing.map(e => [e.name, e])
  ))
  const [customInput, setCustomInput] = useState("")
  const [activeItem, setActiveItem] = useState<string | null>(null)
  const [filterQ, setFilterQ] = useState("")

  const cfg = CATEGORIES[tab]

  function toggle(name: string) {
    const next = new Map(selected)
    if (next.has(name)) {
      next.delete(name)
      if (activeItem === name) setActiveItem(null)
    } else {
      next.set(name, { name, type: "EMOTION", subtype: tab, intensity: 5, isNew: false })
      setActiveItem(name)
    }
    setSelected(next)
  }

  function addCustom() {
    const name = customInput.trim()
    if (!name) return
    const next = new Map(selected)
    next.set(name, { name, type: "EMOTION", subtype: tab, intensity: 5, isNew: true })
    setSelected(next)
    setActiveItem(name)
    setCustomInput("")
  }

  function setIntensity(name: string, v: number) {
    const next = new Map(selected)
    const item = next.get(name)
    if (item) next.set(name, { ...item, intensity: v })
    setSelected(next)
  }

  function handleConfirm() {
    onAdd(Array.from(selected.values()))
    onClose()
  }

  const activeEntry = activeItem ? selected.get(activeItem) : null
  const mentions = activeItem ? (bondMentions[activeItem] ?? 0) : 0
  const isMature = mentions >= MATURITY_THRESHOLD

  const tabColors: Record<TabId, string> = {
    emotion: "text-[#993C1D] border-[#D85A30]",
    feeling: "text-[#0F6E56] border-[#1D9E75]",
    mood:    "text-[#854F0B] border-[#BA7517]",
  }

  return (
    <ModalShell
      title="Emociones y sentimientos"
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
        {(["emotion","feeling","mood"] as TabId[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs transition-all border-b-2 -mb-px ${
              tab === t ? `font-medium ${tabColors[t]}` : "text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text-primary)]"
            }`}
          >
            {CATEGORIES[t].label}
          </button>
        ))}
      </div>

      {/* search */}
      <div className="px-4 pt-3 pb-1">
        <input
          type="text"
          value={filterQ}
          onChange={e => setFilterQ(e.target.value)}
          placeholder="Buscar o escribir una nueva…"
          className="w-full px-3 py-2 text-sm bg-[var(--color-background-secondary)] border border-[var(--color-border-secondary)] rounded-lg outline-none focus:border-[#7F77DD] focus:ring-2 focus:ring-[#EEEDFE] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
        />
      </div>

      {/* categorías */}
      <div className="px-4 pb-2 max-h-52 overflow-y-auto">
        {cfg.groups.map(group => {
          const filtered = filterQ
            ? group.items.filter(i => i.toLowerCase().includes(filterQ.toLowerCase()))
            : group.items
          if (!filtered.length) return null
          return (
            <div key={group.name} className="mb-3">
              <p className="text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1.5">{group.name}</p>
              <div className="flex flex-wrap gap-1.5">
                {filtered.map(item => {
                  const isSel = selected.has(item)
                  const c = COLOR_CLASSES[cfg.color]
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggle(item)}
                      className={`px-2.5 py-1 rounded-full text-xs border transition-all ${isSel ? c.sel : c.tag}`}
                    >
                      {item}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* agregar personalizada */}
      <div className="flex items-center gap-2 px-4 pb-3 pt-1 border-t border-[var(--color-border-tertiary)]">
        <input
          type="text"
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addCustom()}
          placeholder="Crear etiqueta propia…"
          className="flex-1 px-3 py-1.5 text-xs border border-dashed border-[var(--color-border-secondary)] rounded-lg bg-transparent outline-none focus:border-[#7F77DD] focus:border-solid text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
        />
        <button
          type="button"
          onClick={addCustom}
          className="px-3 py-1.5 text-xs bg-[var(--color-background-secondary)] border border-[var(--color-border-secondary)] rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-background-tertiary)] transition-colors whitespace-nowrap"
        >
          + Agregar
        </button>
      </div>

      {/* intensidad del ítem activo */}
      {activeEntry && (
        <div className="border-t border-[var(--color-border-tertiary)] px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-[var(--color-text-primary)]">
              Intensidad de{" "}
              <span className={`font-medium ${
                cfg.color === "coral" ? "text-[#D85A30]" : cfg.color === "teal" ? "text-[#1D9E75]" : "text-[#BA7517]"
              }`}>
                {activeEntry.name}
              </span>
            </span>
            <span className="text-xs font-medium text-[#534AB7]">{activeEntry.intensity}</span>
          </div>
          <input
            type="range" min={1} max={10} step={1}
            value={activeEntry.intensity}
            onChange={e => setIntensity(activeEntry.name, +e.target.value)}
            className="w-full accent-[#534AB7]"
          />
          <div className="flex justify-between text-[10px] text-[var(--color-text-tertiary)] mt-0.5 mb-2">
            <span>leve</span><span>moderada</span><span>intensa</span>
          </div>

          {/* hint de madurez */}
          <div className={`p-2 rounded-lg border text-xs leading-relaxed ${
            isMature
              ? "bg-[#E1F5EE] border-[#9FE1CB] text-[#0F6E56]"
              : "bg-[#EEEDFE] border-[#CECBF6] text-[#534AB7]"
          }`}>
            {isMature
              ? `${activeEntry.name} ya es un vínculo con su propio timeline. Esta entrada actualizará su evolución.`
              : `${activeEntry.name} tiene ${mentions} menciones. Con ${MATURITY_THRESHOLD - mentions} más se convertirá en un vínculo propio.`
            }
          </div>
        </div>
      )}

      {/* resumen seleccionados */}
      {selected.size > 0 && (
        <div className="border-t border-[var(--color-border-tertiary)] px-4 py-3">
          <p className="text-[10px] text-[var(--color-text-tertiary)] mb-2">Seleccionados</p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(selected.values()).map(item => {
              const subColor = item.subtype === "emotion" ? "coral" : item.subtype === "feeling" ? "teal" : "amber"
              const c = COLOR_CLASSES[subColor]
              return (
                <span key={item.name} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border ${c.chip}`}>
                  {item.name}
                  <button type="button" onClick={() => toggle(item.name)} className="opacity-50 hover:opacity-100 ml-0.5 leading-none">✕</button>
                </span>
              )
            })}
          </div>
        </div>
      )}
    </ModalShell>
  )
}
