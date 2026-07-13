"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Column, Row, Textarea, Input, Button, Text, Tag, IconButton, Heading, DateInput, NumberInput, Media, useToast } from "@once-ui-system/core"
import { PersonModal } from "@/components/journal/PersonModal"
import { EmotionModal } from "@/components/journal/EmotionModal"
import { IdeaModal } from "@/components/journal/IdeaModal"
import { AppShell } from "@/components/layout/AppShell"
import { saveEntry } from "@/lib/actions/entry.actions"
import type { EntryDraft, PersonBond, EmotionBond, IdeaBond, Visibility, MediaFile, MediaType } from "@/types/journal"
import { EMPTY_DRAFT } from "@/types/journal"
import styles from "./new-entry.module.css"

// Videos no se comprimen en el cliente (requeriría ffmpeg.wasm) — solo se
// valida un tope de tamaño, dejando margen bajo bodySizeLimit (15mb) del
// server action una vez sumadas las fotos ya comprimidas.
const MAX_VIDEO_BYTES = 12 * 1024 * 1024
// Lado más largo al que se reescala cualquier imagen antes de subirla.
const MAX_IMAGE_DIMENSION = 1920
const IMAGE_JPEG_QUALITY = 0.8

/** Redimensiona y reexporta una imagen como JPEG vía Canvas para aligerar el payload. */
async function compressImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file)
  let { width, height } = bitmap
  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    if (width >= height) {
      height = Math.round((height / width) * MAX_IMAGE_DIMENSION)
      width = MAX_IMAGE_DIMENSION
    } else {
      width = Math.round((width / height) * MAX_IMAGE_DIMENSION)
      height = MAX_IMAGE_DIMENSION
    }
  }
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, width, height)
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", IMAGE_JPEG_QUALITY))
  if (!blob) return file
  const jpegName = file.name.replace(/\.[^.]+$/, "") + ".jpg"
  return new File([blob], jpegName, { type: "image/jpeg" })
}

type ActiveModal = "person" | "emotion" | "idea" | null

// Tags con onClick no son nativamente accesibles por teclado (Once UI las
// renderiza como un div, no un <button>) — este handler agrega Enter/Espacio.
function onKeyActivate(e: React.KeyboardEvent, fn: () => void) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault()
    fn()
  }
}

const VISIBILITY_OPTS: { value: Visibility; label: string }[] = [
  { value: "PRIVATE", label: "Solo yo" },
  { value: "FRIENDS", label: "Amigos" },
  { value: "PUBLIC",  label: "Público" },
]

export default function NewEntryPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [draft, setDraft] = useState<EntryDraft>(EMPTY_DRAFT)
  const [modal, setModal] = useState<ActiveModal>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState(false)
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

  async function addMedia(type: MediaType, files: FileList | null) {
    if (!files?.length) return
    const accepted: MediaFile[] = []
    for (const file of Array.from(files)) {
      if (type === "VIDEO" && file.size > MAX_VIDEO_BYTES) {
        addToast({
          variant: "danger",
          message: `"${file.name}" pesa más de 12 MB. Los videos no se comprimen automáticamente — usa uno más liviano.`,
        })
        continue
      }
      let finalFile = file
      if (type === "IMAGE") {
        try {
          finalFile = await compressImage(file)
        } catch {
          finalFile = file
        }
      }
      accepted.push({
        id: crypto.randomUUID(),
        type,
        file: finalFile,
        previewUrl: type === "IMAGE" ? URL.createObjectURL(finalFile) : undefined,
      })
    }
    if (accepted.length) setDraft(d => ({ ...d, media: [...d.media, ...accepted] }))
  }
  function removeMedia(id: string) {
    setDraft(d => ({ ...d, media: d.media.filter(m => m.id !== id) }))
  }

  function getLocation() {
    if (!navigator.geolocation) return
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords
        setField("latitude", latitude)
        setField("longitude", longitude)
        try {
          const res = await fetch(`/api/geocode/reverse?lat=${latitude}&lon=${longitude}`)
          const data = await res.json()
          setField("location", typeof data.place === "string" ? data.place : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        } catch {
          setField("location", `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        } finally {
          setIsLocating(false)
        }
      },
      () => setIsLocating(false),
    )
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
            <IconButton icon="chevronLeft" variant="secondary" size="xl" className={styles.backButton} onClick={() => router.back()} aria-label="Volver" />
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
            {/* DateInput con timePicker no dispara onChange al elegir solo el día
                (la librería espera a que también toques hora/minuto para confirmar
                el combinado) — eso hacía que un click afuera perdiera el cambio de
                fecha. Se separa en fecha (confirma sola, sin timePicker) + hora/
                minuto vía NumberInput, que sí confirman en cada cambio. */}
            <DateInput
              id="entry-date"
              label="Fecha"
              value={new Date(`${draft.date}T00:00:00`)}
              onChange={(d: Date) => {
                const pad = (n: number) => String(n).padStart(2, "0")
                setField("date", `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`)
              }}
            />
            <NumberInput
              id="entry-hour"
              label="Hora"
              min={0}
              max={23}
              padStart={2}
              value={Number(draft.time.split(":")[0])}
              onChange={h => {
                const pad = (n: number) => String(n).padStart(2, "0")
                const clamped = Math.min(23, Math.max(0, h))
                setField("time", `${pad(clamped)}:${draft.time.split(":")[1]}`)
              }}
            />
            <NumberInput
              id="entry-minute"
              label="Min"
              min={0}
              max={59}
              padStart={2}
              value={Number(draft.time.split(":")[1])}
              onChange={m => {
                const pad = (n: number) => String(n).padStart(2, "0")
                const clamped = Math.min(59, Math.max(0, m))
                setField("time", `${draft.time.split(":")[0]}:${pad(clamped)}`)
              }}
            />
            <Button variant="secondary" prefixIcon="location" loading={isLocating} disabled={isLocating} onClick={getLocation}>
              {isLocating ? "Buscando…" : draft.location ? draft.location : "Ubicación"}
            </Button>
          </Row>
        </Column>

        <Column gap="8" padding="16" radius="l" border="neutral-alpha-weak" background="surface">
          <Text variant="label-default-s" onBackground="neutral-weak">Personas involucradas</Text>
          <Row gap="8" wrap>
            {draft.persons.map((p, i) => (
              <Tag
                key={i}
                variant="brand"
                label={p.name}
                onClick={() => removePerson(i)}
                role="button"
                tabIndex={0}
                onKeyDown={e => onKeyActivate(e, () => removePerson(i))}
                aria-label={`Quitar persona ${p.name}`}
                style={{ cursor: "pointer" }}
              />
            ))}
            <Button variant="secondary" onClick={() => setModal("person")}>+ Agregar persona</Button>
          </Row>
        </Column>

        <Column gap="8" padding="16" radius="l" border="neutral-alpha-weak" background="surface">
          <Text variant="label-default-s" onBackground="neutral-weak">Emociones y sentimientos</Text>
          <Row gap="8" wrap>
            {draft.emotions.map(e => (
              <Tag
                key={e.name}
                variant="success"
                label={e.name}
                onClick={() => removeEmotion(e.name)}
                role="button"
                tabIndex={0}
                onKeyDown={ev => onKeyActivate(ev, () => removeEmotion(e.name))}
                aria-label={`Quitar emoción ${e.name}`}
                style={{ cursor: "pointer" }}
              />
            ))}
            <Button variant="secondary" onClick={() => setModal("emotion")}>+ Agregar emoción</Button>
          </Row>
        </Column>

        <Column gap="8" padding="16" radius="l" border="neutral-alpha-weak" background="surface">
          <Text variant="label-default-s" onBackground="neutral-weak">Ideas y creencias</Text>
          <Row gap="8" wrap>
            {draft.ideas.map(i => (
              <Tag
                key={i.bondId ?? i.name}
                variant="accent"
                label={i.name}
                onClick={() => removeIdea(i.bondId ?? i.name)}
                role="button"
                tabIndex={0}
                onKeyDown={e => onKeyActivate(e, () => removeIdea(i.bondId ?? i.name))}
                aria-label={`Quitar ${i.name}`}
                style={{ cursor: "pointer" }}
              />
            ))}
            <Button variant="secondary" onClick={() => setModal("idea")}>+ Agregar idea o creencia</Button>
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
                  {/* size="m" (32px) sigue por debajo del mínimo táctil de 44px, pero
                      el thumbnail es de 64x64 — un botón de 44px+ lo cubriría casi
                      por completo. Ver informe de auditoría para el trade-off. */}
                  <IconButton icon="close" size="m" variant="secondary" onClick={() => removeMedia(m.id)} style={{ position: "absolute", top: 2, right: 2 }} aria-label="Quitar" />
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
              <Tag
                key={opt.value}
                variant={draft.visibility === opt.value ? "brand" : "neutral"}
                label={opt.label}
                onClick={() => setField("visibility", opt.value)}
                role="button"
                tabIndex={0}
                onKeyDown={e => onKeyActivate(e, () => setField("visibility", opt.value))}
                aria-pressed={draft.visibility === opt.value}
                style={{ cursor: "pointer" }}
              />
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
