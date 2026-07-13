"use client"

import { Column, ToggleButton, Text } from "@once-ui-system/core"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

const OPTIONS: { value: string; label: string }[] = [
  { value: "ALL",     label: "Todo" },
  { value: "PRIVATE", label: "Solo yo" },
  { value: "FRIENDS", label: "Amigos" },
  { value: "PUBLIC",  label: "Público" },
]

export function PrivacyPanel() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = searchParams.get("vis") ?? "ALL"

  function setVis(v: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (v === "ALL") params.delete("vis")
    else params.set("vis", v)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Column gap="8" fillWidth>
      <Text variant="label-default-s" onBackground="neutral-weak">Privacidad</Text>
      {OPTIONS.map(opt => (
        <ToggleButton key={opt.value} fillWidth horizontal="start" selected={active === opt.value} onClick={() => setVis(opt.value)}>
          {opt.label}
        </ToggleButton>
      ))}
    </Column>
  )
}
