import { Avatar } from "@once-ui-system/core"
import type { BondType } from "@prisma/client"

export function BondAvatar({ name, type, avatar, size = "m" }: { name: string; type: BondType; avatar?: string | null; size?: "xs" | "s" | "m" | "l" | "xl" }) {
  const initials = name.trim().split(" ").length > 1
    ? (name[0] + name.split(" ")[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()

  return (
    <Avatar
      src={avatar ?? undefined}
      value={avatar ? undefined : initials}
      size={size}
      radius={type === "PERSON" ? undefined : "m"}
    />
  )
}
