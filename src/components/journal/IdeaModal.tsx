"use client"

import { useState } from "react"
import { Dialog, Column, Row, Button, Text, Tag, Slider, Textarea, SegmentedControl } from "@once-ui-system/core"
import type { IdeaBond } from "@/types/journal"

type TabId = "IDEA" | "BELIEF"

// Elementos con onClick (Tag, Row) no son nativamente accesibles por teclado
// en Once UI (se renderizan como div) — este handler agrega Enter/Espacio.
function onKeyActivate(e: React.KeyboardEvent, fn: () => void) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault()
    fn()
  }
}

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
  const [selected, setSelected] = useState<Map<string, IdeaBond>>(new Map(existing.map(i => [i.bondId ?? i.name, i])))
  const [activeKey, setActiveKey] = useState<string | null>(null)

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
  const activeMentions = activeKey ? (recentBonds.find(b => b.bondId === activeKey)?.mentions ?? 0) : 0
  const activeMature = activeMentions >= MATURITY_THRESHOLD

  return (
    <Dialog isOpen onClose={onClose} title="Ideas y creencias" footer={
      <Row gap="8" horizontal="end" fillWidth>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={handleConfirm}>Agregar al registro</Button>
      </Row>
    }>
      <Column gap="16" padding="4">
        <SegmentedControl
          fillWidth
          selected={tab}
          buttons={[{ value: "IDEA", label: "Ideas" }, { value: "BELIEF", label: "Creencias" }]}
          onToggle={v => setTab(v as TabId)}
        />

        <Textarea
          id="idea-text"
          label={tab === "IDEA" ? "Escribe una idea que surgió en esta situación…" : "Una creencia que guía o limita tu forma de ver esto…"}
          lines={2}
          value={textInput}
          onChange={e => setTextInput(e.target.value.slice(0, 120))}
          characterCount
        />
        <Button variant="secondary" onClick={addNew}>+ Registrar {tab === "IDEA" ? "idea" : "creencia"}</Button>

        {filteredRecent.length > 0 && (
          <Column gap="8" paddingTop="8" borderTop="neutral-alpha-weak">
            <Text variant="label-default-s" onBackground="neutral-weak">
              {tab === "IDEA" ? "Ideas" : "Creencias"} anteriores — selecciona para vincular
            </Text>
            <Column gap="4">
              {filteredRecent.map(b => (
                <Row
                  key={b.bondId}
                  gap="8"
                  vertical="center"
                  padding="8"
                  radius="m"
                  border="neutral-alpha-weak"
                  background={selected.has(b.bondId) ? "brand-alpha-weak" : undefined}
                  onClick={() => toggleRecent(b)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => onKeyActivate(e, () => toggleRecent(b))}
                  aria-label={`Vincular ${b.name}`}
                  style={{ cursor: "pointer" }}
                >
                  <Column flex={1} gap="0" style={{ minWidth: 0 }}>
                    <Text variant="body-default-s" truncate>{b.name}</Text>
                    <Text variant="label-default-s" onBackground="neutral-weak">{b.mentions} menciones</Text>
                  </Column>
                  <Tag variant={b.isMature ? "brand" : "neutral"} label={b.isMature ? "vínculo" : "etiqueta"} />
                </Row>
              ))}
            </Column>
          </Column>
        )}

        {activeItem && (
          <Column gap="8" paddingTop="8" borderTop="neutral-alpha-weak">
            <Slider
              label={`Relevancia de ${activeItem.name.length > 30 ? activeItem.name.slice(0, 30) + "…" : activeItem.name}`}
              min={1} max={10} showValue
              value={activeItem.relevance}
              onChange={v => setRelevance(activeKey!, v)}
            />
            {!activeItem.isNew && (
              <Text variant="body-default-s" onBackground={activeMature ? "success-weak" : "brand-weak"}>
                {activeMature
                  ? "Este pensamiento ya maduró a vínculo. Esta entrada actualizará su evolución."
                  : `Con ${MATURITY_THRESHOLD - activeMentions} mención(es) más se convertirá en un vínculo propio.`}
              </Text>
            )}
          </Column>
        )}

        {selected.size > 0 && (
          <Row gap="4" wrap paddingTop="8" borderTop="neutral-alpha-weak">
            {Array.from(selected.entries()).map(([key, item]) => (
              <Tag
                key={key}
                variant="neutral"
                label={item.name}
                onClick={() => remove(key)}
                role="button"
                tabIndex={0}
                onKeyDown={e => onKeyActivate(e, () => remove(key))}
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
