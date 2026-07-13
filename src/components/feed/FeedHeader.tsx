"use client"

// Header sticky del feed: se oculta al scrollear hacia abajo (más allá de un
// pequeño umbral) y reaparece al scrollear hacia arriba o al acercar el mouse
// al borde superior de la pantalla (patrón tipo Notion/YouTube). Escucha el
// scroll del panel de contenido real de AppShell (no window/document, que ya
// no scrollean tras el fix del sidebar fijo) vía useScrollContainer().

import { useEffect, useRef, useState } from "react"
import { Column } from "@once-ui-system/core"
import { useScrollContainer } from "@/components/layout/AppShell"

const SCROLL_THRESHOLD = 24
const REVEAL_ZONE_PX = 40

export function FeedHeader({ children }: { children: React.ReactNode }) {
  const scrollContainerRef = useScrollContainer()
  const [visible, setVisible] = useState(true)
  const lastScrollTop = useRef(0)

  useEffect(() => {
    const el = scrollContainerRef?.current
    if (!el) return

    function handleScroll() {
      const top = el!.scrollTop
      if (top <= SCROLL_THRESHOLD) setVisible(true)
      else if (top > lastScrollTop.current) setVisible(false)
      else if (top < lastScrollTop.current) setVisible(true)
      lastScrollTop.current = top
    }

    el.addEventListener("scroll", handleScroll, { passive: true })
    return () => el.removeEventListener("scroll", handleScroll)
  }, [scrollContainerRef])

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (e.clientY < REVEAL_ZONE_PX) setVisible(true)
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <Column
      fillWidth
      position="sticky"
      top="0"
      zIndex={5}
      background="page"
      paddingX="16"
      paddingTop="24"
      paddingBottom="8"
      gap="8"
      transition="micro-medium"
      translateY={visible ? 0 : "-100%"}
    >
      {children}
    </Column>
  )
}
