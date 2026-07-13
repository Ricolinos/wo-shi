"use client"

import { createContext, useContext, useRef } from "react"
import type { RefObject } from "react"
import { usePathname } from "next/navigation"
import { Row, IconButton, SmartLink } from "@once-ui-system/core"
import { AppSidebar, NAV_ITEMS } from "./AppSidebar"
import styles from "./AppShell.module.css"

// Expone el nodo DOM del panel de contenido scrolleable (la única parte de
// la app que hace scroll real — ver AppShell.module.css/layout.tsx) para que
// componentes anidados (ej. FeedHeader) puedan escuchar su evento `scroll`
// sin depender de selectors de CSS Modules ni de window/document (que ya no
// scrollean, ver bug de sidebar fijo).
const ScrollContainerContext = createContext<RefObject<HTMLDivElement | null> | null>(null)

export function useScrollContainer() {
  return useContext(ScrollContainerContext)
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <Row fill>
      <AppSidebar />
      {/* padding-bottom condicional (solo <=768px, el mismo breakpoint "s" que
          usa el bottom-nav de abajo) y padding-left (ancho del sidebar fijo,
          anulado en el mismo breakpoint donde el sidebar se oculta) viven en
          AppShell.module.css porque el sistema de props de Once UI no ofrece
          paddingBottom/paddingLeft responsivos por breakpoint. */}
      <Row ref={contentRef} flex={1} className={styles.content} overflowY="auto">
        <ScrollContainerContext.Provider value={contentRef}>
          {children}
        </ScrollContainerContext.Provider>
      </Row>
      <Row
        as="nav"
        fillWidth
        horizontal="around"
        vertical="center"
        paddingTop="8"
        paddingX="16"
        gap="4"
        background="surface"
        border="neutral-alpha-weak"
        position="fixed"
        bottom="0"
        left="0"
        zIndex={10}
        hide
        s={{ hide: false }}
        style={{ paddingBottom: "max(var(--static-space-8), env(safe-area-inset-bottom))" }}
      >
        {NAV_ITEMS.map(item => (
          <SmartLink key={item.href} href={item.href}>
            <IconButton
              icon={item.icon}
              variant={pathname.startsWith(item.href) ? "primary" : "tertiary"}
              size="xl"
              aria-label={item.label}
            />
          </SmartLink>
        ))}
        <SmartLink href="/journal/new">
          <IconButton icon="add" variant="primary" size="xl" aria-label="Nueva entrada" />
        </SmartLink>
      </Row>
    </Row>
  )
}
