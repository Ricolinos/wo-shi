// src/components/feed/AudioBanner.tsx
// Banner de audio con gradiente purple, waveform decorativo y botón de play.
"use client"

import { useState } from "react"

// Alturas de las barras del waveform (decorativas, en px)
const WAVEFORM_BARS = [8,15,22,11,26,17,9,20,23,10,17,26,13,20,8,15,22,10,17,6,13,20,8,15]

type Props = {
  url: string
  duration: number | null
}

export function AudioBanner({ url, duration }: Props) {
  const [playing, setPlaying] = useState(false)
  const [progress] = useState(0.33)

  function fmt(secs: number | null): string {
    if (!secs) return "0:00"
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  const playedBars = Math.floor(progress * WAVEFORM_BARS.length)

  return (
    <div
      className="flex items-center gap-3.5 px-4 py-[18px]"
      style={{ background: "linear-gradient(135deg, #534AB7 0%, #7F77DD 100%)" }}
    >
      {/* botón play/pause */}
      <button
        type="button"
        onClick={() => setPlaying(p => !p)}
        className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-90"
        aria-label={playing ? "Pausar" : "Reproducir"}
      >
        <span className="text-[#534AB7] text-[15px] ml-0.5">
          {playing ? "⏸" : "▶"}
        </span>
      </button>

      {/* waveform + tiempo */}
      <div className="flex-1">
        <div className="flex items-center gap-0.5 h-[30px] mb-[5px]">
          {WAVEFORM_BARS.map((h, i) => (
            <div
              key={i}
              className="w-[3px] rounded-sm flex-shrink-0"
              style={{
                height: `${h}px`,
                background: i < playedBars
                  ? "rgba(255,255,255,0.92)"
                  : "rgba(255,255,255,0.30)",
              }}
            />
          ))}
        </div>
        <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.65)" }}>
          {fmt(Math.floor((duration ?? 0) * progress))} / {fmt(duration)}
        </p>
      </div>
    </div>
  )
}
