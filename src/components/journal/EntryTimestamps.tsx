// src/components/journal/EntryTimestamps.tsx
"use client"

import { useEffect, useState } from "react"
import { Column, Text } from "@once-ui-system/core"

interface EntryTimestampsProps {
  createdAt: Date
  editCount: number
}

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

function formatStaticDate(date: Date): string {
  return date.toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })
}

/**
 * Calcula la etiqueta de "hace X" (valor exacto, sin redondear a buckets) y
 * cada cuánto debe recalcularse ese valor (cadencia escalonada, no polling
 * fijo) — más viejo el timestamp, más espaciados los recálculos, hasta dejar
 * de recalcular del todo pasadas 24h (se muestra la fecha literal).
 */
function computeRelative(createdAt: Date): { label: string; nextDelayMs: number | null } {
  const elapsed = Date.now() - createdAt.getTime()

  if (elapsed < MINUTE) {
    const seconds = Math.max(0, Math.floor(elapsed / SECOND))
    return { label: `hace ${seconds} segundos`, nextDelayMs: 5 * SECOND }
  }

  if (elapsed < 30 * MINUTE) {
    const minutes = Math.floor(elapsed / MINUTE)
    return { label: `hace ${minutes} min`, nextDelayMs: 5 * MINUTE }
  }

  if (elapsed < 3 * HOUR) {
    const hours = Math.floor(elapsed / HOUR)
    const minutes = Math.floor((elapsed % HOUR) / MINUTE)
    const label = minutes === 0 ? `hace ${hours} h` : `hace ${hours} h ${minutes} min`
    return { label, nextDelayMs: 30 * MINUTE }
  }

  if (elapsed < DAY) {
    const hours = Math.floor(elapsed / HOUR)
    return { label: `hace ${hours} h`, nextDelayMs: HOUR }
  }

  return { label: formatStaticDate(createdAt), nextDelayMs: null }
}

/**
 * Muestra "Creada: hace X" (tiempo relativo exacto, recalculado con cadencia
 * escalonada vía setTimeout recursivo) y, si hubo ediciones, "Editada: N vez/veces"
 * (contador estático, sin ningún efecto ni recálculo).
 */
export function EntryTimestamps({ createdAt, editCount }: EntryTimestampsProps) {
  const [label, setLabel] = useState(() => computeRelative(createdAt).label)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    function tick() {
      const { label: nextLabel, nextDelayMs } = computeRelative(createdAt)
      setLabel(nextLabel)
      if (nextDelayMs !== null) {
        timeoutId = setTimeout(tick, nextDelayMs)
      }
    }

    tick()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [createdAt])

  return (
    <Column gap="0">
      <Text variant="label-default-s" onBackground="neutral-weak" suppressHydrationWarning>
        Creada: {label}
      </Text>
      {editCount > 0 && (
        <Text variant="label-default-s" onBackground="neutral-weak">
          Editada: {editCount} {editCount === 1 ? "vez" : "veces"}
        </Text>
      )}
    </Column>
  )
}
