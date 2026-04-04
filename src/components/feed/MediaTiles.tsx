// src/components/feed/MediaTiles.tsx
// Renderiza el bloque de media de una entrada.
// Todos los tiles son cuadrados (aspect-ratio 1:1) con object-fit: cover.

type MediaItem = {
  id: string
  type: "IMAGE" | "VIDEO" | "AUDIO"
  url: string
  duration: number | null
}

type Props = {
  media: MediaItem[]
}

export function MediaTiles({ media }: Props) {
  // Excluir audio — se renderiza por separado con AudioBanner
  const visual = media.filter(m => m.type !== "AUDIO")
  if (visual.length === 0) return null

  if (visual.length === 1) return <Grid1 item={visual[0]} />
  if (visual.length === 2) return <Grid2 items={visual} />
  if (visual.length === 3) return <Grid3 items={visual} />
  return <Grid4 items={visual} />
}

// ── 1 archivo — cuadrado completo ─────────────────────────────────────────────

function Grid1({ item }: { item: MediaItem }) {
  return (
    <div className="w-full aspect-square overflow-hidden">
      <MediaItemRenderer item={item} className="w-full h-full" />
    </div>
  )
}

// ── 2 archivos — dos cuadrados lado a lado ────────────────────────────────────

function Grid2({ items }: { items: MediaItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-px bg-[#e2e2ef]">
      {items.map(item => (
        <div key={item.id} className="aspect-square overflow-hidden">
          <MediaItemRenderer item={item} className="w-full h-full" />
        </div>
      ))}
    </div>
  )
}

// ── 3 archivos — 1 grande (2fr) + 2 apilados (1fr) ───────────────────────────

function Grid3({ items }: { items: MediaItem[] }) {
  const [main, ...rest] = items
  return (
    <div className="grid gap-px bg-[#e2e2ef]" style={{ gridTemplateColumns: "2fr 1fr" }}>
      <div className="aspect-square overflow-hidden">
        <MediaItemRenderer item={main} className="w-full h-full" />
      </div>
      <div className="flex flex-col gap-px bg-[#e2e2ef]">
        {rest.map(item => (
          <div key={item.id} className="flex-1 overflow-hidden min-h-0">
            <MediaItemRenderer item={item} className="w-full h-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 4+ archivos — grid 2×2 con overlay "+N" en el último ─────────────────────

function Grid4({ items }: { items: MediaItem[] }) {
  const visible = items.slice(0, 4)
  const remaining = items.length - 4

  return (
    <div className="grid grid-cols-2 aspect-square gap-px bg-[#e2e2ef]" style={{ gridTemplateRows: "1fr 1fr" }}>
      {visible.map((item, i) => {
        const isLast = i === 3 && remaining > 0
        return (
          <div key={item.id} className="relative overflow-hidden min-h-0">
            <MediaItemRenderer item={item} className="w-full h-full" />
            {isLast && (
              <div className="absolute inset-0 flex items-center justify-center bg-[rgba(83,74,183,0.65)]">
                <span className="text-white text-xl font-medium">+{remaining}</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Componente base: imagen o video ───────────────────────────────────────────

function MediaItemRenderer({ item, className }: { item: MediaItem; className: string }) {
  if (item.type === "VIDEO") {
    return (
      <div className={`relative ${className}`}>
        <video
          src={item.url}
          className="w-full h-full object-cover object-center"
          muted
          preload="metadata"
        />
        {/* overlay de play */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
          <div className="w-9 h-9 rounded-full bg-white/85 flex items-center justify-center">
            <span className="text-[#1a1a2e] text-sm ml-0.5">▶</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.url}
      alt=""
      className={`object-cover object-center ${className}`}
      loading="lazy"
    />
  )
}
