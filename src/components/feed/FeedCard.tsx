"use client"

import { Column, Row, Avatar, Text, Tag, RevealFx } from "@once-ui-system/core"
import { MediaTiles } from "./MediaTiles"
import { AudioBanner } from "./AudioBanner"
import { BondChips } from "./BondChips"
import type { FeedEntry } from "@/lib/actions/feed.actions"

const VISIBILITY_LABEL = { PRIVATE: "Solo yo", FRIENDS: "Amigos", PUBLIC: "Público" } as const

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return "hace unos min"
  if (h < 24) return `hace ${h} h`
  return `hace ${Math.floor(h / 24)} d`
}

export function FeedCard({ entry, index }: { entry: FeedEntry; index: number }) {
  const audio = entry.media.find(m => m.type === "AUDIO")
  const visual = entry.media.filter(m => m.type !== "AUDIO")

  return (
    <RevealFx translateY="8" delay={index * 0.1} fillWidth>
      <Column fillWidth radius="l" border="neutral-alpha-weak" background="surface" padding="16" gap="12">
        <Row fillWidth vertical="center" gap="8">
          <Avatar
            src={entry.user.avatar ?? undefined}
            value={entry.user.avatar ? undefined : (entry.user.name?.slice(0, 2) ?? entry.user.username.slice(0, 2))}
            size="s"
          />
          <Column flex={1} gap="0">
            <Text variant="label-strong-s">{entry.user.name ?? entry.user.username}</Text>
            <Text variant="label-default-s" onBackground="neutral-weak">
              {timeAgo(entry.date)}{entry.location ? ` · ${entry.location}` : ""}
            </Text>
          </Column>
          <Tag variant="neutral" label={VISIBILITY_LABEL[entry.visibility]} />
        </Row>

        {visual.length > 0 && <MediaTiles media={entry.media} />}
        {audio && <AudioBanner url={audio.url} duration={audio.duration} />}

        <Column gap="4">
          {entry.title && <Text variant="label-strong-m">{entry.title}</Text>}
          <Text variant="body-default-s" onBackground="neutral-weak">{entry.body}</Text>
        </Column>

        {entry.entryBonds.length > 0 && (
          <Row gap="8" wrap>
            <BondChips bonds={entry.entryBonds.map(eb => eb.bond)} />
          </Row>
        )}
      </Column>
    </RevealFx>
  )
}
