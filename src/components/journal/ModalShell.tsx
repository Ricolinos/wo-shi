// src/components/journal/ModalShell.tsx
"use client"

import { useEffect, useRef } from "react"

interface Props {
  title: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
}

export function ModalShell({ title, onClose, children, footer }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)

  // cerrar con Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  // bloquear scroll del body
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 px-0 sm:px-4"
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="
        w-full sm:max-w-md
        bg-[var(--color-background-primary)]
        border border-[var(--color-border-secondary)]
        rounded-t-2xl sm:rounded-xl
        overflow-hidden
        max-h-[90vh] flex flex-col
        animate-in slide-in-from-bottom-4 duration-200
      ">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-tertiary)] flex-shrink-0">
          <span className="text-sm font-medium text-[var(--color-text-primary)]">{title}</span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full border border-[var(--color-border-secondary)] flex items-center justify-center text-xs text-[var(--color-text-tertiary)] hover:bg-[var(--color-background-secondary)] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* body — scrollable */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>

        {/* footer fijo */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--color-border-tertiary)] flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
