"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, Column, Row, Input, Button, Text, Avatar, Slider, Switch, Textarea, Tag } from "@once-ui-system/core"
import type { PersonBond } from "@/types/journal"

interface SearchResult {
  id: string
  name: string
  username?: string
  avatar?: string
  isUser: boolean
  bondId?: string
  mentions?: number
}

interface Props {
  onClose: () => void
  onAdd: (person: PersonBond) => void
  existing: PersonBond[]
}

export function PersonModal({ onClose, onAdd, existing }: Props) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [notified, setNotified] = useState(false)
  const [intensity, setIntensity] = useState(5)
  const [proximity, setProximity] = useState(5)
  const [privateNote, setPrivateNote] = useState("")

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    try {
      const res = await fetch(`/api/bonds/search?q=${encodeURIComponent(q)}&type=PERSON`)
      const data = await res.json()
      setResults(data.results ?? [])
    } catch {
      setResults([])
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
    if (selected) {
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
    } else if (query.trim()) {
      onAdd({ name: query.trim(), isUser: false, notified: false, intensity, proximity })
    } else {
      return
    }
    onClose()
  }

  const alreadyAdded = (id: string) => existing.some(p => p.linkedUserId === id || p.name === id)

  return (
    <Dialog isOpen onClose={onClose} title="Agregar persona" footer={
      <Row gap="8" horizontal="end" fillWidth>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={handleAdd} disabled={!selected && !query.trim()}>Agregar persona</Button>
      </Row>
    }>
      <Column gap="16" padding="4">
        <Input id="person-search" label="Buscar por nombre o usuario" value={query} onChange={e => setQuery(e.target.value)} />

        {results.length > 0 && (
          <Column gap="4" style={{ maxHeight: 200, overflowY: "auto" }}>
            {results.map(r => (
              <Row
                key={r.id}
                gap="8"
                vertical="center"
                padding="8"
                radius="m"
                background={selected?.id === r.id ? "brand-alpha-weak" : undefined}
                onClick={() => !alreadyAdded(r.id) && handleSelect(r)}
                role="button"
                tabIndex={alreadyAdded(r.id) ? -1 : 0}
                onKeyDown={e => {
                  if ((e.key === "Enter" || e.key === " ") && !alreadyAdded(r.id)) {
                    e.preventDefault()
                    handleSelect(r)
                  }
                }}
                aria-label={`Seleccionar a ${r.name}`}
                style={{ cursor: alreadyAdded(r.id) ? "not-allowed" : "pointer", opacity: alreadyAdded(r.id) ? 0.4 : 1 }}
              >
                <Avatar src={r.avatar} value={r.avatar ? undefined : r.name.slice(0, 2)} size="s" />
                <Column flex={1} gap="0" style={{ minWidth: 0 }}>
                  <Text variant="body-default-s" truncate>{r.name}</Text>
                  <Text variant="label-default-s" onBackground="neutral-weak" truncate>
                    {r.username ? `@${r.username} · wo-shi` : `vínculo externo${r.mentions ? ` · ${r.mentions} menciones` : ""}`}
                  </Text>
                </Column>
                <Tag variant={r.isUser ? "success" : "neutral"} label={r.isUser ? "usuario" : "externo"} />
              </Row>
            ))}
          </Column>
        )}

        {selected && (
          <Column gap="16" paddingTop="8" borderTop="neutral-alpha-weak">
            <Text variant="label-strong-s">{selected.name}</Text>

            {selected.isUser && (
              <Row horizontal="between" vertical="center">
                <Column gap="0">
                  <Text variant="body-default-s">Notificar a esta persona</Text>
                  <Text variant="label-default-s" onBackground="neutral-weak">Le avisará que aparece en esta entrada</Text>
                </Column>
                <Switch isChecked={notified} onToggle={() => setNotified(!notified)} />
              </Row>
            )}

            <Slider label="Intensidad del vínculo" min={1} max={10} value={intensity} onChange={setIntensity} showValue />
            <Slider label="Proximidad" min={1} max={10} value={proximity} onChange={setProximity} showValue />
            <Textarea id="person-note" label="Nota privada (solo tú la ves)" lines={2} value={privateNote} onChange={e => setPrivateNote(e.target.value)} />
          </Column>
        )}
      </Column>
    </Dialog>
  )
}
