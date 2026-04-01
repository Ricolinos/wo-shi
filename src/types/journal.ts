// src/types/journal.ts

export type Visibility = "PRIVATE" | "FRIENDS" | "PUBLIC"
export type EditAccess = "ONLY_ME" | "COLLABORATORS"
export type BondType = "PERSON" | "EMOTION" | "IDEA" | "BELIEF" | "PLACE" | "GROUP" | "OTHER"
export type MediaType = "IMAGE" | "VIDEO" | "AUDIO"

export interface PersonBond {
  bondId?: string         // si ya existe en DB
  name: string
  linkedUserId?: string   // si está vinculado a un usuario real
  isUser: boolean
  notified: boolean
  intensity: number       // 1-10
  proximity: number       // 1-10
  privateNote?: string
}

export interface EmotionBond {
  bondId?: string
  name: string
  type: "EMOTION" | "BELIEF"  // sentimiento se guarda como EMOTION
  subtype: "emotion" | "feeling" | "mood"
  intensity: number
  isNew: boolean
}

export interface IdeaBond {
  bondId?: string
  name: string
  type: "IDEA" | "BELIEF"
  relevance: number       // 1-10
  isNew: boolean
}

export interface GroupRef {
  groupId: string
  name: string
}

export interface MediaFile {
  id: string              // uuid local
  type: MediaType
  file: File
  previewUrl?: string
  duration?: number
}

export interface EntryDraft {
  title: string
  body: string
  date: string            // ISO
  time: string            // HH:mm
  location?: string
  latitude?: number
  longitude?: number
  visibility: Visibility
  editAccess: EditAccess
  persons: PersonBond[]
  emotions: EmotionBond[]
  ideas: IdeaBond[]
  groups: GroupRef[]
  media: MediaFile[]
}

export const EMPTY_DRAFT: EntryDraft = {
  title: "",
  body: "",
  date: new Date().toISOString().split("T")[0],
  time: new Date().toTimeString().slice(0, 5),
  visibility: "PRIVATE",
  editAccess: "ONLY_ME",
  persons: [],
  emotions: [],
  ideas: [],
  groups: [],
  media: [],
}
