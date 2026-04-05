# Vínculos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar la sección completa de Vínculos — `/bonds` (3 vistas: timeline, grafo, lista) y `/bonds/[id]` (detalle con modo comparar).

**Architecture:** Server Components cargan datos y los pasan como props a Client Components que manejan la interactividad. Los filtros y la vista activa viven en `searchParams` (URL). Las tres vistas de `/bonds` comparten la misma toolbar y se intercambian sin navegación. El detalle `/bonds/[id]` incluye un modo comparar que añade vínculos al gráfico y vive también en `searchParams`.

**Tech Stack:** Next.js 16.2.2 (App Router), TypeScript strict, Tailwind CSS, Prisma/PostgreSQL (Neon), Auth.js v5. No hay framework de tests instalado — se usa `npx tsc --noEmit` para validación de tipos y verificación manual en el navegador.

---

## Archivos que se crean o modifican

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `prisma/schema.prisma` | Modificar | Añadir `subtype String?` a Bond |
| `src/lib/bond-subtypes.ts` | Crear | Vocabulario controlado de subtipos + utilidad `proximityToVisual` |
| `src/types/bonds.ts` | Crear | Tipos TypeScript para toda la sección |
| `src/lib/actions/bonds.actions.ts` | Crear | Acciones del servidor: fetch bonds, snapshots, entradas |
| `src/components/bonds/BondAvatar.tsx` | Crear | Avatar reutilizable (círculo/cuadrado según BondType) |
| `src/components/bonds/BondsToolbar.tsx` | Crear | Toolbar: toggles de vista + chips de tipo + popover de filtros |
| `src/components/bonds/BondsFilterPopover.tsx` | Crear | Dropdown de filtros secundarios (subtipo, madurez, período) |
| `src/components/bonds/BondsList.tsx` | Crear | Vista lista con mini-gráficas de tendencia |
| `src/components/bonds/BondsTimeline.tsx` | Crear | Vista timeline centrada en 0 |
| `src/components/bonds/BondsGraph.tsx` | Crear | Vista grafo con usuario al centro |
| `src/components/bonds/BondsPage.tsx` | Crear | Client Component raíz — gestiona vista activa |
| `src/app/bonds/page.tsx` | Crear | Server Component de `/bonds` |
| `src/components/bonds/BondDetailHeader.tsx` | Crear | Header del perfil: avatar, métricas, botones |
| `src/components/bonds/BondDetailSubtoolbar.tsx` | Crear | Toggle tipo gráfica + período + leyenda |
| `src/components/bonds/BondDetailChart.tsx` | Crear | Gráfica SVG principal (línea/barras/dispersión) |
| `src/components/bonds/BondCompareBar.tsx` | Crear | Barra de modo comparar con chips y buscador |
| `src/components/bonds/BondEntriesList.tsx` | Crear | Panel derecho de entradas relacionadas |
| `src/components/bonds/BondDetailPage.tsx` | Crear | Client Component raíz de `/bonds/[id]` |
| `src/app/bonds/[id]/page.tsx` | Crear | Server Component de `/bonds/[id]` |

---

## Task 1: Schema + vocabulario controlado

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/lib/bond-subtypes.ts`

- [ ] **Añadir `subtype` al modelo Bond en el schema**

Abrir `prisma/schema.prisma` y añadir el campo después de `isPrivate`:

```prisma
model Bond {
  id             String       @id @default(cuid())
  userId         String
  name           String
  type           BondType
  subtype        String?      // vocabulario controlado en src/lib/bond-subtypes.ts
  maturityLevel  Int          @default(0)
  description    String?
  avatar         String?
  isPrivate      Boolean      @default(true)
  linkedUserId   String?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  entryBonds     EntryBond[]
  snapshots      BondSnapshot[]
  tagApprovals   TagApproval[]
  groupBonds     GroupBond[]
}
```

- [ ] **Aplicar el cambio al schema**

```bash
cd /Volumes/Ricolinos/Codigo/Developer/wo-shi
npx prisma generate
npx prisma db push
```

Esperado: `Your database is now in sync with your Prisma schema.`

- [ ] **Crear `src/lib/bond-subtypes.ts`**

```ts
// src/lib/bond-subtypes.ts
// Vocabulario controlado de subtipos de Bond.
// Los valores válidos se definen aquí — no en la DB — para poder extenderlos sin migraciones.

import type { BondType } from "@prisma/client"

export const BOND_SUBTYPES: Record<BondType, string[]> = {
  PERSON:  ["familiar", "amistad", "pareja", "laboral", "mentor", "conocido"],
  BELIEF:  ["religión", "política", "filosofía", "moral", "espiritual"],
  IDEA:    ["concepto", "proyecto", "teoría", "meta", "hábito"],
  EMOTION: ["recurrente", "situacional", "crónica"],
  PLACE:   ["hogar", "ciudad", "lugar significativo"],
  GROUP:   ["familia", "amigos", "trabajo", "comunidad"],
  OTHER:   [],
}

// Transformar proximity (1-10) a escala visual centrada en 0 (-10 a +10)
// proximity 1 → -10, proximity 5.5 → 0, proximity 10 → +10
export function proximityToVisual(proximity: number): number {
  return ((proximity - 1) / 9) * 20 - 10
}

// Color de fondo por tipo de Bond (paleta wo-shi)
export const BOND_TYPE_COLOR: Record<BondType, string> = {
  PERSON:  "#D85A30",
  BELIEF:  "#D4537E",
  IDEA:    "#BA7517",
  EMOTION: "#1D9E75",
  PLACE:   "#378ADD",
  GROUP:   "#378ADD",
  OTHER:   "#9999aa",
}

// Color de fondo suave (chip) por tipo
export const BOND_TYPE_BG: Record<BondType, string> = {
  PERSON:  "#fff0eb",
  BELIEF:  "#fdf0f5",
  IDEA:    "#fdf6e8",
  EMOTION: "#edf8f4",
  PLACE:   "#edf4fd",
  GROUP:   "#edf4fd",
  OTHER:   "#f5f5f5",
}

// Label en español por tipo
export const BOND_TYPE_LABEL: Record<BondType, string> = {
  PERSON:  "Persona",
  BELIEF:  "Creencia",
  IDEA:    "Idea",
  EMOTION: "Emoción",
  PLACE:   "Lugar",
  GROUP:   "Grupo",
  OTHER:   "Otro",
}
```

- [ ] **Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Commit**

```bash
git add prisma/schema.prisma src/lib/bond-subtypes.ts
git commit -m "feat: añadir subtype a Bond y vocabulario controlado de subtipos"
```

---

## Task 2: Tipos TypeScript para la sección

**Files:**
- Create: `src/types/bonds.ts`

- [ ] **Crear `src/types/bonds.ts`**

```ts
// src/types/bonds.ts
// Tipos para la sección de Vínculos (/bonds y /bonds/[id]).

import type { BondType } from "@prisma/client"

// ── Vistas disponibles en /bonds ──────────────────────────────────────────────
export type BondsView = "list" | "timeline" | "graph"

// ── Filtros de /bonds (sincronizados con URL searchParams) ────────────────────
export type BondMaturityFilter = "ALL" | "tags" | "bonds"
export type BondPeriod         = "3m" | "6m" | "1y" | "all"

export interface BondsFilters {
  view:     BondsView
  type:     BondType | "ALL"
  subtype:  string | null
  maturity: BondMaturityFilter
  period:   BondPeriod
}

// ── Datos que llegan del Server Component a /bonds ────────────────────────────
export interface BondSummary {
  id:           string
  name:         string
  type:         BondType
  subtype:      string | null
  maturityLevel: number
  createdAt:    Date
  // último snapshot
  lastSnapshot: {
    intensity: number
    proximity: number
    date:      Date
  } | null
  // snapshots del período para mini-gráfica (lista)
  recentSnapshots: {
    intensity: number
    proximity: number
    date:      Date
  }[]
  // para el grafo: conteo de entradas en el período
  entryCount: number
  // para la lista: tiempo relativo
  lastActivityDate: Date | null
  // si es usuario de wo-shi
  linkedUserId: string | null
  avatar:       string | null
}

// ── Datos para /bonds/[id] ────────────────────────────────────────────────────
export interface BondDetail {
  id:           string
  name:         string
  type:         BondType
  subtype:      string | null
  maturityLevel: number
  description:  string | null
  avatar:       string | null
  linkedUserId: string | null
  createdAt:    Date
  // todos los snapshots (para la gráfica)
  snapshots: {
    id:        string
    intensity: number
    proximity: number
    date:      Date
  }[]
  // métricas resumidas
  avgIntensity:    number
  lastProximity:   number  // último snapshot proximity, sin transformar
  entryCount:      number
}

export interface BondEntry {
  id:        string
  title:     string | null
  date:      Date
  intensity: number  // del EntryBond
}

// ── Tipo de gráfica en /bonds/[id] ────────────────────────────────────────────
export type ChartType = "line" | "bars" | "scatter"
```

- [ ] **Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Commit**

```bash
git add src/types/bonds.ts
git commit -m "feat: tipos TypeScript para sección Vínculos"
```

---

## Task 3: Acciones del servidor

**Files:**
- Create: `src/lib/actions/bonds.actions.ts`

- [ ] **Crear `src/lib/actions/bonds.actions.ts`**

```ts
// src/lib/actions/bonds.actions.ts
"use server"

import { auth }   from "@/auth"
import { prisma } from "@/lib/prisma"
import type { BondType } from "@prisma/client"
import type { BondSummary, BondDetail, BondEntry, BondPeriod, BondMaturityFilter } from "@/types/bonds"

// Calcular fecha de inicio según período
function periodStart(period: BondPeriod): Date | undefined {
  if (period === "all") return undefined
  const d = new Date()
  if (period === "3m") d.setMonth(d.getMonth() - 3)
  if (period === "6m") d.setMonth(d.getMonth() - 6)
  if (period === "1y") d.setFullYear(d.getFullYear() - 1)
  return d
}

// ── Lista de bonds para /bonds ────────────────────────────────────────────────
export async function getBondsWithSnapshots(filters: {
  type?:     BondType | "ALL"
  subtype?:  string | null
  maturity?: BondMaturityFilter
  period?:   BondPeriod
}): Promise<BondSummary[]> {
  const session = await auth()
  if (!session?.user?.id) return []
  const userId = session.user.id

  const { type, subtype, maturity = "ALL", period = "3m" } = filters
  const since = periodStart(period)

  // Filtro de madurez
  const maturityWhere =
    maturity === "tags"  ? { maturityLevel: { lt: 5 } } :
    maturity === "bonds" ? { maturityLevel: { gte: 5 } } :
    {}

  const bonds = await prisma.bond.findMany({
    where: {
      userId,
      ...maturityWhere,
      ...(type && type !== "ALL" ? { type } : {}),
      ...(subtype ? { subtype } : {}),
    },
    include: {
      snapshots: {
        where: since ? { date: { gte: since } } : {},
        orderBy: { date: "asc" },
        select: { intensity: true, proximity: true, date: true },
      },
      entryBonds: {
        where: since ? { entry: { date: { gte: since } } } : {},
        select: { id: true, createdAt: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  return bonds.map(b => {
    const snaps = b.snapshots
    const last  = snaps.at(-1) ?? null
    return {
      id:           b.id,
      name:         b.name,
      type:         b.type,
      subtype:      b.subtype,
      maturityLevel: b.maturityLevel,
      createdAt:    b.createdAt,
      lastSnapshot: last
        ? { intensity: last.intensity, proximity: last.proximity, date: last.date }
        : null,
      recentSnapshots: snaps.slice(-8).map(s => ({
        intensity: s.intensity,
        proximity: s.proximity,
        date:      s.date,
      })),
      entryCount:       b.entryBonds.length,
      lastActivityDate: b.entryBonds.at(-1)?.createdAt ?? null,
      linkedUserId:     b.linkedUserId,
      avatar:           b.avatar,
    }
  })
}

// ── Detalle de un bond para /bonds/[id] ───────────────────────────────────────
export async function getBondDetail(bondId: string): Promise<BondDetail | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  const userId = session.user.id

  const bond = await prisma.bond.findFirst({
    where: { id: bondId, userId },
    include: {
      snapshots: {
        orderBy: { date: "asc" },
        select: { id: true, intensity: true, proximity: true, date: true },
      },
      entryBonds: { select: { id: true } },
    },
  })

  if (!bond) return null

  const snaps      = bond.snapshots
  const avgIntensity = snaps.length
    ? snaps.reduce((s, n) => s + n.intensity, 0) / snaps.length
    : 0
  const lastProximity = snaps.at(-1)?.proximity ?? 5

  return {
    id:           bond.id,
    name:         bond.name,
    type:         bond.type,
    subtype:      bond.subtype,
    maturityLevel: bond.maturityLevel,
    description:  bond.description,
    avatar:       bond.avatar,
    linkedUserId: bond.linkedUserId,
    createdAt:    bond.createdAt,
    snapshots:    snaps,
    avgIntensity:   Math.round(avgIntensity * 10) / 10,
    lastProximity,
    entryCount:   bond.entryBonds.length,
  }
}

// ── Entradas relacionadas con un bond ─────────────────────────────────────────
export async function getBondEntries(bondId: string): Promise<BondEntry[]> {
  const session = await auth()
  if (!session?.user?.id) return []
  const userId = session.user.id

  const entryBonds = await prisma.entryBond.findMany({
    where: { bondId, entry: { userId } },
    orderBy: { entry: { date: "desc" } },
    take: 50,
    select: {
      intensity: true,
      entry: {
        select: { id: true, title: true, date: true },
      },
    },
  })

  return entryBonds.map(eb => ({
    id:        eb.entry.id,
    title:     eb.entry.title,
    date:      eb.entry.date,
    intensity: eb.intensity,
  }))
}

// ── Bonds del usuario para el buscador de comparación ─────────────────────────
export async function searchUserBonds(q: string): Promise<{ id: string; name: string; type: BondType }[]> {
  const session = await auth()
  if (!session?.user?.id) return []
  const userId = session.user.id

  return prisma.bond.findMany({
    where: {
      userId,
      maturityLevel: { gte: 5 },
      name: { contains: q, mode: "insensitive" },
    },
    take: 8,
    select: { id: true, name: true, type: true },
    orderBy: { updatedAt: "desc" },
  })
}
```

- [ ] **Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Commit**

```bash
git add src/lib/actions/bonds.actions.ts
git commit -m "feat: acciones del servidor para sección Vínculos"
```

---

## Task 4: BondAvatar — componente compartido

**Files:**
- Create: `src/components/bonds/BondAvatar.tsx`

- [ ] **Crear `src/components/bonds/BondAvatar.tsx`**

```tsx
// src/components/bonds/BondAvatar.tsx
// Avatar reutilizable para vínculos.
// Personas → círculo. Conceptos/ideas/creencias/otros → cuadrado redondeado.
// Muestra foto de perfil si hay avatar, si no: color del tipo + iniciales.

import Image from "next/image"
import { BOND_TYPE_COLOR } from "@/lib/bond-subtypes"
import type { BondType } from "@prisma/client"

interface BondAvatarProps {
  name:     string
  type:     BondType
  avatar?:  string | null
  size?:    number   // px, default 36
  className?: string
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ")
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

const PERSON_TYPES: BondType[] = ["PERSON"]

export function BondAvatar({ name, type, avatar, size = 36, className = "" }: BondAvatarProps) {
  const isPerson    = PERSON_TYPES.includes(type)
  const color       = BOND_TYPE_COLOR[type]
  const initials    = getInitials(name)
  const borderRadius = isPerson ? "9999px" : "8px"
  const sizeStyle   = { width: size, height: size, minWidth: size, minHeight: size }

  if (avatar) {
    return (
      <div
        className={`overflow-hidden flex-shrink-0 ${className}`}
        style={{ ...sizeStyle, borderRadius }}
      >
        <Image
          src={avatar}
          alt={name}
          width={size}
          height={size}
          className="object-cover w-full h-full"
        />
      </div>
    )
  }

  return (
    <div
      className={`flex items-center justify-center flex-shrink-0 ${className}`}
      style={{
        ...sizeStyle,
        borderRadius,
        background: color,
        color: "#fff",
        fontSize: size * 0.33,
        fontWeight: 500,
      }}
    >
      {initials}
    </div>
  )
}
```

- [ ] **Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Commit**

```bash
git add src/components/bonds/BondAvatar.tsx
git commit -m "feat: componente BondAvatar compartido"
```

---

## Task 5: BondsToolbar

**Files:**
- Create: `src/components/bonds/BondsFilterPopover.tsx`
- Create: `src/components/bonds/BondsToolbar.tsx`

- [ ] **Crear `src/components/bonds/BondsFilterPopover.tsx`**

```tsx
// src/components/bonds/BondsFilterPopover.tsx
// Dropdown de filtros secundarios: subtipo, madurez y período.
// Se abre desde BondsToolbar al hacer clic en el botón "Filtros".
"use client"

import { useRef, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { BOND_SUBTYPES } from "@/lib/bond-subtypes"
import type { BondType } from "@prisma/client"
import type { BondMaturityFilter, BondPeriod } from "@/types/bonds"

interface BondsFilterPopoverProps {
  activeType:    BondType | "ALL"
  activeSubtype: string | null
  activeMaturity: BondMaturityFilter
  activePeriod:  BondPeriod
  onClose:       () => void
}

const MATURITY_OPTIONS: { value: BondMaturityFilter; label: string }[] = [
  { value: "ALL",   label: "Todos" },
  { value: "tags",  label: "Etiquetas" },
  { value: "bonds", label: "Vínculos maduros" },
]

const PERIOD_OPTIONS: { value: BondPeriod; label: string }[] = [
  { value: "3m",  label: "3 meses" },
  { value: "6m",  label: "6 meses" },
  { value: "1y",  label: "1 año" },
  { value: "all", label: "Todo" },
]

export function BondsFilterPopover({
  activeType,
  activeSubtype,
  activeMaturity,
  activePeriod,
  onClose,
}: BondsFilterPopoverProps) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const ref          = useRef<HTMLDivElement>(null)

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [onClose])

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null || value === "ALL" || value === "all") params.delete(key)
    else params.set(key, value)
    router.push(`${pathname}?${params.toString()}`)
  }

  // Subtipos disponibles según tipo activo
  const availableSubtypes = activeType === "ALL"
    ? Object.values(BOND_SUBTYPES).flat()
    : BOND_SUBTYPES[activeType] ?? []

  return (
    <div
      ref={ref}
      className="absolute right-0 top-[calc(100%+6px)] z-50 bg-white rounded-[12px] shadow-lg"
      style={{
        border: "0.5px solid #e2e2ef",
        minWidth: 360,
        padding: "14px 16px",
        display: "flex",
        gap: 20,
      }}
    >
      {/* Subtipo */}
      {availableSubtypes.length > 0 && (
        <div style={{ flex: 1 }}>
          <p className="text-[10px] font-medium text-[#9999aa] uppercase tracking-wide mb-2">Subtipo</p>
          <div className="flex flex-wrap gap-1.5">
            {availableSubtypes.map(sub => (
              <button
                key={sub}
                onClick={() => setParam("subtype", activeSubtype === sub ? null : sub)}
                className="px-2.5 py-1 rounded-full text-[11px] transition-colors"
                style={{
                  background: activeSubtype === sub ? "#eeedfe" : "#f5f5f5",
                  color:      activeSubtype === sub ? "#534AB7" : "#666",
                  border:     "0.5px solid transparent",
                }}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ width: "0.5px", background: "#e2e2ef", alignSelf: "stretch" }} />

      {/* Madurez */}
      <div>
        <p className="text-[10px] font-medium text-[#9999aa] uppercase tracking-wide mb-2">Madurez</p>
        <div className="flex flex-col gap-1.5">
          {MATURITY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setParam("maturity", opt.value)}
              className="px-2.5 py-1 rounded-full text-[11px] transition-colors text-left"
              style={{
                background: activeMaturity === opt.value ? "#eeedfe" : "#f5f5f5",
                color:      activeMaturity === opt.value ? "#534AB7" : "#666",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: "0.5px", background: "#e2e2ef", alignSelf: "stretch" }} />

      {/* Período */}
      <div>
        <p className="text-[10px] font-medium text-[#9999aa] uppercase tracking-wide mb-2">Período</p>
        <div className="flex flex-col gap-1.5">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setParam("period", opt.value)}
              className="px-2.5 py-1 rounded-full text-[11px] transition-colors text-left"
              style={{
                background: activePeriod === opt.value ? "#eeedfe" : "#f5f5f5",
                color:      activePeriod === opt.value ? "#534AB7" : "#666",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Crear `src/components/bonds/BondsToolbar.tsx`**

```tsx
// src/components/bonds/BondsToolbar.tsx
// Barra superior de /bonds: toggles de vista (timeline/grafo/lista) +
// chips de tipo de bond (scroll horizontal) + botón Filtros que abre popover.
"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { BondsFilterPopover } from "@/components/bonds/BondsFilterPopover"
import { BOND_TYPE_LABEL }    from "@/lib/bond-subtypes"
import type { BondType }      from "@prisma/client"
import type { BondsView, BondsFilters } from "@/types/bonds"

interface BondsToolbarProps {
  filters: BondsFilters
}

const TYPE_TABS: { value: BondType | "ALL"; label: string }[] = [
  { value: "ALL",     label: "Todos" },
  { value: "PERSON",  label: BOND_TYPE_LABEL.PERSON },
  { value: "EMOTION", label: BOND_TYPE_LABEL.EMOTION },
  { value: "IDEA",    label: BOND_TYPE_LABEL.IDEA },
  { value: "BELIEF",  label: BOND_TYPE_LABEL.BELIEF },
  { value: "PLACE",   label: BOND_TYPE_LABEL.PLACE },
  { value: "GROUP",   label: BOND_TYPE_LABEL.GROUP },
  { value: "OTHER",   label: BOND_TYPE_LABEL.OTHER },
]

const VIEW_ICONS: Record<BondsView, React.ReactNode> = {
  timeline: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <line x1="3" y1="7"  x2="21" y2="7"  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <line x1="3" y1="17" x2="21" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
    </svg>
  ),
  graph: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" fill="currentColor"/>
      <circle cx="12" cy="4"  r="2" fill="currentColor" opacity="0.6"/>
      <circle cx="20" cy="17" r="2" fill="currentColor" opacity="0.6"/>
      <circle cx="4"  cy="17" r="2" fill="currentColor" opacity="0.6"/>
      <line x1="12" y1="9"  x2="12" y2="6"  stroke="currentColor" strokeWidth="1.5"/>
      <line x1="14.5" y1="13.5" x2="18.5" y2="15.5" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="9.5"  y1="13.5" x2="5.5"  y2="15.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  list: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <line x1="4" y1="7"  x2="20" y2="7"  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="4" y1="17" x2="14" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
}

export function BondsToolbar({ filters }: BondsToolbarProps) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [popoverOpen, setPopoverOpen] = useState(false)

  const barRef      = useRef<HTMLDivElement>(null)
  const [canLeft,  setCanLeft]  = useState(false)
  const [canRight, setCanRight] = useState(false)

  const updateArrows = useCallback(() => {
    const el = barRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  useEffect(() => {
    const el = barRef.current
    if (!el) return
    updateArrows()
    el.addEventListener("scroll", updateArrows)
    window.addEventListener("resize", updateArrows)
    return () => {
      el.removeEventListener("scroll", updateArrows)
      window.removeEventListener("resize", updateArrows)
    }
  }, [updateArrows])

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === "ALL") params.delete(key)
    else params.set(key, value)
    router.push(`${pathname}?${params.toString()}`)
  }

  function scroll(dir: 1 | -1) {
    barRef.current?.scrollBy({ left: dir * 180, behavior: "smooth" })
  }

  // Hay filtros secundarios activos
  const hasSecondaryFilters =
    filters.subtype !== null ||
    filters.maturity !== "ALL" ||
    filters.period !== "3m"

  return (
    <div
      className="flex items-stretch flex-shrink-0 bg-white"
      style={{ height: 48, borderBottom: "0.5px solid #e2e2ef" }}
    >
      {/* Título */}
      <div className="flex items-center px-5 flex-shrink-0" style={{ borderRight: "0.5px solid #e2e2ef" }}>
        <span className="text-[13px] font-medium text-[#1a1a2e]">Vínculos</span>
      </div>

      {/* View toggles */}
      <div className="flex items-center px-3 flex-shrink-0" style={{ borderRight: "0.5px solid #e2e2ef" }}>
        <div className="flex gap-0.5 bg-[#f0f0f8] rounded-[8px] p-0.5">
          {(["timeline", "graph", "list"] as BondsView[]).map(v => (
            <button
              key={v}
              onClick={() => setParam("view", v === "list" ? null : v)}
              title={v === "timeline" ? "Línea de tiempo" : v === "graph" ? "Grafo" : "Lista"}
              className="w-8 h-7 rounded-[6px] flex items-center justify-center transition-colors"
              style={{
                background: filters.view === v ? "#534AB7" : "transparent",
                color:      filters.view === v ? "#fff"    : "#999",
              }}
            >
              {VIEW_ICONS[v]}
            </button>
          ))}
        </div>
      </div>

      {/* Chips de tipo — scroll horizontal */}
      <div className="group/bar relative flex-1 overflow-hidden flex items-stretch">
        {/* degradados */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 z-10 transition-opacity duration-200"
          style={{ background: "linear-gradient(to right, white 20%, transparent)", opacity: canLeft ? 1 : 0 }} />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 z-10 transition-opacity duration-200"
          style={{ background: "linear-gradient(to left, white 20%, transparent)", opacity: canRight ? 1 : 0 }} />

        {canLeft && (
          <button onClick={() => scroll(-1)}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-[22px] h-[22px] rounded-full bg-white flex items-center justify-center text-[13px] text-[#555] opacity-0 group-hover/bar:opacity-100 transition-opacity"
            style={{ border: "0.5px solid #e2e2ef", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>‹</button>
        )}
        {canRight && (
          <button onClick={() => scroll(1)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-[22px] h-[22px] rounded-full bg-white flex items-center justify-center text-[13px] text-[#555] opacity-0 group-hover/bar:opacity-100 transition-opacity"
            style={{ border: "0.5px solid #e2e2ef", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>›</button>
        )}

        <div ref={barRef}
          className="flex items-center gap-1 overflow-x-auto px-3 flex-1"
          style={{ scrollbarWidth: "none" }}>
          {TYPE_TABS.map(tab => {
            const active = tab.value === filters.type
            return (
              <button
                key={tab.value}
                onClick={() => setParam("type", tab.value)}
                className="px-3 py-1 rounded-full text-[11px] whitespace-nowrap flex-shrink-0 transition-colors"
                style={{
                  background: active ? "#534AB7" : "#f5f5f5",
                  color:      active ? "#fff"    : "#666",
                  fontWeight: active ? 500 : 400,
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Botón Filtros */}
      <div className="relative flex items-center px-3 flex-shrink-0" style={{ borderLeft: "0.5px solid #e2e2ef" }}>
        <button
          onClick={() => setPopoverOpen(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] transition-colors"
          style={{
            background: hasSecondaryFilters ? "#eeedfe" : "#f5f5f5",
            color:      hasSecondaryFilters ? "#534AB7" : "#666",
            border:     hasSecondaryFilters ? "0.5px solid #cac7f4" : "0.5px solid transparent",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M7 12h10M11 18h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          Filtros
          {hasSecondaryFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#534AB7]" />
          )}
        </button>

        {popoverOpen && (
          <BondsFilterPopover
            activeType={filters.type}
            activeSubtype={filters.subtype}
            activeMaturity={filters.maturity}
            activePeriod={filters.period}
            onClose={() => setPopoverOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Commit**

```bash
git add src/components/bonds/BondsFilterPopover.tsx src/components/bonds/BondsToolbar.tsx
git commit -m "feat: BondsToolbar con toggles de vista, filtros de tipo y popover"
```

---

## Task 6: Vista Lista (BondsList)

**Files:**
- Create: `src/components/bonds/BondsList.tsx`

- [ ] **Crear `src/components/bonds/BondsList.tsx`**

```tsx
// src/components/bonds/BondsList.tsx
// Vista lista de /bonds. Tabla con columnas ordenables.
// Mini-gráfica de tendencia de cercanía (escala -10/+10, centrada en 0).
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BondAvatar }        from "@/components/bonds/BondAvatar"
import { BOND_TYPE_COLOR, BOND_TYPE_LABEL, BOND_TYPE_BG, proximityToVisual } from "@/lib/bond-subtypes"
import type { BondSummary } from "@/types/bonds"

interface BondsListProps {
  bonds: BondSummary[]
}

type SortKey = "name" | "intensity" | "activity"

function timeAgo(date: Date | null): string {
  if (!date) return "—"
  const diff = Date.now() - new Date(date).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return "hoy"
  if (d === 1) return "ayer"
  if (d < 7)  return `hace ${d}d`
  if (d < 30) return `hace ${Math.floor(d / 7)}sem`
  return `hace ${Math.floor(d / 30)}m`
}

export function BondsList({ bonds }: BondsListProps) {
  const router  = useRouter()
  const [sort, setSort] = useState<SortKey>("activity")

  const sorted = [...bonds].sort((a, b) => {
    if (sort === "name")      return a.name.localeCompare(b.name)
    if (sort === "intensity") return (b.lastSnapshot?.intensity ?? 0) - (a.lastSnapshot?.intensity ?? 0)
    // activity: por fecha de última actividad
    const aDate = a.lastActivityDate ? new Date(a.lastActivityDate).getTime() : 0
    const bDate = b.lastActivityDate ? new Date(b.lastActivityDate).getTime() : 0
    return bDate - aDate
  })

  if (bonds.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[13px] text-[#9999aa]">No hay vínculos con estos filtros.</p>
      </div>
    )
  }

  function ColHeader({ label, sortKey }: { label: string; sortKey: SortKey }) {
    const active = sort === sortKey
    return (
      <button
        onClick={() => setSort(sortKey)}
        className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide transition-colors"
        style={{ color: active ? "#534AB7" : "#9999aa" }}
      >
        {label}
        {active && <span className="text-[10px]">↕</span>}
      </button>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div
        className="grid items-center px-4 py-2 sticky top-0 bg-white z-10"
        style={{
          gridTemplateColumns: "1.8fr 90px 1.4fr 90px 70px",
          gap: 12,
          borderBottom: "0.5px solid #e2e2ef",
        }}
      >
        <ColHeader label="Vínculo"    sortKey="name" />
        <span className="text-[10px] font-medium text-[#9999aa] uppercase tracking-wide">Tipo</span>
        <span className="text-[10px] font-medium text-[#9999aa] uppercase tracking-wide">Evolución</span>
        <ColHeader label="Intensidad" sortKey="intensity" />
        <ColHeader label="Actividad"  sortKey="activity" />
      </div>

      {/* Filas */}
      {sorted.map(bond => {
        const color     = BOND_TYPE_COLOR[bond.type]
        const intensity = bond.lastSnapshot?.intensity ?? 0
        const snaps     = bond.recentSnapshots

        return (
          <div
            key={bond.id}
            onClick={() => router.push(`/bonds/${bond.id}`)}
            className="grid items-center px-4 cursor-pointer transition-colors hover:bg-[#fafafa]"
            style={{
              gridTemplateColumns: "1.8fr 90px 1.4fr 90px 70px",
              gap: 12,
              padding: "10px 16px",
              borderBottom: "0.5px solid #f5f5f5",
            }}
          >
            {/* Vínculo */}
            <div className="flex items-center gap-2.5 min-w-0">
              <BondAvatar name={bond.name} type={bond.type} avatar={bond.avatar} size={36} />
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-[#1a1a2e] truncate">{bond.name}</p>
                <p className="text-[10px] text-[#9999aa]">{bond.subtype ?? BOND_TYPE_LABEL[bond.type]}</p>
              </div>
            </div>

            {/* Tipo chip */}
            <div>
              <span
                className="px-2 py-0.5 rounded-full text-[10px]"
                style={{ background: BOND_TYPE_BG[bond.type], color }}
              >
                {BOND_TYPE_LABEL[bond.type]}
              </span>
            </div>

            {/* Evolución mini-gráfica */}
            <div>
              {snaps.length > 0 ? (
                <svg width="100%" height="32" viewBox={`0 0 180 32`} preserveAspectRatio="none">
                  {/* zona neutral */}
                  <rect x="0" y="10" width="180" height="12" fill="#f7f7fc"/>
                  {/* línea 0 */}
                  <line x1="0" y1="16" x2="180" y2="16" stroke="#e0e0ec" strokeWidth="0.8"/>
                  <polyline
                    points={snaps.map((s, i) => {
                      const x = snaps.length === 1 ? 90 : (i / (snaps.length - 1)) * 170 + 5
                      // mapear proximity a y: 0 (visual) → y=16, +10 → y=4, -10 → y=28
                      const visual = proximityToVisual(s.proximity)
                      const y = 16 - (visual / 10) * 12
                      return `${x},${y}`
                    }).join(" ")}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {snaps.length > 0 && (() => {
                    const last = snaps[snaps.length - 1]
                    const visual = proximityToVisual(last.proximity)
                    const y = 16 - (visual / 10) * 12
                    return <circle cx="175" cy={y} r="3" fill={color}/>
                  })()}
                </svg>
              ) : (
                <span className="text-[10px] text-[#9999aa]">sin datos</span>
              )}
            </div>

            {/* Intensidad */}
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-1 bg-[#f0f0f0] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(intensity / 10) * 100}%`, background: color }}
                />
              </div>
              <span className="text-[10px] text-[#9999aa] w-6 text-right">
                {intensity > 0 ? intensity.toFixed(1) : "—"}
              </span>
            </div>

            {/* Actividad */}
            <div>
              <span className="text-[10px] text-[#9999aa]">
                {timeAgo(bond.lastActivityDate)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Commit**

```bash
git add src/components/bonds/BondsList.tsx
git commit -m "feat: vista lista de Vínculos con mini-gráficas de tendencia"
```

---

## Task 7: Vista Timeline (BondsTimeline)

**Files:**
- Create: `src/components/bonds/BondsTimeline.tsx`

- [ ] **Crear `src/components/bonds/BondsTimeline.tsx`**

```tsx
// src/components/bonds/BondsTimeline.tsx
// Vista timeline de /bonds. Eje Y centrado en 0 (-10 a +10).
// Cada vínculo = una línea coloreada por tipo. Hover = tooltip.
// Clic en línea = navegar a /bonds/[id].
"use client"

import { useState, useRef } from "react"
import { useRouter }         from "next/navigation"
import { BOND_TYPE_COLOR, proximityToVisual } from "@/lib/bond-subtypes"
import type { BondSummary } from "@/types/bonds"

interface BondsTimelineProps {
  bonds: BondSummary[]
}

interface Tooltip {
  x: number
  y: number
  name: string
  date: Date
  proximity: number
  intensity: number
}

// Altura del área de gráfica en unidades SVG
const CHART_H = 200
const CHART_TOP = 20    // espacio para label "+10"
const CHART_BOT = 20    // espacio para eje X
const LABEL_W   = 52    // ancho para labels del eje Y
const LABEL_RIGHT = 72  // ancho para etiquetas al final de cada línea

export function BondsTimeline({ bonds }: BondsTimelineProps) {
  const router  = useRouter()
  const svgRef  = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)

  // Filtrar bonds que tienen snapshots
  const active = bonds.filter(b => b.recentSnapshots.length > 0)

  if (active.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[13px] text-[#9999aa]">No hay datos de evolución en este período.</p>
      </div>
    )
  }

  // Recolectar todas las fechas para el eje X
  const allDates = active
    .flatMap(b => b.recentSnapshots.map(s => new Date(s.date).getTime()))
  const minTime = Math.min(...allDates)
  const maxTime = Math.max(...allDates)
  const timeRange = maxTime - minTime || 1

  function dateToX(date: Date, svgWidth: number): number {
    const t = new Date(date).getTime()
    const availW = svgWidth - LABEL_W - LABEL_RIGHT
    return LABEL_W + ((t - minTime) / timeRange) * availW
  }

  // Mapear visual (-10 a +10) a coordenada Y
  function visualToY(visual: number): number {
    // visual=+10 → y=CHART_TOP, visual=-10 → y=CHART_TOP+CHART_H
    return CHART_TOP + ((10 - visual) / 20) * CHART_H
  }

  const yZero  = visualToY(0)
  const yPlus5 = visualToY(5)
  const yMinus5 = visualToY(-5)

  return (
    <div className="flex-1 overflow-auto p-6">
      <svg
        ref={svgRef}
        width="100%"
        height={CHART_TOP + CHART_H + CHART_BOT + 20}
        style={{ overflow: "visible" }}
      >
        {/* Renderizado dinámico — el SVG necesita saber su ancho real */}
        {/* Usamos un foreignObject trick: renderizamos con viewBox y preserveAspectRatio */}
        <SVGContent
          active={active}
          dateToX={dateToX}
          visualToY={visualToY}
          yZero={yZero}
          yPlus5={yPlus5}
          yMinus5={yMinus5}
          tooltip={tooltip}
          setTooltip={setTooltip}
          onBondClick={id => router.push(`/bonds/${id}`)}
        />
      </svg>
    </div>
  )
}

// Componente interno para el contenido SVG
// Se separa para poder usar hooks dentro de un SVG sin problemas
function SVGContent({
  active,
  dateToX,
  visualToY,
  yZero,
  yPlus5,
  yMinus5,
  tooltip,
  setTooltip,
  onBondClick,
}: {
  active:       BondSummary[]
  dateToX:      (d: Date, w: number) => number
  visualToY:    (v: number) => number
  yZero:        number
  yPlus5:       number
  yMinus5:      number
  tooltip:      Tooltip | null
  setTooltip:   (t: Tooltip | null) => void
  onBondClick:  (id: string) => void
}) {
  // Usamos un ancho fijo para las coordenadas SVG
  const SVG_W = 900

  return (
    <>
      {/* Eje Y labels */}
      <text x={LABEL_W - 6} y={CHART_TOP + 4}   textAnchor="end" fontSize="9" fill="#bbb">+10</text>
      <text x={LABEL_W - 6} y={yPlus5 + 4}       textAnchor="end" fontSize="9" fill="#bbb">+5</text>
      <text x={LABEL_W - 6} y={yZero + 4}         textAnchor="end" fontSize="9" fill="#999" fontWeight="500">0</text>
      <text x={LABEL_W - 6} y={yMinus5 + 4}       textAnchor="end" fontSize="9" fill="#bbb">-5</text>
      <text x={LABEL_W - 6} y={CHART_TOP + CHART_H + 4} textAnchor="end" fontSize="9" fill="#bbb">-10</text>
      <text x={SVG_W - LABEL_RIGHT + 4} y={CHART_TOP + 4} fontSize="8" fill="#ccc" fontStyle="italic">muy cercano</text>
      <text x={SVG_W - LABEL_RIGHT + 4} y={CHART_TOP + CHART_H + 4} fontSize="8" fill="#ccc" fontStyle="italic">muy lejano</text>

      {/* Grid lines */}
      <line x1={LABEL_W} y1={CHART_TOP}            x2={SVG_W - LABEL_RIGHT} y2={CHART_TOP}            stroke="#f0f0f0" strokeWidth="0.5"/>
      <line x1={LABEL_W} y1={yPlus5}               x2={SVG_W - LABEL_RIGHT} y2={yPlus5}               stroke="#f0f0f0" strokeWidth="0.5"/>
      <line x1={LABEL_W} y1={CHART_TOP + CHART_H}  x2={SVG_W - LABEL_RIGHT} y2={CHART_TOP + CHART_H}  stroke="#f0f0f0" strokeWidth="0.5"/>
      <line x1={LABEL_W} y1={yMinus5}              x2={SVG_W - LABEL_RIGHT} y2={yMinus5}              stroke="#f0f0f0" strokeWidth="0.5"/>

      {/* Zona neutral sombreada */}
      <rect x={LABEL_W} y={yPlus5} width={SVG_W - LABEL_W - LABEL_RIGHT} height={yMinus5 - yPlus5}
        fill="#f7f7fc" opacity="0.7"/>

      {/* Línea 0 */}
      <line x1={LABEL_W} y1={yZero} x2={SVG_W - LABEL_RIGHT} y2={yZero} stroke="#e0e0ec" strokeWidth="1.2"/>

      {/* Líneas de cada bond */}
      {active.map(bond => {
        const color = BOND_TYPE_COLOR[bond.type]
        const snaps = bond.recentSnapshots
        if (snaps.length === 0) return null

        const points = snaps.map(s => {
          const x = dateToX(s.date, SVG_W)
          const y = visualToY(proximityToVisual(s.proximity))
          return { x, y, s }
        })

        const polyPoints = points.map(p => `${p.x},${p.y}`).join(" ")
        const last = points[points.length - 1]

        return (
          <g key={bond.id}>
            <polyline
              points={polyPoints}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ cursor: "pointer" }}
              onClick={() => onBondClick(bond.id)}
            />
            {/* Puntos interactivos */}
            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="4"
                fill={color}
                opacity="0"
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setTooltip({
                  x: p.x, y: p.y,
                  name: bond.name,
                  date: new Date(p.s.date),
                  proximity: p.s.proximity,
                  intensity: p.s.intensity,
                })}
                onMouseLeave={() => setTooltip(null)}
                onClick={() => onBondClick(bond.id)}
              />
            ))}
            {/* Punto final visible */}
            <circle cx={last.x} cy={last.y} r="4" fill={color} style={{ pointerEvents: "none" }}/>
            {/* Etiqueta */}
            <text x={last.x + 8} y={last.y + 4} fontSize="9" fill={color} fontWeight="500">
              {bond.name}
            </text>
          </g>
        )
      })}

      {/* Tooltip */}
      {tooltip && (
        <g>
          <rect
            x={tooltip.x + 8} y={tooltip.y - 26}
            width="130" height="34"
            rx="5" fill="#1a1a2e" opacity="0.9"
          />
          <text x={tooltip.x + 14} y={tooltip.y - 12} fontSize="8.5" fill="white">
            {tooltip.name} · {new Date(tooltip.date).toLocaleDateString("es", { day: "numeric", month: "short" })}
          </text>
          <text x={tooltip.x + 14} y={tooltip.y + 2} fontSize="8" fill="#aaa">
            cercanía: {proximityToVisual(tooltip.proximity).toFixed(1)} · intensidad: {tooltip.intensity.toFixed(1)}
          </text>
        </g>
      )}
    </>
  )
}
```

- [ ] **Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Commit**

```bash
git add src/components/bonds/BondsTimeline.tsx
git commit -m "feat: vista timeline de Vínculos"
```

---

## Task 8: Vista Grafo (BondsGraph)

**Files:**
- Create: `src/components/bonds/BondsGraph.tsx`

- [ ] **Crear `src/components/bonds/BondsGraph.tsx`**

```tsx
// src/components/bonds/BondsGraph.tsx
// Vista grafo de /bonds. Usuario al centro.
// Distancia = presencia (entryCount). Grosor = intensidad. Tamaño = antigüedad.
"use client"

import { useRouter } from "next/navigation"
import { BOND_TYPE_COLOR } from "@/lib/bond-subtypes"
import type { BondSummary } from "@/types/bonds"
import type { BondType }    from "@prisma/client"

interface BondsGraphProps {
  bonds: BondSummary[]
}

const SVG_W    = 600
const SVG_H    = 500
const CX       = SVG_W / 2
const CY       = SVG_H / 2
const R_MIN    = 70   // radio mínimo (presencia alta = muy cerca)
const R_MAX    = 220  // radio máximo (presencia baja = lejos)
const NODE_MIN = 10   // tamaño mínimo de nodo (bond reciente)
const NODE_MAX = 22   // tamaño máximo de nodo (bond antiguo)
const LINE_MIN = 1.2  // grosor mínimo de línea (intensidad baja)
const LINE_MAX = 5    // grosor máximo de línea (intensidad alta)

function getInitials(name: string): string {
  const parts = name.trim().split(" ")
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

const SQUARE_TYPES: BondType[] = ["IDEA", "BELIEF", "EMOTION", "PLACE", "GROUP", "OTHER"]

export function BondsGraph({ bonds }: BondsGraphProps) {
  const router = useRouter()

  if (bonds.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[13px] text-[#9999aa]">No hay vínculos que mostrar.</p>
      </div>
    )
  }

  const maxEntries = Math.max(...bonds.map(b => b.entryCount), 1)
  const maxAge     = Math.max(...bonds.map(b =>
    Date.now() - new Date(b.createdAt).getTime()
  ), 1)

  // Calcular posición, tamaño y grosor para cada bond
  const nodes = bonds.map((bond, i) => {
    const angle    = (i / bonds.length) * 2 * Math.PI - Math.PI / 2
    // presencia alta → distancia baja (cerca del centro)
    const presence = bond.entryCount / maxEntries  // 0-1
    const radius   = R_MAX - presence * (R_MAX - R_MIN)
    const x        = CX + Math.cos(angle) * radius
    const y        = CY + Math.sin(angle) * radius

    // tamaño = antigüedad
    const ageRatio = (Date.now() - new Date(bond.createdAt).getTime()) / maxAge
    const nodeR    = NODE_MIN + ageRatio * (NODE_MAX - NODE_MIN)

    // grosor = intensidad promedio
    const intensity = bond.lastSnapshot?.intensity ?? 5
    const lineW     = LINE_MIN + ((intensity - 1) / 9) * (LINE_MAX - LINE_MIN)

    return { bond, x, y, nodeR, lineW, angle }
  })

  return (
    <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ maxWidth: 600, maxHeight: 500 }}
      >
        {/* Círculos de referencia */}
        <circle cx={CX} cy={CY} r={R_MIN + (R_MAX - R_MIN) * 0.33}
          fill="none" stroke="#f0f0f0" strokeWidth="0.5" strokeDasharray="3 3"/>
        <circle cx={CX} cy={CY} r={R_MIN + (R_MAX - R_MIN) * 0.75}
          fill="none" stroke="#f0f0f0" strokeWidth="0.5" strokeDasharray="3 3"/>

        {/* Líneas de conexión */}
        {nodes.map(({ bond, x, y, lineW }) => (
          <line
            key={`line-${bond.id}`}
            x1={CX} y1={CY} x2={x} y2={y}
            stroke={BOND_TYPE_COLOR[bond.type]}
            strokeWidth={lineW}
            opacity="0.45"
            style={{ pointerEvents: "none" }}
          />
        ))}

        {/* Nodo usuario (centro) */}
        <circle cx={CX} cy={CY} r="22" fill="#534AB7"/>
        <circle cx={CX} cy={CY} r="22" fill="none" stroke="#7F77DD" strokeWidth="2"/>
        <text x={CX} y={CY + 4} textAnchor="middle" fontSize="11" fill="white" fontWeight="500">Yo</text>

        {/* Nodos de bonds */}
        {nodes.map(({ bond, x, y, nodeR }) => {
          const color    = BOND_TYPE_COLOR[bond.type]
          const initials = getInitials(bond.name)
          const isSquare = SQUARE_TYPES.includes(bond.type)
          const fontSize = nodeR * 0.5

          return (
            <g
              key={`node-${bond.id}`}
              style={{ cursor: "pointer" }}
              onClick={() => router.push(`/bonds/${bond.id}`)}
            >
              {isSquare ? (
                <rect
                  x={x - nodeR} y={y - nodeR}
                  width={nodeR * 2} height={nodeR * 2}
                  rx="7" fill={color}
                />
              ) : (
                <circle cx={x} cy={y} r={nodeR} fill={color}/>
              )}
              <text
                x={x} y={y + fontSize * 0.35}
                textAnchor="middle"
                fontSize={fontSize}
                fill="white"
                fontWeight="500"
                style={{ pointerEvents: "none" }}
              >
                {initials}
              </text>
              {/* Etiqueta bajo el nodo */}
              <text
                x={x}
                y={y + nodeR + 12}
                textAnchor="middle"
                fontSize="9"
                fill="#555566"
                style={{ pointerEvents: "none" }}
              >
                {bond.name.length > 10 ? bond.name.slice(0, 9) + "…" : bond.name}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
```

- [ ] **Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Commit**

```bash
git add src/components/bonds/BondsGraph.tsx
git commit -m "feat: vista grafo de Vínculos"
```

---

## Task 9: BondsPage + página /bonds

**Files:**
- Create: `src/components/bonds/BondsPage.tsx`
- Create: `src/app/bonds/page.tsx`

- [ ] **Crear `src/components/bonds/BondsPage.tsx`**

```tsx
// src/components/bonds/BondsPage.tsx
// Client Component raíz de /bonds. Recibe los bonds del Server Component,
// renderiza la toolbar y la vista activa según los filtros de la URL.
"use client"

import { BondsToolbar }  from "@/components/bonds/BondsToolbar"
import { BondsList }     from "@/components/bonds/BondsList"
import { BondsTimeline } from "@/components/bonds/BondsTimeline"
import { BondsGraph }    from "@/components/bonds/BondsGraph"
import type { BondSummary, BondsFilters } from "@/types/bonds"

interface BondsPageProps {
  bonds:   BondSummary[]
  filters: BondsFilters
}

export function BondsPage({ bonds, filters }: BondsPageProps) {
  return (
    <div className="flex flex-col h-full">
      <BondsToolbar filters={filters} />

      {filters.view === "list" && <BondsList bonds={bonds} />}
      {filters.view === "timeline" && <BondsTimeline bonds={bonds} />}
      {filters.view === "graph" && <BondsGraph bonds={bonds} />}
    </div>
  )
}
```

- [ ] **Crear `src/app/bonds/page.tsx`**

```tsx
// src/app/bonds/page.tsx
// Server Component de /bonds. Verifica auth, lee searchParams,
// llama a getBondsWithSnapshots y pasa los datos a BondsPage.

import { redirect }              from "next/navigation"
import { Suspense }              from "react"
import { auth }                  from "@/auth"
import { getBondsWithSnapshots } from "@/lib/actions/bonds.actions"
import { AppSidebar }            from "@/components/layout/AppSidebar"
import { BondsPage }             from "@/components/bonds/BondsPage"
import type { BondType }         from "@prisma/client"
import type { BondsView, BondsFilters, BondMaturityFilter, BondPeriod } from "@/types/bonds"

type SearchParams = Promise<{
  view?:     string
  type?:     string
  subtype?:  string
  maturity?: string
  period?:   string
}>

export default async function BondsRoute({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth()
  if (!session?.user) redirect("/auth")

  const sp = await searchParams

  const filters: BondsFilters = {
    view:     (sp.view as BondsView)               ?? "list",
    type:     (sp.type as BondType | "ALL")         ?? "ALL",
    subtype:  sp.subtype ?? null,
    maturity: (sp.maturity as BondMaturityFilter)   ?? "ALL",
    period:   (sp.period as BondPeriod)             ?? "3m",
  }

  const bonds = await getBondsWithSnapshots({
    type:     filters.type,
    subtype:  filters.subtype,
    maturity: filters.maturity,
    period:   filters.period,
  })

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0eff8]">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        <Suspense>
          <BondsPage bonds={bonds} filters={filters} />
        </Suspense>
      </div>
    </div>
  )
}
```

- [ ] **Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Verificar en el navegador**

```bash
npm run dev
```

Abrir `http://localhost:3000/bonds`. Verificar:
- La toolbar aparece con los toggles de vista y los chips de tipo
- Con bondsexistentes: la lista los muestra con avatares y mini-gráficas
- Cambiar `?view=timeline` y `?view=graph` en la URL muestra las vistas correctas
- Los chips de tipo filtran correctamente

- [ ] **Commit**

```bash
git add src/components/bonds/BondsPage.tsx src/app/bonds/page.tsx
git commit -m "feat: página /bonds con Server Component y tres vistas"
```

---

## Task 10: BondDetailHeader + BondDetailSubtoolbar

**Files:**
- Create: `src/components/bonds/BondDetailHeader.tsx`
- Create: `src/components/bonds/BondDetailSubtoolbar.tsx`

- [ ] **Crear `src/components/bonds/BondDetailHeader.tsx`**

```tsx
// src/components/bonds/BondDetailHeader.tsx
// Header del perfil de un vínculo: avatar, nombre, métricas rápidas,
// botón Comparar y botón + entrada.
"use client"

import Link              from "next/link"
import { useRouter }     from "next/navigation"
import { BondAvatar }    from "@/components/bonds/BondAvatar"
import { BOND_TYPE_COLOR, BOND_TYPE_LABEL, BOND_TYPE_BG, proximityToVisual } from "@/lib/bond-subtypes"
import type { BondDetail } from "@/types/bonds"

interface BondDetailHeaderProps {
  bond:         BondDetail
  compareActive: boolean
  onCompare:    () => void
  bondsHref:    string  // URL de retorno a /bonds con searchParams preservados
}

export function BondDetailHeader({ bond, compareActive, onCompare, bondsHref }: BondDetailHeaderProps) {
  const color          = BOND_TYPE_COLOR[bond.type]
  const lastVisual     = proximityToVisual(bond.lastProximity)
  const proximityLabel = lastVisual >= 0 ? `+${lastVisual.toFixed(1)}` : lastVisual.toFixed(1)

  const sinceDate = new Date(bond.createdAt).toLocaleDateString("es", {
    month: "short",
    year: "numeric",
  })

  return (
    <div
      className="flex items-center gap-3 px-5 flex-shrink-0 bg-white"
      style={{ height: 60, borderBottom: "0.5px solid #e2e2ef" }}
    >
      {/* Botón atrás */}
      <Link
        href={bondsHref}
        className="flex items-center gap-1 text-[11px] text-[#9999aa] hover:text-[#534AB7] transition-colors flex-shrink-0"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        Vínculos
      </Link>

      <div style={{ width: "0.5px", height: 20, background: "#e2e2ef", flexShrink: 0 }}/>

      {/* Avatar */}
      <BondAvatar name={bond.name} type={bond.type} avatar={bond.avatar} size={36} />

      {/* Nombre + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-[#1a1a2e] leading-tight truncate">{bond.name}</p>
        <p className="text-[10px] text-[#9999aa]">
          {BOND_TYPE_LABEL[bond.type]}
          {bond.subtype && ` · ${bond.subtype}`}
          {" · vínculo desde "}
          {sinceDate}
        </p>
      </div>

      {/* Chips métricas */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px]"
          style={{ background: BOND_TYPE_BG[bond.type], color }}
        >
          <span className="font-medium">{bond.avgIntensity.toFixed(1)}</span>
          <span className="opacity-70">intensidad</span>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-[#eeedfe] text-[#534AB7]">
          <span className="font-medium">{proximityLabel}</span>
          <span className="opacity-70">cercanía</span>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-[#f5f5f5] text-[#666]">
          <span className="font-medium">{bond.entryCount}</span>
          <span className="opacity-70">entradas</span>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onCompare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-medium transition-colors"
          style={{
            background: compareActive ? "#3C3489" : "#534AB7",
            color: "#fff",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <circle cx="8"  cy="12" r="5" stroke="white" strokeWidth="1.8"/>
            <circle cx="16" cy="12" r="5" stroke="white" strokeWidth="1.8" opacity="0.6"/>
          </svg>
          Comparar
        </button>
        <Link
          href={`/journal/new?bond=${bond.id}`}
          className="px-3 py-1.5 rounded-[8px] text-[11px] bg-[#f5f5f5] text-[#666] hover:bg-[#eeedfe] hover:text-[#534AB7] transition-colors"
        >
          + entrada
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Crear `src/components/bonds/BondDetailSubtoolbar.tsx`**

```tsx
// src/components/bonds/BondDetailSubtoolbar.tsx
// Sub-toolbar del detalle de un vínculo: toggle de tipo de gráfica,
// toggle de período y leyenda inline.
"use client"

import { BOND_TYPE_COLOR } from "@/lib/bond-subtypes"
import type { BondType } from "@prisma/client"
import type { ChartType, BondPeriod } from "@/types/bonds"

interface BondDetailSubtoolbarProps {
  bondName:    string
  bondType:    BondType
  chartType:   ChartType
  period:      BondPeriod
  onChartType: (t: ChartType) => void
  onPeriod:    (p: BondPeriod) => void
  compareNames: string[]  // nombres de bonds en modo comparar
}

const CHART_OPTS: { value: ChartType; label: string }[] = [
  { value: "line",    label: "Línea" },
  { value: "bars",    label: "Barras" },
  { value: "scatter", label: "Dispersión" },
]

const PERIOD_OPTS: { value: BondPeriod; label: string }[] = [
  { value: "3m",  label: "3m" },
  { value: "6m",  label: "6m" },
  { value: "1y",  label: "1a" },
  { value: "all", label: "Todo" },
]

export function BondDetailSubtoolbar({
  bondName,
  bondType,
  chartType,
  period,
  onChartType,
  onPeriod,
  compareNames,
}: BondDetailSubtoolbarProps) {
  const color = BOND_TYPE_COLOR[bondType]

  return (
    <div
      className="flex items-center gap-3 px-5 flex-shrink-0 bg-[#fafafa]"
      style={{ height: 40, borderBottom: "0.5px solid #f0f0f0" }}
    >
      {/* Tipo de gráfica */}
      <div className="flex gap-0.5 bg-[#eeecfc] rounded-[8px] p-0.5">
        {CHART_OPTS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChartType(opt.value)}
            className="px-3 py-1 rounded-[6px] text-[10px] transition-colors"
            style={{
              background: chartType === opt.value ? "#534AB7" : "transparent",
              color:      chartType === opt.value ? "#fff"    : "#888",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div style={{ width: "0.5px", height: 16, background: "#e2e2ef" }}/>

      {/* Período */}
      <div className="flex gap-0.5 bg-[#eeecfc] rounded-[8px] p-0.5">
        {PERIOD_OPTS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onPeriod(opt.value)}
            className="px-2.5 py-1 rounded-[6px] text-[10px] transition-colors"
            style={{
              background: period === opt.value ? "#534AB7" : "transparent",
              color:      period === opt.value ? "#fff"    : "#888",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1"/>

      {/* Leyenda */}
      <div className="flex items-center gap-3 text-[10px] text-[#888]">
        <span className="flex items-center gap-1.5">
          <svg width="16" height="4" viewBox="0 0 16 4">
            <line x1="0" y1="2" x2="16" y2="2" stroke="#534AB7" strokeWidth="1.2" strokeDasharray="3 2" opacity="0.5"/>
          </svg>
          Yo (ref.)
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="16" height="4" viewBox="0 0 16 4">
            <line x1="0" y1="2" x2="16" y2="2" stroke={color} strokeWidth="2"/>
          </svg>
          {bondName}
        </span>
        {compareNames.map((name, i) => (
          <span key={i} className="flex items-center gap-1.5 opacity-70">
            <svg width="16" height="4" viewBox="0 0 16 4">
              <line x1="0" y1="2" x2="16" y2="2" stroke="#888" strokeWidth="2"/>
            </svg>
            {name}
          </span>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Commit**

```bash
git add src/components/bonds/BondDetailHeader.tsx src/components/bonds/BondDetailSubtoolbar.tsx
git commit -m "feat: BondDetailHeader y BondDetailSubtoolbar"
```

---

## Task 11: BondDetailChart

**Files:**
- Create: `src/components/bonds/BondDetailChart.tsx`

- [ ] **Crear `src/components/bonds/BondDetailChart.tsx`**

```tsx
// src/components/bonds/BondDetailChart.tsx
// Gráfica principal del perfil de un vínculo.
// Modos: línea, barras y dispersión. Eje Y centrado en 0 (-10/+10).
// Soporta modo comparar: superpone múltiples líneas.
"use client"

import { useState } from "react"
import { BOND_TYPE_COLOR, proximityToVisual } from "@/lib/bond-subtypes"
import type { BondDetail } from "@/types/bonds"
import type { ChartType, BondPeriod } from "@/types/bonds"
import type { BondType } from "@prisma/client"

interface BondDetailChartProps {
  bond:          BondDetail
  chartType:     ChartType
  period:        BondPeriod
  // bonds comparados (puede ser vacío)
  compareBonds:  BondDetail[]
}

interface TooltipState {
  x: number; y: number
  name: string; date: Date
  proximity: number; intensity: number
}

const SVG_W   = 900
const SVG_H   = 220
const PAD_L   = 36
const PAD_R   = 80
const PAD_T   = 16
const PAD_B   = 24

function yFromVisual(visual: number): number {
  // visual +10 → y=PAD_T, visual -10 → y=SVG_H-PAD_B
  const chartH = SVG_H - PAD_T - PAD_B
  return PAD_T + ((10 - visual) / 20) * chartH
}

function filterByPeriod<T extends { date: Date }>(items: T[], period: BondPeriod): T[] {
  if (period === "all") return items
  const d = new Date()
  if (period === "3m") d.setMonth(d.getMonth() - 3)
  if (period === "6m") d.setMonth(d.getMonth() - 6)
  if (period === "1y") d.setFullYear(d.getFullYear() - 1)
  return items.filter(s => new Date(s.date) >= d)
}

export function BondDetailChart({ bond, chartType, period, compareBonds }: BondDetailChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const allBonds  = [bond, ...compareBonds]
  const yZero     = yFromVisual(0)
  const yPlus5    = yFromVisual(5)
  const yMinus5   = yFromVisual(-5)
  const chartW    = SVG_W - PAD_L - PAD_R

  // Calcular rango de fechas
  const allSnaps  = allBonds.flatMap(b => filterByPeriod(b.snapshots.map(s => ({ ...s, date: new Date(s.date) })), period))
  const dates     = allSnaps.map(s => s.date.getTime())
  const minTime   = dates.length ? Math.min(...dates) : Date.now() - 86400000 * 90
  const maxTime   = dates.length ? Math.max(...dates) : Date.now()
  const timeRange = maxTime - minTime || 1

  function dateToX(date: Date): number {
    return PAD_L + ((date.getTime() - minTime) / timeRange) * chartW
  }

  // Etiquetas del eje X
  const xLabels: { x: number; label: string }[] = []
  for (let i = 0; i <= 4; i++) {
    const t = minTime + (timeRange * i) / 4
    xLabels.push({
      x: PAD_L + (chartW * i) / 4,
      label: new Date(t).toLocaleDateString("es", { month: "short", day: "numeric" }),
    })
  }

  function renderLine(b: BondDetail, isBase: boolean) {
    const color = BOND_TYPE_COLOR[b.type as BondType]
    const snaps = filterByPeriod(b.snapshots.map(s => ({ ...s, date: new Date(s.date) })), period)
    if (snaps.length === 0) return null

    const points = snaps.map(s => ({
      x: dateToX(s.date),
      y: yFromVisual(proximityToVisual(s.proximity)),
      s,
    }))

    return (
      <g key={b.id}>
        <polyline
          points={points.map(p => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke={color}
          strokeWidth={isBase ? 2 : 1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={isBase ? 1 : 0.75}
        />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={5} fill={color} opacity={0}
            style={{ cursor: "crosshair" }}
            onMouseEnter={() => setTooltip({ x: p.x, y: p.y, name: b.name, date: p.s.date, proximity: p.s.proximity, intensity: p.s.intensity })}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
        <circle cx={points.at(-1)!.x} cy={points.at(-1)!.y} r="4" fill={color} style={{ pointerEvents: "none" }}/>
      </g>
    )
  }

  function renderBars(b: BondDetail, isBase: boolean) {
    const color = BOND_TYPE_COLOR[b.type as BondType]
    const snaps = filterByPeriod(b.snapshots.map(s => ({ ...s, date: new Date(s.date) })), period)
    if (snaps.length === 0) return null
    const barW = Math.min(12, chartW / (snaps.length + 1))
    const offset = isBase ? -barW / 2 - 1 : barW / 2 + 1

    return (
      <g key={b.id}>
        {snaps.map((s, i) => {
          const x     = dateToX(s.date) + offset
          const visual = proximityToVisual(s.proximity)
          const y     = visual >= 0 ? yFromVisual(visual) : yZero
          const h     = Math.abs(yFromVisual(visual) - yZero)
          return (
            <rect key={i} x={x - barW / 2} y={y} width={barW} height={Math.max(h, 2)}
              fill={color} opacity={isBase ? 0.8 : 0.5} rx="2"/>
          )
        })}
      </g>
    )
  }

  function renderScatter(b: BondDetail, isBase: boolean) {
    const color = BOND_TYPE_COLOR[b.type as BondType]
    const snaps = filterByPeriod(b.snapshots.map(s => ({ ...s, date: new Date(s.date) })), period)
    if (snaps.length === 0) return null

    return (
      <g key={b.id}>
        {snaps.map((s, i) => {
          const x = dateToX(s.date)
          const y = yFromVisual(proximityToVisual(s.proximity))
          const r = 3 + (s.intensity / 10) * 5
          return (
            <circle key={i} cx={x} cy={y} r={r} fill={color} opacity={isBase ? 0.75 : 0.5}
              style={{ cursor: "crosshair" }}
              onMouseEnter={() => setTooltip({ x, y, name: b.name, date: s.date, proximity: s.proximity, intensity: s.intensity })}
              onMouseLeave={() => setTooltip(null)}
            />
          )
        })}
      </g>
    )
  }

  return (
    <div className="flex-1 overflow-hidden p-5">
      <svg width="100%" height="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ overflow: "visible" }}>
        {/* Eje Y */}
        <text x={PAD_L - 6} y={PAD_T + 4}             textAnchor="end" fontSize="9" fill="#bbb">+10</text>
        <text x={PAD_L - 6} y={yPlus5 + 4}             textAnchor="end" fontSize="9" fill="#bbb">+5</text>
        <text x={PAD_L - 6} y={yZero + 4}              textAnchor="end" fontSize="9" fill="#999" fontWeight="500">0</text>
        <text x={PAD_L - 6} y={yMinus5 + 4}            textAnchor="end" fontSize="9" fill="#bbb">-5</text>
        <text x={PAD_L - 6} y={SVG_H - PAD_B + 4}      textAnchor="end" fontSize="9" fill="#bbb">-10</text>

        {/* Grid */}
        <line x1={PAD_L} y1={PAD_T}            x2={SVG_W - PAD_R} y2={PAD_T}            stroke="#f0f0f0" strokeWidth="0.5"/>
        <line x1={PAD_L} y1={yPlus5}            x2={SVG_W - PAD_R} y2={yPlus5}           stroke="#f0f0f0" strokeWidth="0.5"/>
        <line x1={PAD_L} y1={SVG_H - PAD_B}     x2={SVG_W - PAD_R} y2={SVG_H - PAD_B}   stroke="#f0f0f0" strokeWidth="0.5"/>
        <line x1={PAD_L} y1={yMinus5}           x2={SVG_W - PAD_R} y2={yMinus5}          stroke="#f0f0f0" strokeWidth="0.5"/>
        <rect x={PAD_L} y={yPlus5} width={chartW} height={yMinus5 - yPlus5} fill="#f7f7fc" opacity="0.7"/>
        <line x1={PAD_L} y1={yZero} x2={SVG_W - PAD_R} y2={yZero} stroke="#e0e0ec" strokeWidth="1.2"/>

        {/* Línea ref. usuario */}
        <line x1={PAD_L} y1={yZero} x2={SVG_W - PAD_R} y2={yZero}
          stroke="#534AB7" strokeWidth="1" strokeDasharray="5 3" opacity="0.4"/>

        {/* Eje X fechas */}
        {xLabels.map((l, i) => (
          <text key={i} x={l.x} y={SVG_H - 4} textAnchor="middle" fontSize="8" fill="#bbb">{l.label}</text>
        ))}

        {/* Series */}
        {allBonds.map((b, i) =>
          chartType === "line"    ? renderLine(b, i === 0) :
          chartType === "bars"    ? renderBars(b, i === 0) :
          renderScatter(b, i === 0)
        )}

        {/* Tooltip */}
        {tooltip && (
          <g>
            <rect x={tooltip.x + 8} y={tooltip.y - 28} width={145} height={36} rx="5" fill="#1a1a2e" opacity="0.9"/>
            <text x={tooltip.x + 15} y={tooltip.y - 13} fontSize="8.5" fill="white">
              {tooltip.name} · {new Date(tooltip.date).toLocaleDateString("es", { day: "numeric", month: "short" })}
            </text>
            <text x={tooltip.x + 15} y={tooltip.y + 2} fontSize="8" fill="#aaa">
              cercanía: {proximityToVisual(tooltip.proximity).toFixed(1)} · int: {tooltip.intensity.toFixed(1)}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
```

- [ ] **Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Commit**

```bash
git add src/components/bonds/BondDetailChart.tsx
git commit -m "feat: BondDetailChart con modos línea, barras y dispersión"
```

---

## Task 12: BondCompareBar + BondEntriesList

**Files:**
- Create: `src/components/bonds/BondCompareBar.tsx`
- Create: `src/components/bonds/BondEntriesList.tsx`

- [ ] **Crear `src/components/bonds/BondCompareBar.tsx`**

```tsx
// src/components/bonds/BondCompareBar.tsx
// Barra de modo comparar. Visible solo cuando compareActive = true.
// Muestra chips de los bonds comparados y un buscador para añadir más.
"use client"

import { useState, useRef, useEffect } from "react"
import { searchUserBonds }             from "@/lib/actions/bonds.actions"
import { BondAvatar }                  from "@/components/bonds/BondAvatar"
import { BOND_TYPE_COLOR }             from "@/lib/bond-subtypes"
import type { BondType }               from "@prisma/client"

interface CompareChip {
  id:   string
  name: string
  type: BondType
}

interface BondCompareBarProps {
  baseBond:       CompareChip
  compareChips:   CompareChip[]
  onAdd:          (chip: CompareChip) => void
  onRemove:       (id: string) => void
  onExit:         () => void
}

export function BondCompareBar({
  baseBond,
  compareChips,
  onAdd,
  onRemove,
  onExit,
}: BondCompareBarProps) {
  const [query,      setQuery]      = useState("")
  const [results,    setResults]    = useState<CompareChip[]>([])
  const [loading,    setLoading]    = useState(false)
  const [dropOpen,   setDropOpen]   = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (query.trim().length < 1) { setResults([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      const data = await searchUserBonds(query)
      // Filtrar el bond base y los ya añadidos
      const added = new Set([baseBond.id, ...compareChips.map(c => c.id)])
      setResults(data.filter(d => !added.has(d.id)))
      setLoading(false)
    }, 250)
    return () => clearTimeout(t)
  }, [query, baseBond.id, compareChips])

  function Chip({ chip, removable }: { chip: CompareChip; removable: boolean }) {
    const color = BOND_TYPE_COLOR[chip.type]
    return (
      <div
        className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full text-[11px]"
        style={{ background: color, color: "#fff" }}
      >
        <BondAvatar name={chip.name} type={chip.type} size={16} />
        <span className="font-medium">{chip.name}</span>
        {removable && (
          <button
            onClick={() => onRemove(chip.id)}
            className="ml-0.5 text-[13px] leading-none opacity-70 hover:opacity-100"
          >×</button>
        )}
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-2 px-5 flex-shrink-0 flex-wrap"
      style={{
        minHeight: 44,
        background: "#eeedfe",
        border: "0.5px solid #cac7f4",
        borderRadius: 0,
        paddingTop: 8,
        paddingBottom: 8,
      }}
    >
      <span className="text-[10px] font-medium text-[#534AB7] flex-shrink-0">Comparando:</span>

      {/* Bond base (no removable) */}
      <Chip chip={baseBond} removable={false} />

      {/* Chips añadidos */}
      {compareChips.map(c => <Chip key={c.id} chip={c} removable={true} />)}

      {/* Buscador */}
      <div className="relative">
        <button
          onClick={() => inputRef.current?.focus()}
          className="flex items-center gap-1 px-3 py-1 rounded-full text-[11px] text-[#534AB7] bg-white transition-colors hover:bg-[#f5f5ff]"
          style={{ border: "0.5px solid #cac7f4" }}
        >
          <span className="text-[14px] leading-none">+</span> añadir vínculo
        </button>

        {/* Input oculto para activar búsqueda */}
        {dropOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 z-50 bg-white rounded-[10px] shadow-lg"
          style={{ minWidth: 220, border: "0.5px solid #e2e2ef" }}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setDropOpen(true)}
            onBlur={() => setTimeout(() => setDropOpen(false), 150)}
            placeholder="Buscar vínculo..."
            className="w-full px-3 py-2 text-[12px] outline-none bg-transparent"
            style={{ borderBottom: "0.5px solid #f0f0f0" }}
          />
          {loading && <p className="px-3 py-2 text-[11px] text-[#9999aa]">Buscando…</p>}
          {!loading && results.map(r => (
            <button
              key={r.id}
              onClick={() => { onAdd(r); setQuery(""); setResults([]); setDropOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-left hover:bg-[#f7f7fc] transition-colors"
            >
              <BondAvatar name={r.name} type={r.type} size={22} />
              <span>{r.name}</span>
            </button>
          ))}
        </div>
        )}
      </div>

      <div className="flex-1"/>

      <button
        onClick={onExit}
        className="text-[10px] text-[#9999aa] hover:text-[#534AB7] transition-colors flex-shrink-0"
      >
        Salir de comparación ×
      </button>
    </div>
  )
}
```

- [ ] **Crear `src/components/bonds/BondEntriesList.tsx`**

```tsx
// src/components/bonds/BondEntriesList.tsx
// Panel derecho del detalle de un vínculo.
// Lista scrolleable de entradas relacionadas ordenadas por fecha descendente.
"use client"

import Link from "next/link"
import type { BondEntry } from "@/types/bonds"
import { BOND_TYPE_COLOR } from "@/lib/bond-subtypes"
import type { BondType } from "@prisma/client"

interface BondEntriesListProps {
  entries:  BondEntry[]
  bondType: BondType
}

export function BondEntriesList({ entries, bondType }: BondEntriesListProps) {
  const color = BOND_TYPE_COLOR[bondType]

  return (
    <div
      className="flex flex-col flex-shrink-0"
      style={{ width: 210, borderLeft: "0.5px solid #e2e2ef" }}
    >
      <div
        className="px-4 py-2.5 flex-shrink-0 text-[10px] font-medium text-[#9999aa] uppercase tracking-wide"
        style={{ borderBottom: "0.5px solid #f0f0f0" }}
      >
        Entradas
      </div>

      <div className="flex-1 overflow-y-auto">
        {entries.length === 0 && (
          <p className="px-4 py-6 text-[11px] text-[#9999aa] text-center">Sin entradas registradas.</p>
        )}
        {entries.map(entry => (
          <Link
            key={entry.id}
            href={`/journal/${entry.id}`}
            className="block px-4 py-2.5 transition-colors hover:bg-[#fafafa]"
            style={{ borderBottom: "0.5px solid #f5f5f5" }}
          >
            <p className="text-[12px] font-medium text-[#1a1a2e] truncate">
              {entry.title ?? "Sin título"}
            </p>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-[10px] text-[#9999aa]">
                {new Date(entry.date).toLocaleDateString("es", { day: "numeric", month: "short" })}
              </p>
              <div className="flex items-center gap-1">
                <div className="w-12 h-1 bg-[#f0f0f0] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(entry.intensity / 10) * 100}%`, background: color }}
                  />
                </div>
                <span className="text-[10px] text-[#9999aa]">{entry.intensity.toFixed(1)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Commit**

```bash
git add src/components/bonds/BondCompareBar.tsx src/components/bonds/BondEntriesList.tsx
git commit -m "feat: BondCompareBar y BondEntriesList"
```

---

## Task 13: BondDetailPage + página /bonds/[id]

**Files:**
- Create: `src/components/bonds/BondDetailPage.tsx`
- Create: `src/app/bonds/[id]/page.tsx`

- [ ] **Crear `src/components/bonds/BondDetailPage.tsx`**

```tsx
// src/components/bonds/BondDetailPage.tsx
// Client Component raíz de /bonds/[id].
// Gestiona: tipo de gráfica, período, modo comparar y bonds comparados.
"use client"

import { useState, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { getBondDetail }          from "@/lib/actions/bonds.actions"
import { BondDetailHeader }       from "@/components/bonds/BondDetailHeader"
import { BondDetailSubtoolbar }   from "@/components/bonds/BondDetailSubtoolbar"
import { BondDetailChart }        from "@/components/bonds/BondDetailChart"
import { BondCompareBar }         from "@/components/bonds/BondCompareBar"
import { BondEntriesList }        from "@/components/bonds/BondEntriesList"
import type { BondDetail, BondEntry, ChartType, BondPeriod } from "@/types/bonds"
import type { BondType } from "@prisma/client"

interface CompareChip { id: string; name: string; type: BondType }

interface BondDetailPageProps {
  bond:         BondDetail
  entries:      BondEntry[]
  bondsHref:    string
}

export function BondDetailPage({ bond, entries, bondsHref }: BondDetailPageProps) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  const [chartType,     setChartType]     = useState<ChartType>("line")
  const [period,        setPeriod]        = useState<BondPeriod>("6m")
  const [compareActive, setCompareActive] = useState(false)
  const [compareChips,  setCompareChips]  = useState<CompareChip[]>([])
  const [compareBonds,  setCompareBonds]  = useState<BondDetail[]>([])

  const baseBond: CompareChip = { id: bond.id, name: bond.name, type: bond.type }

  const handleAddCompare = useCallback(async (chip: CompareChip) => {
    const detail = await getBondDetail(chip.id)
    if (!detail) return
    setCompareChips(prev => [...prev, chip])
    setCompareBonds(prev => [...prev, detail])
  }, [])

  const handleRemoveCompare = useCallback((id: string) => {
    setCompareChips(prev => prev.filter(c => c.id !== id))
    setCompareBonds(prev => prev.filter(b => b.id !== id))
  }, [])

  const handleExitCompare = useCallback(() => {
    setCompareActive(false)
    setCompareChips([])
    setCompareBonds([])
  }, [])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <BondDetailHeader
        bond={bond}
        compareActive={compareActive}
        onCompare={() => setCompareActive(v => !v)}
        bondsHref={bondsHref}
      />

      {compareActive && (
        <BondCompareBar
          baseBond={baseBond}
          compareChips={compareChips}
          onAdd={handleAddCompare}
          onRemove={handleRemoveCompare}
          onExit={handleExitCompare}
        />
      )}

      <BondDetailSubtoolbar
        bondName={bond.name}
        bondType={bond.type}
        chartType={chartType}
        period={period}
        onChartType={setChartType}
        onPeriod={setPeriod}
        compareNames={compareChips.map(c => c.name)}
      />

      <div className="flex flex-1 overflow-hidden">
        <BondDetailChart
          bond={bond}
          chartType={chartType}
          period={period}
          compareBonds={compareBonds}
        />
        <BondEntriesList
          entries={entries}
          bondType={bond.type}
        />
      </div>
    </div>
  )
}
```

- [ ] **Crear `src/app/bonds/[id]/page.tsx`**

```tsx
// src/app/bonds/[id]/page.tsx
// Server Component de /bonds/[id]. Verifica auth, carga el bond y sus entradas.

import { notFound, redirect } from "next/navigation"
import { Suspense }            from "react"
import { auth }                from "@/auth"
import { getBondDetail, getBondEntries } from "@/lib/actions/bonds.actions"
import { AppSidebar }          from "@/components/layout/AppSidebar"
import { BondDetailPage }      from "@/components/bonds/BondDetailPage"

interface Props {
  params:      Promise<{ id: string }>
  searchParams: Promise<Record<string, string>>
}

export default async function BondDetailRoute({ params, searchParams }: Props) {
  const session = await auth()
  if (!session?.user) redirect("/auth")

  const { id } = await params
  const sp      = await searchParams

  const [bond, entries] = await Promise.all([
    getBondDetail(id),
    getBondEntries(id),
  ])

  if (!bond) notFound()

  // URL de retorno a /bonds preservando searchParams previos (si vienen en el referer)
  const bondsHref = `/bonds${sp.from ? `?${sp.from}` : ""}`

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0eff8]">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        <Suspense>
          <BondDetailPage
            bond={bond}
            entries={entries}
            bondsHref={bondsHref}
          />
        </Suspense>
      </div>
    </div>
  )
}
```

- [ ] **Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Verificar en el navegador**

```bash
npm run dev
```

Verificar en `http://localhost:3000/bonds/[id]`:
- El header muestra avatar, nombre, tipo, subtipo y métricas
- La gráfica muestra los snapshots del bond con el eje centrado en 0
- El panel derecho lista las entradas relacionadas
- El botón "Comparar" activa la `BondCompareBar`
- Buscar y añadir un bond en comparación superpone su línea en la gráfica
- Los toggles de tipo de gráfica y período actualizan la visualización

- [ ] **Commit**

```bash
git add src/components/bonds/BondDetailPage.tsx src/app/bonds/[id]/page.tsx
git commit -m "feat: página /bonds/[id] con detalle, gráfica y modo comparar"
```

---

## Task 14: Integración final y verificación

- [ ] **Verificar que la navegación entre /bonds y /bonds/[id] es coherente**

Desde la lista/timeline/grafo → hacer clic en un bond → llegar a `/bonds/[id]` → botón "← Vínculos" regresa a `/bonds`.

- [ ] **Verificar los filtros de /bonds**

Aplicar filtro por tipo → la lista/timeline/grafo se actualiza. Abrir popover de Filtros → aplicar subtipo y período → los resultados cambian. La URL refleja todos los filtros activos.

- [ ] **Verificar el modo comparar en /bonds/[id]**

Activar comparar → añadir 2 bonds → la gráfica muestra 3 líneas → quitar uno → queda 2 → salir de comparación → queda 1.

- [ ] **Verificar TypeScript final**

```bash
cd /Volumes/Ricolinos/Codigo/Developer/wo-shi
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Verificar build de producción**

```bash
npm run build
```

Esperado: build exitoso sin errores.

- [ ] **Commit final**

```bash
git add .
git commit -m "feat: sección Vínculos completa — /bonds y /bonds/[id]"
```
