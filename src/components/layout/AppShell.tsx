"use client"

import { usePathname } from "next/navigation"
import { Row, IconButton, SmartLink } from "@once-ui-system/core"
import { AppSidebar, NAV_ITEMS } from "./AppSidebar"
import styles from "./AppShell.module.css"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <Row fillWidth style={{ minHeight: "100dvh" }}>
      <AppSidebar />
      {/* padding-bottom condicional (solo <=768px, el mismo breakpoint "s" que
          usa el bottom-nav de abajo) vive en AppShell.module.css porque el
          sistema de props de Once UI no ofrece paddingBottom responsivo por
          breakpoint — así la última card no queda tapada en móvil sin dejar
          un padding-bottom "fantasma" en desktop. */}
      <Row flex={1} className={styles.content} style={{ overflowY: "auto" }}>
        {children}
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
