"use client"

// Lista de cards del feed con scroll infinito real (InfiniteScroll de Once
// UI). Recibe la primera página ya resuelta server-side (SSR/Suspense) y
// llama a getFeedEntries (server action) con el cursor de la página anterior
// hasta que nextCursor sea null.

import { useCallback, useState } from "react"
import { InfiniteScroll } from "@once-ui-system/core"
import { FeedCard } from "./FeedCard"
import { getFeedEntries } from "@/lib/actions/feed.actions"
import type { FeedEntry } from "@/lib/actions/feed.actions"
import type { BondType, Visibility } from "@prisma/client"

type FeedInfiniteListProps = {
  initialEntries: FeedEntry[]
  initialCursor: string | null
  bondType?: BondType
  visibility: Visibility | "ALL"
}

export function FeedInfiniteList({ initialEntries, initialCursor, bondType, visibility }: FeedInfiniteListProps) {
  const [entries, setEntries] = useState(initialEntries)
  const [cursor, setCursor] = useState(initialCursor)

  const loadMore = useCallback(async () => {
    if (!cursor) return false
    const page = await getFeedEntries({ bondType, visibility, cursor })
    setEntries(prev => [...prev, ...page.entries])
    setCursor(page.nextCursor)
    return page.nextCursor !== null
  }, [cursor, bondType, visibility])

  return (
    <InfiniteScroll
      items={entries}
      renderItem={(entry, index) => <FeedCard entry={entry} index={index} />}
      loadMore={loadMore}
      threshold={200}
    />
  )
}
