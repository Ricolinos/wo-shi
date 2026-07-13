// src/app/journal/[id]/edit/page.tsx
import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import { getJournalEntry } from "@/lib/actions/entry.actions"
import { EntryForm } from "@/components/journal/EntryForm"

export default async function EditEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const { id } = await params
  const entry = await getJournalEntry(id)
  if (!entry) notFound()

  return <EntryForm mode="edit" initialEntry={entry} />
}
