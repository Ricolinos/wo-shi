"use client"

import { Grid, Icon, Media, Row, Text } from "@once-ui-system/core"

type MediaItem = { id: string; type: "IMAGE" | "VIDEO" | "AUDIO"; url: string; duration: number | null }

export function MediaTiles({ media }: { media: MediaItem[] }) {
  const visual = media.filter(m => m.type !== "AUDIO")
  if (!visual.length) return null

  const shown = visual.slice(0, 4)
  const extra = visual.length - shown.length

  return (
    <Grid columns={shown.length === 1 ? 1 : 2} gap="1" fillWidth radius="m" style={{ overflow: "hidden" }}>
      {shown.map((m, i) => (
        <Row key={m.id} position="relative" fillWidth aspectRatio="1/1">
          <Media src={m.url} alt="" aspectRatio="1/1" objectFit="cover" fillWidth />
          {m.type === "VIDEO" && (
            <Row position="absolute" fill horizontal="center" vertical="center" background="overlay">
              <Row width="40" height="40" radius="full" background="surface" horizontal="center" vertical="center">
                <Icon name="play" size="m" onBackground="neutral-strong" />
              </Row>
            </Row>
          )}
          {i === shown.length - 1 && extra > 0 && (
            <Row position="absolute" fill horizontal="center" vertical="center" background="brand-alpha-strong">
              <Text variant="body-strong-l" onSolid="brand-strong">+{extra}</Text>
            </Row>
          )}
        </Row>
      ))}
    </Grid>
  )
}
