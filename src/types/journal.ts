// src/types/journal.ts

export type Visibility = "PRIVATE" | "FRIENDS" | "PUBLIC"
export type EditAccess = "ONLY_ME" | "COLLABORATORS"
export type BondType = "PERSON" | "EMOTION" | "IDEA" | "BELIEF" | "PLACE" | "GROUP" | "OTHER"
export type MediaType = "IMAGE" | "VIDEO" | "AUDIO"

export interface PersonBond {
  bondId?: string
  name: string
  linkedUserId?: string
  isUser: boolean
  notified: boolean
  intensity: number
  proximity: number
  privateNote?: string
}

export interface EmotionBond {
  bondId?: string
  name: string
  type: "EMOTION" | "BELIEF"
  subtype: "emotion" | "feeling" | "mood"
  intensity: number
  isNew: boolean
}

export interface IdeaBond {
  bondId?: string
  name: string
  type: "IDEA" | "BELIEF"
  relevance: number
  isNew: boolean
}

export interface GroupRef {
  groupId: string
  name: string
}

export interface MediaFile {
  id: string
  type: MediaType
  file: File
  previewUrl?: string
  duration?: number
}

export interface EntryDraft {
  title: string
  body: string
  date: string
  time: string
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
