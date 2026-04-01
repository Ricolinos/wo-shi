// src/app/journal/new/page.tsx
"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { PersonModal }  from "@/components/journal/PersonModal"
import { EmotionModal } from "@/components/journal/EmotionModal"
import { IdeaModal }    from "@/components/journal/IdeaModal"
import { saveEntry }    from "@/lib/actions/entry.actions"
import type {
  EntryDraft, PersonBond, EmotionBond, IdeaBond,
  Visibility, MediaFile, MediaType
} from "@/types/journal"
import { EMPTY_DRAFT } from "@/types/journal"

// ─── helpers ──────────────────────────────────────────────────────────────────

function cls(...c: (string | false | undefined)[]) { return c.filter(Boolean).join(" ") }

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cls("bg-[var(--color-background-primary)] border border-[var(--color-border-tertiary)] rounded-xl p-4 mb-3", className)}>
      {children}
    </div>
  )
}

function SecLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2.5">{children}</p>
}

function Divider() {
  return <div className="h-px bg-[var(--color-border-tertiary)] my-3"/>
}

// ─── chips de vínculo ─────────────────────────────────────────────────────────

function PersonChip({ p, onRemove }: { p: PersonBond; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-[#EEEDFE] text-[#534AB7] border border-[#CECBF6]">
      <span className={cls("w-1.5 h-1.5 rounded-full flex-shrink-0", p.notified ? "bg-[#534AB7]" : "bg-[#CECBF6]")}/>
      {p.name}
      <button type="button" onClick={onRemove} className="opacity-50 hover:opacity-100 leading-none">✕</button>
    </span>
  )
}

function EmotionChip({ e, onRemove }: { e: EmotionBond; onRemove: () => void }) {
  const colors: Record<string, string> = {
    emotion: "bg-[#FAECE7] text-[#993C1D] border-[#F5C4B3]",
    feeling: "bg-[#E1F5EE] text-[#0F6E56] border-[#9FE1CB]",
    mood:    "bg-[#FAEEDA] text-[#854F0B] border-[#FAC775]",
  }
  return (
    <span className={cls("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border", colors[e.subtype])}>
      {e.name}
      <button type="button" onClick={onRemove} className="opacity-50 hover:opacity-100 leading-none ml-0.5">✕</button>
    </span>
  )
}

function IdeaChip({ i, onRemove }: { i: IdeaBond; onRemove: () => void }) {
  const color = i.type === "IDEA"
    ? "bg-[#FAEEDA] text-[#854F0B] border-[#FAC775]"
    : "bg-[#FBEAF0] text-[#993556] border-[#F4C0D1]"
  return (
    <span className={cls("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border max-w-[200px]", color)}>
      <span className="truncate">{i.name}</span>
      <button type="button" onClick={onRemove} className="opacity-50 hover:opacity-100 leading-none ml-0.5 flex-shrink-0">✕</button>
    </span>
  )
}

// ─── botón de agregar vacío ────────────────────────────────────────────────────

function AddChipBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border border-dashed border-[var(--color-border-secondary)] text-[var(--color-text-tertiary)] hover:border-[var(--color-border-primary)] hover:text-[var(--color-text-secondary)] transition-colors"
    >
      + {label}
    </button>
  )
}

// ─── media preview ────────────────────────────────────────────────────────────

function MediaBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1 px-4 py-3 rounded-lg border border-dashed border-[var(--color-border-secondary)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-background-secondary)] hover:text-[var(--color-text-secondary)] transition-colors text-xs"
    >
      {icon}
      {label}
    </button>
  )
}

// ─── icons ────────────────────────────────────────────────────────────────────

const PhotoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="2" y="3" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="6.5" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1"/>
    <path d="M2 13l4-3.5 3 2.5 2.5-2 4.5 3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const VideoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="2" y="4" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M12 7l4-2v8l-4-2V7z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
  </svg>
)
const MicIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="7" y="2" width="4" height="8" rx="2" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M4 9.5a5 5 0 0010 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="9" y1="14.5" x2="9" y2="16.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)
const LocationIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M6 1C4.07 1 2.5 2.57 2.5 4.5c0 2.8 3.5 6.5 3.5 6.5s3.5-3.7 3.5-6.5C9.5 2.57 7.93 1 6 1z" stroke="currentColor" strokeWidth="1"/>
    <circle cx="6" cy="4.5" r="1" stroke="currentColor" strokeWidth="0.8"/>
  </svg>
)

// ─── página principal ─────────────────────────────────────────────────────────

type ActiveModal = "person" | "emotion" | "idea" | null

export default function NewEntryPage() {
  const router = useRouter()
  const [draft, setDraft] = useState<EntryDraft>(EMPTY_DRAFT)
  const [modal, setModal] = useState<ActiveModal>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // ── actualizadores del draft ────────────────────────────────────────────────

  const setField = useCallback(<K extends keyof EntryDraft>(key: K, val: EntryDraft[K]) => {
    setDraft(d => ({ ...d, [key]: val }))
  }, [])

  function addPersons(p: PersonBond) {
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

  // ── privacidad ──────────────────────────────────────────────────────────────

  const VISIBILITY_OPTS: { value: Visibility; label: string }[] = [
    { value: "PRIVATE", label: "Solo yo" },
    { value: "FRIENDS", label: "Amigos" },
    { value: "PUBLIC",  label: "Público" },
  ]

  // ── guardar ─────────────────────────────────────────────────────────────────

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

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <main className="min-h-screen bg-[var(--color-background-tertiary)] pb-16">
        <div className="max-w-xl mx-auto px-4 pt-5">

          {/* topbar */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="w-8 h-8 rounded-full border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] flex items-center justify-center text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-background-secondary)] transition-colors"
              >
                ←
              </button>
              <span className="text-sm font-medium text-[var(--color-text-primary)]">Nueva entrada</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={isSaving}
                className="px-3 py-1.5 text-xs border border-[var(--color-border-secondary)] rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-background-secondary)] transition-colors disabled:opacity-50"
              >
                Guardar borrador
              </button>
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={isSaving || !draft.body.trim()}
                className="px-4 py-1.5 text-xs font-medium bg-[#534AB7] text-white rounded-lg hover:bg-[#3C3489] transition-colors disabled:opacity-50"
              >
                {isSaving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>

          {saveError && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-[var(--color-background-danger)] border border-[var(--color-border-danger)] text-xs text-[var(--color-text-danger)]">
              {saveError}
            </div>
          )}

          {/* título + cuerpo */}
          <SectionCard>
            <textarea
              value={draft.title}
              onChange={e => setField("title", e.target.value)}
              rows={1}
              placeholder="¿Qué pasó hoy?"
              className="w-full text-lg font-medium bg-transparent border-none outline-none resize-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] leading-snug"
            />
            <Divider />
            <textarea
              value={draft.body}
              onChange={e => setField("body", e.target.value)}
              rows={5}
              placeholder="Escribe libremente. Esto es tuyo…"
              className="w-full text-sm bg-transparent border-none outline-none resize-none text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-tertiary)] leading-relaxed"
            />
            <Divider />

            {/* meta: fecha, hora, lugar */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-[var(--color-border-secondary)] text-xs text-[var(--color-text-secondary)] bg-transparent">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1"/><line x1="4" y1="1" x2="4" y2="3" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/><line x1="8" y1="1" x2="8" y2="3" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/><line x1="1" y1="5" x2="11" y2="5" stroke="currentColor" strokeWidth="0.8"/></svg>
                <input type="date" value={draft.date} onChange={e => setField("date", e.target.value)}
                  className="bg-transparent border-none outline-none text-xs w-32 cursor-pointer"/>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-[var(--color-border-secondary)] text-xs text-[var(--color-text-secondary)]">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1"/><line x1="6" y1="3.5" x2="6" y2="6" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/><line x1="6" y1="6" x2="8" y2="7.2" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
                <input type="time" value={draft.time} onChange={e => setField("time", e.target.value)}
                  className="bg-transparent border-none outline-none text-xs cursor-pointer"/>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!navigator.geolocation) return
                  navigator.geolocation.getCurrentPosition(pos => {
                    setField("latitude", pos.coords.latitude)
                    setField("longitude", pos.coords.longitude)
                    setField("location", `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`)
                  })
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-[var(--color-border-secondary)] text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-background-secondary)] transition-colors"
              >
                <LocationIcon />
                {draft.location ? draft.location : "+ Ubicación"}
              </button>
            </div>
          </SectionCard>

          {/* personas */}
          <SectionCard>
            <SecLabel>Personas involucradas</SecLabel>
            <div className="flex flex-wrap gap-1.5">
              {draft.persons.map((p, i) => (
                <PersonChip key={i} p={p} onRemove={() => removePerson(i)} />
              ))}
              <AddChipBtn onClick={() => setModal("person")} label="agregar persona" />
            </div>
          </SectionCard>

          {/* emociones + sentimientos */}
          <SectionCard>
            <SecLabel>Emociones y sentimientos</SecLabel>
            <div className="flex flex-wrap gap-1.5">
              {draft.emotions.map(e => (
                <EmotionChip key={e.name} e={e} onRemove={() => removeEmotion(e.name)} />
              ))}
              <AddChipBtn onClick={() => setModal("emotion")} label="agregar emoción" />
            </div>
          </SectionCard>

          {/* ideas + creencias */}
          <SectionCard>
            <SecLabel>Ideas y creencias</SecLabel>
            <div className="flex flex-wrap gap-1.5">
              {draft.ideas.map(i => (
                <IdeaChip key={i.bondId ?? i.name} i={i} onRemove={() => removeIdea(i.bondId ?? i.name)} />
              ))}
              <AddChipBtn onClick={() => setModal("idea")} label="agregar idea o creencia" />
            </div>
          </SectionCard>

          {/* media */}
          <SectionCard>
            <SecLabel>Archivos adjuntos</SecLabel>
            {draft.media.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {draft.media.map(m => (
                  <div key={m.id} className="relative">
                    {m.previewUrl
                      ? <img src={m.previewUrl} className="w-16 h-16 rounded-lg object-cover border border-[var(--color-border-tertiary)]" alt=""/>
                      : <div className="w-16 h-16 rounded-lg bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] flex items-center justify-center text-xs text-[var(--color-text-tertiary)]">{m.type === "AUDIO" ? "🎙" : "📹"}</div>
                    }
                    <button type="button" onClick={() => removeMedia(m.id)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[var(--color-text-secondary)] text-white text-[9px] flex items-center justify-center">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              <MediaBtn icon={<PhotoIcon />} label="Foto" onClick={() => imageInputRef.current?.click()} />
              <MediaBtn icon={<VideoIcon />} label="Video" onClick={() => videoInputRef.current?.click()} />
              <MediaBtn icon={<MicIcon />} label="Nota de voz" onClick={() => {}} />
            </div>
            <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => addMedia("IMAGE", e.target.files)} />
            <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={e => addMedia("VIDEO", e.target.files)} />
          </SectionCard>

          {/* privacidad */}
          <SectionCard>
            <SecLabel>Privacidad</SecLabel>
            <div className="flex gap-2 flex-wrap">
              {VISIBILITY_OPTS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setField("visibility", opt.value)}
                  className={cls(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors",
                    draft.visibility === opt.value
                      ? "bg-[#EEEDFE] text-[#534AB7] border-[#CECBF6] font-medium"
                      : "border-[var(--color-border-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background-secondary)]"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </SectionCard>

        </div>
      </main>

      {/* modales */}
      {modal === "person" && (
        <PersonModal
          onClose={() => setModal(null)}
          onAdd={addPersons}
          existing={draft.persons}
        />
      )}
      {modal === "emotion" && (
        <EmotionModal
          onClose={() => setModal(null)}
          onAdd={addEmotions}
          existing={draft.emotions}
        />
      )}
      {modal === "idea" && (
        <IdeaModal
          onClose={() => setModal(null)}
          onAdd={addIdeas}
          existing={draft.ideas}
        />
      )}
    </>
  )
}
