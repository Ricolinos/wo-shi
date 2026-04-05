# Diseño: Sección Vínculos — /bonds y /bonds/[id]

**Fecha:** 2026-04-04  
**Maintainer:** Ricolinos  
**Estado:** aprobado por el usuario

---

## Resumen

La sección de Vínculos es el corazón visual de wo-shi. Permite al usuario explorar, analizar y comparar la evolución de sus vínculos a lo largo del tiempo. Se compone de dos páginas: `/bonds` (vista general con 3 modos de visualización) y `/bonds/[id]` (perfil detallado de un vínculo con modo comparar).

---

## Cambio al schema de Prisma

### Añadir `subtype` al modelo `Bond`

```prisma
model Bond {
  // ... campos existentes ...
  subtype  String?  // vocabulario controlado en código, no enum de DB
}
```

**Vocabulario controlado** — definido en `src/lib/bond-subtypes.ts` como constante TypeScript y validado con Zod. No se usa enum de Prisma para facilitar la extensión sin migraciones.

Subtypes iniciales por tipo de Bond:

```ts
export const BOND_SUBTYPES: Record<BondType, string[]> = {
  PERSON:  ['familiar', 'amistad', 'pareja', 'laboral', 'mentor', 'conocido'],
  BELIEF:  ['religión', 'política', 'filosofía', 'moral', 'espiritual'],
  IDEA:    ['concepto', 'proyecto', 'teoría', 'meta', 'hábito'],
  EMOTION: ['recurrente', 'situacional', 'crónica'],
  PLACE:   ['hogar', 'ciudad', 'lugar significativo'],
  GROUP:   ['familia', 'amigos', 'trabajo', 'comunidad'],
  OTHER:   [],
}
```

---

## Página `/bonds`

### Responsabilidades

- Listar todos los bonds del usuario autenticado.
- Permitir cambiar entre 3 visualizaciones: timeline, grafo y lista.
- Filtrar por tipo, subtipo, madurez y período.
- Sincronizar filtros y vista activa en la URL via `searchParams`.

### Arquitectura de componentes

```
/bonds/page.tsx                  ← Server Component: fetch inicial de bonds + snapshots
  └── BondsPage (client)         ← maneja estado de vista activa y filtros
        ├── BondsToolbar         ← barra superior: toggles de vista + filtros
        │     └── BondsFilterPopover  ← subtipo + madurez + período
        └── [vista activa]
              ├── BondsTimeline  ← vista timeline
              ├── BondsGraph     ← vista grafo
              └── BondsList      ← vista lista
```

### URL y searchParams

| Parámetro | Valores | Default |
|---|---|---|
| `view` | `timeline` \| `graph` \| `list` | `list` |
| `type` | `BondType` \| `ALL` | `ALL` |
| `subtype` | string del vocabulario controlado | — |
| `maturity` | `tags` \| `bonds` \| `ALL` | `ALL` |
| `period` | `3m` \| `6m` \| `1y` \| `all` | `3m` |

---

### BondsToolbar

Barra fija en la parte superior del área de contenido. Dos zonas separadas por un divisor vertical:

**Zona izquierda:**
- Título "Vínculos" (font-weight 500)
- Divisor `0.5px`
- Grupo de 3 botones toggle de vista (timeline / grafo / lista), fondo `#f0f0f8`, activo en `#534AB7`

**Zona derecha:**
- Chips de tipo de bond (scroll horizontal con flechas, patrón del `BondFilterBar` existente)
- Botón "Filtros" con ícono que abre `BondsFilterPopover`

**BondsFilterPopover** — dropdown debajo del botón "Filtros":
- **Subtipo:** chips, dependiente del tipo seleccionado (si tipo = ALL se muestran todos los subtipos)
- **Madurez:** `Todos` / `Etiquetas` (maturityLevel < 5) / `Vínculos maduros` (≥ 5)
- **Período:** `3m` / `6m` / `1 año` / `Todo`

Todos los filtros se reflejan en la URL inmediatamente al seleccionarlos (patrón `router.push` del `BondFilterBar` existente).

---

### Vista 1 — BondsTimeline

**Concepto:** evolución de la cercanía de cada vínculo con el usuario a lo largo del tiempo.

**Eje Y:** escala de -10 a +10, con 0 al centro.
- La métrica graficada es `proximity` del `BondSnapshot`, transformada: `(proximity - 5) * 2` → rango -10 a +10.
- La línea de referencia horizontal en 0 representa la "neutralidad".
- Zona sombreada entre -5 y +5 como banda neutral visual.

**Eje X:** fechas de los `BondSnapshot`, agrupados por el período seleccionado.

**Por bond:**
- Color = tipo de bond (paleta del CLAUDE.md: Coral para PERSON, Pink para BELIEF, Amber para IDEA, Teal para EMOTION, Purple para PLACE/GROUP)
- Etiqueta al final de la línea con el nombre del bond

**Interacciones:**
- Hover sobre un punto → tooltip con nombre, fecha, cercanía e intensidad
- Clic sobre una línea → navega a `/bonds/[id]`

---

### Vista 2 — BondsGraph

**Concepto:** el usuario al centro de su grafo de vínculos.

**Codificación visual:**
| Dimensión | Datos | Cálculo |
|---|---|---|
| Distancia al centro | Presencia (frecuencia de aparición) | `entryBonds.length` normalizado al radio disponible |
| Grosor de la línea | Intensidad promedio | promedio de `intensity` de todos los `BondSnapshot` del período |
| Tamaño del nodo | Antigüedad del vínculo | `(now - bond.createdAt)` en días, normalizado a rango de radio |
| Color del nodo | Tipo de bond | paleta del CLAUDE.md |

**Forma del avatar:**
- `PERSON` → círculo con iniciales (o foto de perfil si `linkedUserId` existe)
- `IDEA` / `BELIEF` / `EMOTION` / `OTHER` → cuadrado con border-radius 7px
- `PLACE` / `GROUP` → cuadrado con border-radius 7px

**Círculos de referencia:** dos anillos punteados concéntricos para guiar la lectura de distancia (alta / baja presencia).

**Interacciones:**
- Hover sobre nodo → tooltip con nombre, tipo, intensidad promedio, presencia
- Clic sobre nodo → navega a `/bonds/[id]`

---

### Vista 3 — BondsList

Tabla con columnas ordenables. Ocupa el 100% del área disponible.

**Columnas:**

| Columna | Ancho | Contenido |
|---|---|---|
| Vínculo | `1.8fr` | Avatar + nombre + subtipo |
| Tipo | `90px` | Chip de color por BondType |
| Evolución | `1.4fr` | Mini línea de cercanía (misma escala centrada en 0) |
| Intensidad | `90px` | Barra de progreso + valor numérico |
| Actividad | `70px` | Tiempo relativo desde último snapshot |

**Avatar:** misma forma que el grafo — círculo para PERSON, cuadrado redondeado para el resto.  
**Orden por defecto:** actividad reciente (último snapshot).  
**Clic en fila:** navega a `/bonds/[id]`.

---

## Página `/bonds/[id]`

### Responsabilidades

- Mostrar el perfil completo de un vínculo.
- Graficar su evolución con el usuario siempre como referencia.
- Permitir comparar con otros vínculos del usuario.
- Listar las entradas relacionadas.

### Arquitectura de componentes

```
/bonds/[id]/page.tsx              ← Server Component: fetch bond + snapshots + entries
  └── BondDetailPage (client)
        ├── BondDetailHeader      ← avatar, nombre, chips métricas, botones
        ├── BondDetailSubtoolbar  ← tipo de gráfica + período + leyenda
        ├── BondDetailChart       ← gráfica principal (línea / barras / dispersión)
        ├── BondEntriesList       ← panel derecho: entradas relacionadas
        └── BondCompareBar        ← barra de comparación (visible solo en modo comparar)
```

---

### BondDetailHeader

Contiene:
- Flecha "← Vínculos" que regresa a `/bonds` preservando los searchParams anteriores
- Avatar del vínculo (misma forma/color que en la lista y el grafo)
- Nombre del vínculo + tipo · subtipo · "vínculo desde [fecha]"
- Chips de métricas rápidas:
  - Intensidad promedio (color del tipo)
  - Cercanía actual (último snapshot, en escala -10/+10, color `#534AB7`)
  - Número total de entradas
- Botón **"Comparar"** (`bg-[#534AB7]`) — activa el modo comparar
- Botón **"+ entrada"** — abre el flujo de nueva entrada con este bond pre-seleccionado

---

### BondDetailSubtoolbar

Fondo `#fafafa`, borde inferior `0.5px`:
- Toggle de tipo de gráfica: **Línea** / Barras / Dispersión
- Toggle de período: 3m / 6m / 1a / Todo
- Leyenda inline: "─ ─ Yo (ref.) · — [Nombre del bond]"

---

### BondDetailChart

La gráfica ocupa el área principal (a la izquierda del panel de entradas).

**En modo individual:**
- Eje Y: -10 a +10, 0 al centro, zona neutral sombreada
- Línea punteada del usuario en 0 (referencia constante)
- Línea sólida del vínculo en su color de tipo
- Tooltips al hover: fecha, cercanía (`proximity` transformado) e intensidad

**En modo comparar:**
- Se superponen todas las líneas de los vínculos comparados
- Cada línea usa el color de su tipo de bond
- La línea del usuario (referencia en 0) siempre visible y punteada
- El panel de entradas se filtra para mostrar solo las del bond base

**Tipos de gráfica:**
- **Línea** — polyline con puntos en los snapshots
- **Barras** — barras verticales por período (semana / mes según el rango)
- **Dispersión** — dots intensity vs proximity en un plano cartesiano

---

### BondCompareBar

Visible únicamente cuando el modo comparar está activo. Barra en la parte superior del área de contenido (debajo del header, sobre la sub-toolbar).

- Fondo `#eeedfe`, borde `0.5px solid #cac7f4`
- Etiqueta "Comparando:"
- Chip del bond base (no eliminable)
- Chips de bonds añadidos (con botón `×` para quitarlos, color del tipo)
- Botón "+ añadir vínculo" → abre un popover de búsqueda de bonds del usuario
- Botón "Salir de comparación ×" a la derecha

El estado de comparación vive en `searchParams` (`?compare=id1,id2`) para que sea compartible.

---

### BondEntriesList

Panel derecho fijo (`w-52`), borde izquierdo `0.5px`.

- Header "Entradas" en uppercase pequeño
- Lista scrolleable de entradas relacionadas ordenadas por fecha descendente
- Cada fila: título de la entrada + fecha + intensidad del `EntryBond`
- Clic en fila → navega a `/journal/[id]`

---

## Acciones del servidor

Nuevo archivo: `src/lib/actions/bonds.actions.ts`

```ts
// Funciones a implementar:
getBondsWithSnapshots(userId, filters)  // para /bonds — lista + snapshots resumidos
getBondDetail(userId, bondId)           // para /bonds/[id] — bond + todos sus snapshots
getBondEntries(userId, bondId)          // entradas relacionadas con un bond
```

Todas verifican sesión con `auth()` al inicio y validan parámetros con Zod.

---

## Consideraciones de datos

### Transformación de proximity para la gráfica

El campo `proximity` en `BondSnapshot` es `Float` (1-10). La visualización usa una escala centrada en 0:

```ts
// cercanía visual = ((proximity - 1) / 9) * 20 - 10  →  rango exacto [-10, +10]
// proximidad 1  → -10 (muy lejano)
// proximidad 5.5 → 0  (neutral)
// proximidad 10 → +10 (muy cercano)
```

Este cálculo ocurre solo en el componente de visualización — los datos se guardan siempre como 1-10 en la DB. La función utilitaria vivirá en `src/lib/bond-subtypes.ts` como `proximityToVisual(p: number): number`.

### Cálculo de distancia en el grafo

```ts
// presencia = entryBonds.length en el período seleccionado
// distancia_visual = radio_max - (presencia / presencia_max) * radio_max
// tamaño_nodo = min_size + (días_desde_creación / max_días) * (max_size - min_size)
```

### Performance

- Los snapshots se cargan en el Server Component y se pasan como props (no client-side fetch)
- Para el grafo, se usa solo el promedio de snapshots (1 registro por bond), no el historial completo
- Para el timeline, se pasan todos los snapshots del período seleccionado

---

## Archivos a crear / modificar

### Modificar
- `prisma/schema.prisma` — añadir `subtype String?` a `Bond`

### Crear
```
src/lib/bond-subtypes.ts               ← vocabulario controlado de subtipos
src/lib/actions/bonds.actions.ts       ← acciones del servidor para bonds
src/app/bonds/page.tsx                 ← página /bonds (Server Component)
src/app/bonds/[id]/page.tsx            ← página /bonds/[id] (Server Component)
src/components/bonds/BondsPage.tsx     ← Client Component raíz de /bonds
src/components/bonds/BondsToolbar.tsx  ← toolbar con toggles y filtros
src/components/bonds/BondsFilterPopover.tsx
src/components/bonds/BondsTimeline.tsx
src/components/bonds/BondsGraph.tsx
src/components/bonds/BondsList.tsx
src/components/bonds/BondDetailPage.tsx
src/components/bonds/BondDetailHeader.tsx
src/components/bonds/BondDetailSubtoolbar.tsx
src/components/bonds/BondDetailChart.tsx
src/components/bonds/BondCompareBar.tsx
src/components/bonds/BondEntriesList.tsx
src/components/bonds/BondAvatar.tsx    ← avatar reutilizable (círculo/cuadrado según tipo)
src/types/bonds.ts                     ← tipos TypeScript para esta sección
```

---

## Principios de diseño aplicados (CLAUDE.md)

- Bordes `0.5px` en todos los divisores decorativos
- `border-radius` `8px` para chips, `12px` para cards
- Solo font-weight `400` y `500`
- Sentence case en todos los textos de UI
- Sin gradientes ni sombras decorativas
- Color primario `#534AB7` para estados activos y CTAs
- Paleta de tipos: Coral `#D85A30` (PERSON), Pink `#D4537E` (BELIEF), Amber `#BA7517` (IDEA), Teal `#1D9E75` (EMOTION)
- Touch targets mínimo `44×44px`
- No queries de Prisma directas en componentes — siempre via actions
