// src/components/feed/FeedCard.tsx
// Tarjeta completa de una entrada en el feed.
// Incluye: header (avatar + autor + tiempo + visibilidad), media (tiles o audio banner), y cuerpo (título + texto + chips).

import type { FeedEntry } from "@/lib/actions/feed.actions"
import { MediaTiles } from "@/components/feed/MediaTiles"
import { AudioBanner } from "@/components/feed/AudioBanner"
import { BondChips } from "@/components/feed/BondChips"

type Props = {
  entry: FeedEntry
}

// Icono y label de visibilidad
const VISIBILITY_CONFIG = {
  PRIVATE: {
    label: "Solo yo",
    icon: (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <rect x="1.5" y="4.5" width="7" height="4.5" rx="1" stroke="#888" strokeWidth="1"/>
        <path d="M3 4.5V3.5a2 2 0 014 0v1" stroke="#888" strokeWidth="1" strokeLinecap="round"/>
        <circle cx="5" cy="6.8" r=".7" fill="#888"/>
      </svg>
    ),
  },
  FRIENDS: {
    label: "Amigos",
    icon: (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <circle cx="3.5" cy="3.5" r="1.5" stroke="#888" strokeWidth="1"/>
        <circle cx="6.5" cy="3.5" r="1.5" stroke="#888" strokeWidth="1"/>
        <path d="M1 8.5c0-1.5 1.1-2.5 2.5-2.5S6 7 6 8.5" stroke="#888" strokeWidth="1" strokeLinecap="round"/>
        <path d="M6.5 6c1 0 2.5.8 2.5 2.5" stroke="#888" strokeWidth="1" strokeLinecap="round"/>
      </svg>
    ),
  },
  PUBLIC: {
    label: "Público",
    icon: (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <circle cx="5" cy="5" r="4" stroke="#888" strokeWidth="1"/>
        <path d="M5 1s-2 1.5-2 4 2 4 2 4" stroke="#888" strokeWidth=".8"/>
        <path d="M5 1s2 1.5 2 4-2 4-2 4" stroke="#888" strokeWidth=".8"/>
        <line x1="1.2" y1="5" x2="8.8" y2="5" stroke="#888" strokeWidth=".8"/>
      </svg>
    ),
  },
}

function relativeTime(date: Date): string {
  const diff = Date.now() - new Date(date).getTime()
  if (diff < 0) return "Ahora mismo"
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (mins < 1)   return "Ahora mismo"
  if (mins < 60)  return `Hace ${mins} min`
  if (hours < 24) return `Hace ${hours} ${hours === 1 ? "hora" : "horas"}`
  if (days === 1) return "Ayer"
  return `Hace ${days} días`
}

function initials(name: string | null, username: string): string {
  const n = name ?? username
  return n.slice(0, 2).toUpperCase()
}

export function FeedCard({ entry }: Props) {
  const vis = VISIBILITY_CONFIG[entry.visibility]
  const hasAudio = entry.media.some(m => m.type === "AUDIO")
  const audioItem = entry.media.find(m => m.type === "AUDIO")
  const hasVisualMedia = entry.media.some(m => m.type !== "AUDIO")

  return (
    <article className="bg-white border border-[#e2e2ef] rounded-xl overflow-hidden" style={{ borderWidth: "0.5px" }}>

      {/* ── header ── */}
      <div className="flex items-center gap-2.5 px-4 py-3.5">
        {entry.user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.user.avatar}
            alt=""
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#AFA9EC] flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-medium text-white">
              {initials(entry.user.name, entry.user.username)}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-[#1a1a2e] leading-none">
            {entry.user.name ?? entry.user.username}
          </p>
          <p className="text-[10px] text-[#999] mt-0.5">
            {relativeTime(entry.date)}
            {entry.location && ` · ${entry.location}`}
          </p>
        </div>

        <span className="flex items-center gap-1 text-[9px] text-[#888] bg-[#f4f4f8] border border-[#e8e8f0] rounded px-[7px] py-[2px] flex-shrink-0" style={{ borderWidth: "0.5px" }}>
          {vis.icon}
          {vis.label}
        </span>
      </div>

      {/* ── bloque de media ── */}
      {hasAudio && audioItem && (
        <AudioBanner url={audioItem.url} duration={audioItem.duration} />
      )}
      {hasVisualMedia && (
        <MediaTiles media={entry.media} />
      )}

      {/* ── cuerpo ── */}
      <div className="px-4 py-3.5">
        {entry.title && (
          <h3 className="text-[13px] font-medium text-[#1a1a2e] mb-1">{entry.title}</h3>
        )}
        <p className="text-[11px] text-[#555566] leading-relaxed line-clamp-3">{entry.body}</p>
        <BondChips bonds={entry.entryBonds.map(eb => eb.bond)} />
      </div>

    </article>
  )
}
