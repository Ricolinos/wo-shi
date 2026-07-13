"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Column, Row, Heading, Text, Button, Dialog, Input, Textarea, Tag } from "@once-ui-system/core"
import { createGroup } from "@/lib/actions/bonds.actions"

type Group = { id: string; name: string; description: string | null; isShared: boolean; bondCount: number; entryCount: number }

export function GroupsPage({ groups }: { groups: Group[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    setSaving(true)
    setError(null)
    const res = await createGroup(name, description)
    setSaving(false)
    if (!res.ok) { setError(res.error); return }
    setOpen(false)
    setName("")
    setDescription("")
    router.refresh()
  }

  return (
    <Column fillWidth maxWidth="m" paddingY="24" paddingX="16" gap="16" style={{ margin: "0 auto" }}>
      <Row horizontal="between" vertical="center">
        <Heading variant="display-strong-xs">Grupos</Heading>
        <Button variant="primary" prefixIcon="add" onClick={() => setOpen(true)}>Nuevo grupo</Button>
      </Row>

      {groups.length === 0 ? (
        <Column padding="40" horizontal="center">
          <Text variant="body-default-m" onBackground="neutral-weak">Aún no tienes grupos. Crea uno para agrupar vínculos y entradas relacionadas (ej. &quot;viaje a Roma&quot;).</Text>
        </Column>
      ) : (
        <Column gap="8">
          {groups.map(g => (
            <Row key={g.id} gap="12" padding="16" radius="l" border="neutral-alpha-weak" background="surface" vertical="center">
              <Column flex={1} gap="4">
                <Text variant="label-strong-s">{g.name}</Text>
                {g.description && <Text variant="body-default-s" onBackground="neutral-weak">{g.description}</Text>}
              </Column>
              <Tag variant="neutral" label={`${g.bondCount} vínculos`} />
              <Tag variant="neutral" label={`${g.entryCount} entradas`} />
            </Row>
          ))}
        </Column>
      )}

      {open && (
        <Dialog isOpen onClose={() => setOpen(false)} title="Nuevo grupo" footer={
          <Row gap="8" horizontal="end" fillWidth>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleCreate} loading={saving} disabled={!name.trim()}>Crear grupo</Button>
          </Row>
        }>
          <Column gap="16" padding="4">
            <Input id="group-name" label="Nombre" value={name} onChange={e => setName(e.target.value)} />
            <Textarea id="group-description" label="Descripción (opcional)" lines={2} value={description} onChange={e => setDescription(e.target.value)} />
            {error && <Text variant="body-default-s" onBackground="danger-weak">{error}</Text>}
          </Column>
        </Dialog>
      )}
    </Column>
  )
}
