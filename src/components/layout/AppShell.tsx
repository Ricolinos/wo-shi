"use client"

import { usePathname } from "next/navigation"
import { Row, IconButton, SmartLink } from "@once-ui-system/core"
import { AppSidebar, NAV_ITEMS } from "./AppSidebar"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <Row fillWidth style={{ minHeight: "100dvh" }}>
      <AppSidebar />
      <Row flex={1} style={{ overflowY: "auto" }}>
        {children}
      </Row>
      <Row
        as="nav"
        fillWidth
        horizontal="around"
        vertical="center"
        paddingY="8"
        paddingX="16"
        gap="4"
        background="surface"
        border="neutral-alpha-weak"
        position="fixed"
        bottom="0"
        left="0"
        zIndex={10}
        l={{ hide: true }}
      >
        {NAV_ITEMS.map(item => (
          <SmartLink key={item.href} href={item.href}>
            <IconButton
              icon={item.icon}
              variant={pathname.startsWith(item.href) ? "primary" : "tertiary"}
              size="l"
              aria-label={item.label}
            />
          </SmartLink>
        ))}
        <SmartLink href="/journal/new">
          <IconButton icon="add" variant="primary" size="l" aria-label="Nueva entrada" />
        </SmartLink>
      </Row>
    </Row>
  )
}
