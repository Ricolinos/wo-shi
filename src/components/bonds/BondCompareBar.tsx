"use client"

import { useState, useEffect, useCallback } from "react"
import { Row, Input, Tag, Button, Column } from "@once-ui-system/core"
import { searchUserBonds } from "@/lib/actions/bonds.actions"
import type { BondType } from "@prisma/client"

type Candidate = { id: string; name: string; type: BondType }

export function BondCompareBar({
  baseName, comparedIds, onAdd, onRemove, onExit,
}: {
  baseName: string
  comparedIds: { id: string; name: string }[]
  onAdd: (b: Candidate) => void
  onRemove: (id: string) => void
  onExit: () => void
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Candidate[]>([])

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setResults(await searchUserBonds(q))
  }, [])

  useEffect(() => {
    const t = setTimeout(() => search(query), 300)
    return () => clearTimeout(t)
  }, [query, search])

  return (
    <Column gap="8" fillWidth padding="12" radius="m" background="brand-alpha-weak" border="brand-alpha-medium">
      <Row gap="8" vertical="center" wrap>
        <Tag variant="brand" label={`Comparando: ${baseName}`} />
        {comparedIds.map(c => (
          <Tag key={c.id} variant="accent" label={c.name} onClick={() => onRemove(c.id)} style={{ cursor: "pointer" }} />
        ))}
        <Button variant="secondary" size="s" onClick={onExit}>Salir de comparación</Button>
      </Row>
      <Row gap="8" vertical="center">
        <Input id="compare-search" label="+ añadir vínculo" value={query} onChange={e => setQuery(e.target.value)} />
      </Row>
      {results.length > 0 && (
        <Row gap="4" wrap>
          {results.map(r => (
            <Tag key={r.id} variant="neutral" label={r.name} onClick={() => { onAdd(r); setQuery(""); setResults([]) }} style={{ cursor: "pointer" }} />
          ))}
        </Row>
      )}
    </Column>
  )
}
