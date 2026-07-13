"use client"

import { useRef, useState } from "react"
import { Row, Column, Text, IconButton } from "@once-ui-system/core"

export function AudioBanner({ url, duration }: { url: string; duration: number | null }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  function toggle() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) audio.pause()
    else audio.play()
    setPlaying(!playing)
  }

  function fmt(s: number) {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  return (
    <Row fillWidth radius="m" padding="16" gap="12" vertical="center" background="brand-strong">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={e => setProgress(e.currentTarget.currentTime)}
        onEnded={() => setPlaying(false)}
      />
      <IconButton icon={playing ? "pause" : "play"} variant="secondary" size="m" onClick={toggle} aria-label="Reproducir" />
      <Column gap="4" flex={1}>
        <Row fillWidth height="4" radius="full" background="neutral-alpha-medium" style={{ overflow: "hidden" }}>
          <Row height="4" background="brand-medium" style={{ width: duration ? `${(progress / duration) * 100}%` : "0%" }} />
        </Row>
        <Text variant="label-default-s" onSolid="neutral-strong">
          {fmt(progress)} / {duration ? fmt(duration) : "--:--"}
        </Text>
      </Column>
    </Row>
  )
}
