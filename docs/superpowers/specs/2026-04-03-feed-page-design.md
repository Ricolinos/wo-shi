# Spec: Página de Feed — wo-shi
**Fecha:** 2026-04-03  
**Estado:** Aprobado

---

## Resumen

Página `/feed` — vista pública del diario social de wo-shi. Muestra entradas compartidas por el usuario y sus contactos en orden cronológico inverso. Es la pantalla de inicio de la app tras el login.

---

## Estructura de layout

La app usa un layout de **dos niveles**:

```
┌─────────────────────────────────────────┐  ← topbar (100% ancho pantalla)
│ [logo + búsqueda] │ [tabs de vínculos]  │
├────┬────────────────────────────────────┤
│    │  espaciador  │  FEED  │  privacidad│  ← body
│ SB │   (182px)    │ (540px)│   (182px) │
│    │                                    │
└────┴────────────────────────────────────┘
```

### Topbar (`header`, `position: static`, `width: 100%`)
- Abarca el 100% del ancho de pantalla, incluida la zona del sidebar
- **Izquierda fija (240px):** logo de la app (SVG nodo-grafo) + caja de búsqueda "Buscar en wo-shi"
- **Resto:** tabs de filtro por tipo de vínculo, centrados, con scroll horizontal
- Separador `border-right: 0.5px solid` entre logo+búsqueda y los tabs
- **Tabs de vínculo:** Todos / Personas / Emociones / Ideas / Creencias / Lugares / Grupos
  - Cada tab: ícono SVG + label centrados verticalmente
  - Estado activo: `color: #534AB7`, `border-bottom: 2px solid #534AB7`
  - Scroll horizontal con `overflow-x: auto` + `scrollbar: hidden`
  - Degradado de transparencia en borde izquierdo y derecho (gradiente blanco→transparente)
  - Flechas `‹ ›` que aparecen al hover sobre la barra (opacity 0→1)

### Sidebar izquierdo (transparente, `width: 64px`)
- Fondo completamente transparente, sin borde
- Íconos de navegación **centrados verticalmente** entre sí
- Secciones:
  - **Top:** (vacío — alineado con el topbar)
  - **Centro:** Feed · Diario · Vínculos · Grupos
  - **Bottom:** Botón `+` Nueva entrada (purple `#534AB7`) · Avatar de perfil
- Íconos de 24×24px en contenedor de 44×44px con `border-radius: 10px`
- Hover: fondo `rgba(83,74,183,0.08)`, color `#534AB7`
- Activo: fondo `rgba(83,74,183,0.10)`, color `#534AB7`
- **Tooltip al hover:** label con fondo `#1a1a2e`, aparece a la derecha con transición `opacity + translateX` (150ms ease)

### Feed (centrado)
- `max-width: 540px`, centrado visualmente mediante espaciador izquierdo de igual ancho al panel derecho (182px)
- Ordenado cronológicamente (más reciente primero)
- Gap entre cards: `16px`

### Panel de privacidad (derecha, `width: 182px`)
- Filtros: Todo · Solo yo · Amigos · Público
- Cada opción: ícono en cuadro redondeado + label + punto indicador activo
- Activo: fondo blanco, `box-shadow: 0 0 0 0.5px #e2e2ef`
- No es sticky, desaparece con el scroll

---

## Cards de entrada

Estructura de cada card (`border-radius: 12px`, `border: 0.5px solid #e2e2ef`):

```
┌──────────────────────────────────────┐
│  [avatar] Nombre · hace X h · lugar  [vis] │  ← header
├──────────────────────────────────────┤
│  [MEDIA TILES o AUDIO BANNER]        │  ← bloque media
├──────────────────────────────────────┤
│  Título de la entrada                │  ← body
│  Texto breve...                      │
│  [chip] [chip] [chip]                │  ← chips de vínculos
└──────────────────────────────────────┘
```

### Header de card
- Avatar circular 32×32px
- Nombre (font-weight 500) + tiempo relativo + ciudad
- Badge de visibilidad: ícono SVG + label (`Solo yo` / `Amigos` / `Público`)

### Bloque de media — tiles cuadrados

Todos los tiles usan `object-fit: cover; object-position: center` — sin distorsión, centrado.

| Cantidad | Layout |
|---|---|
| 1 archivo | Cuadrado completo (`aspect-ratio: 1/1`) |
| 2 archivos | Grid `1fr 1fr`, cada tile `aspect-ratio: 1/1` |
| 3 archivos | Grid `2fr 1fr`: tile principal cuadrado a la izq + columna flex con 2 tiles iguales a la der |
| 4+ archivos | Grid `1fr 1fr / 1fr 1fr` con `aspect-ratio: 1/1` en el contenedor; último tile con overlay `rgba(83,74,183,0.65)` + texto `+N` |

- Gap entre tiles: `1px`, fondo `#e2e2ef` (simula separador)
- Los videos muestran un overlay translúcido con botón de play circular

### Bloque de audio — banner degradado + waveform

Cuando la entry solo tiene media de tipo `AUDIO`:
- Banner `linear-gradient(135deg, #534AB7 → #7F77DD)`, `padding: 18px 16px`
- Botón play circular blanco con ícono `▶` en purple
- Waveform decorativo: barras de `3px` de ancho con `border-radius: 2px`
  - Barras ya reproducidas: `rgba(255,255,255,0.92)`
  - Barras pendientes: `rgba(255,255,255,0.30)`
- Tiempo reproducido / duración total debajo del waveform

### Body de card
- Título: `font-size: 13px`, `font-weight: 500`
- Texto: `font-size: 11px`, `color: #555`, `line-height: 1.6`, truncado a 2-3 líneas
- Chips de vínculos con colores por tipo (ver paleta en CLAUDE.md)

---

## Filtros

### Por tipo de vínculo (topbar)
- Filtra la lista de entradas para mostrar solo las que contienen al menos un bond del tipo seleccionado
- "Todos" desactiva el filtro
- Un solo filtro activo a la vez

### Por visibilidad (panel derecho)
- `Todo` — muestra todas las entradas accesibles por el usuario
- `Solo yo` — solo entradas propias con visibility `PRIVATE`
- `Amigos` — entradas con visibility `FRIENDS` de usuarios con follow mutuo
- `Público` — entradas con visibility `PUBLIC`
- La lógica de visibilidad sigue las reglas de privacidad de CLAUDE.md

---

## Entradas ficticias (seed data)

Mínimo 4 entradas para poblar el feed en desarrollo. Deben cubrir todos los casos de media:

| # | Autor | Media | Tipo | Vínculos |
|---|---|---|---|---|
| 1 | Sofía M. | 3 archivos (2 fotos + 1 video) | `FRIENDS` | persona, emoción, idea, lugar |
| 2 | Lucía R. | 1 audio (1:47) | `FRIENDS` | persona, emoción, creencia |
| 3 | Marco T. | 7 fotos (muestra 4 + overlay +3) | `PUBLIC` | persona, sentimiento, lugar |
| 4 | Andrés P. | 1 foto | `PUBLIC` | sentimiento, idea |
| 5 | Elena V. | 2 archivos (foto + video) | `FRIENDS` | lugar, emoción, idea |

Las URLs de media se toman de `picsum.photos` (imágenes) y archivos de audio públicos. El seed se implementa en `prisma/seed.ts` y se ejecuta con `npx prisma db seed`.

---

## Datos — Server Action / API

```ts
// src/lib/actions/feed.actions.ts
getFeedEntries(options: {
  userId: string
  bondTypeFilter?: BondType   // undefined = todos
  visibilityFilter?: Visibility // undefined = todas accesibles
  cursor?: string              // para paginación futura
  limit?: number               // default 20
}): Promise<FeedEntry[]>
```

Reglas de acceso (mismas que CLAUDE.md):
- `PRIVATE`: solo si `entry.userId === userId`
- `FRIENDS`: solo si hay follow mutuo entre autor y userId
- `PUBLIC`: cualquier usuario autenticado
- Siempre verificar `TagApproval` si el usuario fue etiquetado

---

## Archivos a crear / modificar

```
src/
├── app/
│   └── feed/
│       └── page.tsx                  ← nueva página (Server Component)
├── components/
│   └── feed/
│       ├── FeedCard.tsx              ← card individual
│       ├── MediaTiles.tsx            ← lógica de grid de media
│       ├── AudioBanner.tsx           ← banner de audio con waveform
│       ├── BondFilterBar.tsx         ← tabs de vínculos en topbar
│       └── PrivacyPanel.tsx          ← panel filtro privacidad
├── lib/
│   └── actions/
│       └── feed.actions.ts           ← Server Action para obtener entradas
└── prisma/
    └── seed.ts                       ← seed con 5 entradas ficticias
```

La ruta `/` redirige a `/feed` (home después del login). El dashboard existente en `/dashboard` queda como stub o se elimina en esta iteración.

---

## Consideraciones móviles

- Touch targets mínimo 44×44px (íconos sidebar, botones de play, tabs)
- El sidebar en móvil se oculta y se reemplaza por bottom navigation
- La barra de filtro de vínculos ya está diseñada para scroll horizontal táctil
- El panel de privacidad en móvil se convierte en un sheet deslizable desde abajo
