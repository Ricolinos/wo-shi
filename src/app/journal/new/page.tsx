"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Column, Row, Textarea, Input, Button, Text, Tag, IconButton, Heading, DateInput, Media } from "@once-ui-system/core"
import { PersonModal } from "@/components/journal/PersonModal"
import { EmotionModal } from "@/components/journal/EmotionModal"
import { IdeaModal } from "@/components/journal/IdeaModal"
import { AppShell } from "@/components/layout/AppShell"
import { saveEntry } from "@/lib/actions/entry.actions"
import type { EntryDraft, PersonBond, EmotionBond, IdeaBond, Visibility, MediaFile, MediaType } from "@/types/journal"
import { EMPTY_DRAFT } from "@/types/journal"

type ActiveModal = "person" | "emotion" | "idea" | null

const VISIBILITY_OPTS: { value: Visibility; label: string }[] = [
  { value: "PRIVATE", label: "Solo yo" },
  { value: "FRIENDS", label: "Amigos" },
  { value: "PUBLIC",  label: "Público" },
]

export default function NewEntryPage() {
  const router = useRouter()
  const [draft, setDraft] = useState<EntryDraft>(EMPTY_DRAFT)
  const [modal, setModal] = useState<ActiveModal>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const setField = useCallback(<K extends keyof EntryDraft>(key: K, val: EntryDraft[K]) => {
    setDraft(d => ({ ...d, [key]: val }))
  }, [])

  function addPerson(p: PersonBond) {
    setDraft(d => ({ ...d, persons: [...d.persons, p] }))
  }
  function removePerson(idx: number) {
    setDraft(d => ({ ...d, persons: d.persons.filter((_, i) => i !== idx) }))
  }

  function addEmotions(items: EmotionBond[]) {
    setDraft(d => {
      const existing = new Map(d.emotions.map(e => [e.name, e]))
      items.forEach(i => existing.set(i.name, i))
      return { ...d, emotions: Array.from(existing.values()) }
    })
  }
  function removeEmotion(name: string) {
    setDraft(d => ({ ...d, emotions: d.emotions.filter(e => e.name !== name) }))
  }

  function addIdeas(items: IdeaBond[]) {
    setDraft(d => {
      const existing = new Map(d.ideas.map(i => [i.bondId ?? i.name, i]))
      items.forEach(i => existing.set(i.bondId ?? i.name, i))
      return { ...d, ideas: Array.from(existing.values()) }
    })
  }
  function removeIdea(key: string) {
    setDraft(d => ({ ...d, ideas: d.ideas.filter(i => (i.bondId ?? i.name) !== key) }))
  }

  function addMedia(type: MediaType, files: FileList | null) {
    if (!files?.length) return
    const newFiles: MediaFile[] = Array.from(files).map(file => ({
      id: crypto.randomUUID(),
      type,
      file,
      previewUrl: type === "IMAGE" ? URL.createObjectURL(file) : undefined,
    }))
    setDraft(d => ({ ...d, media: [...d.media, ...newFiles] }))
  }
  function removeMedia(id: string) {
    setDraft(d => ({ ...d, media: d.media.filter(m => m.id !== id) }))
  }

  async function handleSave(asDraft = false) {
    setSaveError(null)
    setIsSaving(true)
    try {
      const fd = new FormData()
      fd.append("draft", JSON.stringify({ ...draft, isDraft: asDraft }))
      draft.media.forEach(m => fd.append(`media-${m.id}`, m.file))
      const res = await saveEntry(fd)
      if (!res.ok) { setSaveError(res.error); return }
      router.push(asDraft ? "/journal" : `/journal/${res.entryId}`)
    } catch {
      setSaveError("Ocurrió un error al guardar. Intenta de nuevo.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AppShell>
      <Column fillWidth maxWidth="m" paddingY="24" paddingX="16" gap="16" style={{ margin: "0 auto" }}>
        <Row horizontal="between" vertical="center">
          <Row gap="12" vertical="center">
            <IconButton icon="chevronLeft" variant="secondary" onClick={() => router.back()} aria-label="Volver" />
            <Heading variant="display-strong-xs">Nueva entrada</Heading>
          </Row>
          <Row gap="8">
            <Button variant="secondary" onClick={() => handleSave(true)} disabled={isSaving}>Guardar borrador</Button>
            <Button variant="primary" onClick={() => handleSave(false)} disabled={isSaving || !draft.body.trim()} loading={isSaving}>Guardar</Button>
          </Row>
        </Row>

        {saveError && <Text variant="body-default-s" onBackground="danger-weak">{saveError}</Text>}

        <Column gap="12" padding="16" radius="l" border="neutral-alpha-weak" background="surface">
          <Input id="entry-title" label="¿Qué pasó hoy?" value={draft.title} onChange={e => setField("title", e.target.value)} />
          <Textarea id="entry-body" label="Escribe libremente. Esto es tuyo…" lines={5} value={draft.body} onChange={e => setField("body", e.target.value)} />
          <Row gap="8" wrap>
            <DateInput
              id="entry-datetime"
              label="Fecha y hora"
              timePicker
              value={new Date(`${draft.date}T${draft.time}:00`)}
              onChange={(d: Date) => {
                const pad = (n: number) => String(n).padStart(2, "0")
                setField("date", `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`)
                setField("time", `${pad(d.getHours())}:${pad(d.getMinutes())}`)
              }}
            />
            <Button
              variant="secondary"
              prefixIcon="location"
              onClick={() => {
                if (!navigator.geolocation) return
                navigator.geolocation.getCurrentPosition(pos => {
                  setField("latitude", pos.coords.latitude)
                  setField("longitude", pos.coords.longitude)
                  setField("location", `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`)
                })
              }}
            >
              {draft.location ? draft.location : "Ubicación"}
            </Button>
          </Row>
        </Column>

        <Column gap="8" padding="16" radius="l" border="neutral-alpha-weak" background="surface">
          <Text variant="label-default-s" onBackground="neutral-weak">Personas involucradas</Text>
          <Row gap="8" wrap>
            {draft.persons.map((p, i) => (
              <Tag key={i} variant="brand" label={p.name} onClick={() => removePerson(i)} style={{ cursor: "pointer" }} />
            ))}
            <Button variant="secondary" size="s" onClick={() => setModal("person")}>+ Agregar persona</Button>
          </Row>
        </Column>

        <Column gap="8" padding="16" radius="l" border="neutral-alpha-weak" background="surface">
          <Text variant="label-default-s" onBackground="neutral-weak">Emociones y sentimientos</Text>
          <Row gap="8" wrap>
            {draft.emotions.map(e => (
              <Tag key={e.name} variant="success" label={e.name} onClick={() => removeEmotion(e.name)} style={{ cursor: "pointer" }} />
            ))}
            <Button variant="secondary" size="s" onClick={() => setModal("emotion")}>+ Agregar emoción</Button>
          </Row>
        </Column>

        <Column gap="8" padding="16" radius="l" border="neutral-alpha-weak" background="surface">
          <Text variant="label-default-s" onBackground="neutral-weak">Ideas y creencias</Text>
          <Row gap="8" wrap>
            {draft.ideas.map(i => (
              <Tag key={i.bondId ?? i.name} variant="accent" label={i.name} onClick={() => removeIdea(i.bondId ?? i.name)} style={{ cursor: "pointer" }} />
            ))}
            <Button variant="secondary" size="s" onClick={() => setModal("idea")}>+ Agregar idea o creencia</Button>
          </Row>
        </Column>

        <Column gap="8" padding="16" radius="l" border="neutral-alpha-weak" background="surface">
          <Text variant="label-default-s" onBackground="neutral-weak">Archivos adjuntos</Text>
          {draft.media.length > 0 && (
            <Row gap="8" wrap>
              {draft.media.map(m => (
                <Row key={m.id} position="relative" width="64" height="64" radius="m" border="neutral-alpha-weak" style={{ overflow: "hidden" }}>
                  {m.previewUrl
                    ? <Media src={m.previewUrl} unoptimized alt="" aspectRatio="1/1" objectFit="cover" fillWidth />
                    : <Row fillWidth fillHeight horizontal="center" vertical="center">{m.type === "AUDIO" ? "🎙" : "📹"}</Row>}
                  <IconButton icon="close" size="s" variant="secondary" onClick={() => removeMedia(m.id)} style={{ position: "absolute", top: 2, right: 2 }} aria-label="Quitar" />
                </Row>
              ))}
            </Row>
          )}
          <Row gap="8">
            <Button variant="secondary" prefixIcon="photo" onClick={() => imageInputRef.current?.click()}>Foto</Button>
            <Button variant="secondary" prefixIcon="video" onClick={() => videoInputRef.current?.click()}>Video</Button>
          </Row>
          <input ref={imageInputRef} type="file" accept="image/*" multiple hidden onChange={e => addMedia("IMAGE", e.target.files)} />
          <input ref={videoInputRef} type="file" accept="video/*" hidden onChange={e => addMedia("VIDEO", e.target.files)} />
        </Column>

        <Column gap="8" padding="16" radius="l" border="neutral-alpha-weak" background="surface">
          <Text variant="label-default-s" onBackground="neutral-weak">Privacidad</Text>
          <Row gap="8" wrap>
            {VISIBILITY_OPTS.map(opt => (
              <Tag key={opt.value} variant={draft.visibility === opt.value ? "brand" : "neutral"} label={opt.label} onClick={() => setField("visibility", opt.value)} style={{ cursor: "pointer" }} />
            ))}
          </Row>
        </Column>
      </Column>

      {modal === "person" && <PersonModal onClose={() => setModal(null)} onAdd={addPerson} existing={draft.persons} />}
      {modal === "emotion" && <EmotionModal onClose={() => setModal(null)} onAdd={addEmotions} existing={draft.emotions} />}
      {modal === "idea" && <IdeaModal onClose={() => setModal(null)} onAdd={addIdeas} existing={draft.ideas} />}
    </AppShell>
  )
}
