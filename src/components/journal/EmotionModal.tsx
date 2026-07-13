"use client"

import { useState } from "react"
import { Dialog, Column, Row, Button, Text, Tag, Slider, Input, SegmentedControl } from "@once-ui-system/core"
import type { EmotionBond } from "@/types/journal"

type TabId = "emotion" | "feeling" | "mood"

// Tags con onClick no son nativamente accesibles por teclado (Once UI las
// renderiza como un div, no un <button>) — este handler agrega Enter/Espacio.
function onKeyActivate(e: React.KeyboardEvent, fn: () => void) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault()
    fn()
  }
}

const CATEGORIES: Record<TabId, { label: string; groups: { name: string; items: string[] }[] }> = {
  emotion: {
    label: "Emociones",
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
    groups: [
      { name: "Conexión",        items: ["Conexión", "Amor", "Pertenencia", "Intimidad", "Ternura"] },
      { name: "Crecimiento",     items: ["Gratitud", "Esperanza", "Curiosidad", "Admiración", "Inspiración"] },
      { name: "Ruptura",         items: ["Soledad", "Desconexión", "Abandono", "Traición", "Rechazo"] },
      { name: "Autorreferencia", items: ["Autocompasión", "Autocrítica", "Autoaceptación"] },
    ],
  },
  mood: {
    label: "Estado de ánimo",
    groups: [
      { name: "Energía alta",    items: ["Activo", "Inspirado", "Inquieto", "Agitado"] },
      { name: "Energía baja",    items: ["Agotado", "Tranquilo", "Adormecido", "Letárgico"] },
      { name: "Claridad mental", items: ["Enfocado", "Confundido", "Disperso", "Lúcido"] },
    ],
  },
}

const MATURITY_THRESHOLD = 5

interface Props {
  onClose: () => void
  onAdd: (items: EmotionBond[]) => void
  existing: EmotionBond[]
  bondMentions?: Record<string, number>
}

export function EmotionModal({ onClose, onAdd, existing, bondMentions = {} }: Props) {
  const [tab, setTab] = useState<TabId>("emotion")
  const [selected, setSelected] = useState<Map<string, EmotionBond>>(new Map(existing.map(e => [e.name, e])))
  const [customInput, setCustomInput] = useState("")
  const [activeItem, setActiveItem] = useState<string | null>(null)

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

  return (
    <Dialog isOpen onClose={onClose} title="Emociones y sentimientos" footer={
      <Row gap="8" horizontal="end" fillWidth>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={handleConfirm}>Agregar al registro</Button>
      </Row>
    }>
      <Column gap="16" padding="4">
        <SegmentedControl
          fillWidth
          selected={tab}
          buttons={(["emotion", "feeling", "mood"] as TabId[]).map(t => ({ value: t, label: CATEGORIES[t].label }))}
          onToggle={v => setTab(v as TabId)}
        />

        <Column gap="12" style={{ maxHeight: 220, overflowY: "auto" }}>
          {cfg.groups.map(group => (
            <Column key={group.name} gap="4">
              <Text variant="label-default-s" onBackground="neutral-weak">{group.name}</Text>
              <Row gap="4" wrap>
                {group.items.map(item => (
                  <Tag
                    key={item}
                    variant={selected.has(item) ? "brand" : "neutral"}
                    label={item}
                    onClick={() => toggle(item)}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selected.has(item)}
                    onKeyDown={e => onKeyActivate(e, () => toggle(item))}
                    style={{ cursor: "pointer" }}
                  />
                ))}
              </Row>
            </Column>
          ))}
        </Column>

        <Row gap="8">
          <Input
            id="emotion-custom"
            label="Crear etiqueta propia"
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addCustom()}
          />
          <Button variant="secondary" onClick={addCustom}>+ Agregar</Button>
        </Row>

        {activeEntry && (
          <Column gap="8" paddingTop="8" borderTop="neutral-alpha-weak">
            <Slider
              label={`Intensidad de ${activeEntry.name}`}
              min={1} max={10} showValue
              value={activeEntry.intensity}
              onChange={v => setIntensity(activeEntry.name, v)}
            />
            <Text variant="body-default-s" onBackground={isMature ? "success-weak" : "brand-weak"}>
              {isMature
                ? `${activeEntry.name} ya es un vínculo con su propio timeline. Esta entrada actualizará su evolución.`
                : `${activeEntry.name} tiene ${mentions} menciones. Con ${MATURITY_THRESHOLD - mentions} más se convertirá en un vínculo propio.`}
            </Text>
          </Column>
        )}

        {selected.size > 0 && (
          <Row gap="4" wrap paddingTop="8" borderTop="neutral-alpha-weak">
            {Array.from(selected.values()).map(item => (
              <Tag
                key={item.name}
                variant="neutral"
                label={item.name}
                onClick={() => toggle(item.name)}
                role="button"
                tabIndex={0}
                onKeyDown={e => onKeyActivate(e, () => toggle(item.name))}
                aria-label={`Quitar ${item.name}`}
                style={{ cursor: "pointer" }}
              />
            ))}
          </Row>
        )}
      </Column>
    </Dialog>
  )
}
