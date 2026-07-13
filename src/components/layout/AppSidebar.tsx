"use client"

import { usePathname } from "next/navigation"
import { useUser, useClerk } from "@clerk/nextjs"
import {
  Column, IconButton, SmartLink, UserMenu, Option, Line,
} from "@once-ui-system/core"
import type { IconName } from "@once-ui-system/core"

export const NAV_ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/feed",    label: "Feed",     icon: "feed" as IconName },
  { href: "/journal", label: "Diario",   icon: "journal" as IconName },
  { href: "/bonds",   label: "Vínculos", icon: "bonds" as IconName },
  { href: "/groups",  label: "Grupos",   icon: "groups" as IconName },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const { signOut } = useClerk()

  const initials = (user?.username ?? user?.firstName ?? "?").slice(0, 2).toUpperCase()

  return (
    <Column
      as="aside"
      fillHeight
      vertical="between"
      paddingY="16"
      paddingX="8"
      gap="8"
      s={{ hide: true }}
      style={{ width: 64, flexShrink: 0 }}
    >
      <Column gap="4" fillWidth vertical="center" flex={1}>
        {NAV_ITEMS.map(item => (
          <SmartLink key={item.href} href={item.href}>
            <IconButton
              icon={item.icon}
              variant={pathname.startsWith(item.href) ? "primary" : "tertiary"}
              size="xl"
              tooltip={item.label}
              tooltipPosition="right"
              aria-label={item.label}
            />
          </SmartLink>
        ))}
      </Column>

      <Column gap="8" horizontal="center">
        <SmartLink href="/journal/new">
          <IconButton icon="add" variant="primary" size="xl" tooltip="Nueva entrada" tooltipPosition="right" aria-label="Nueva entrada" />
        </SmartLink>

        <UserMenu
          avatarProps={user?.imageUrl ? { src: user.imageUrl, size: "m" } : { value: initials, size: "m" }}
          placement="right-end"
          dropdown={
            <Column minWidth={12} padding="4" gap="2">
              <Option href="/settings" label="Ajustes" value="settings" />
              <Line background="neutral-alpha-weak" />
              <Option label="Salir" value="signout" onClick={() => signOut({ redirectUrl: "/sign-in" })} />
            </Column>
          }
        />
      </Column>
    </Column>
  )
}
