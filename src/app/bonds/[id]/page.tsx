import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import { getBondDetail, getBondEntries } from "@/lib/actions/bonds.actions"
import { AppShell } from "@/components/layout/AppShell"
import { BondDetailPage } from "@/components/bonds/BondDetailPage"

export default async function BondDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const { id } = await params
  const [bond, entries] = await Promise.all([getBondDetail(id), getBondEntries(id)])
  if (!bond) notFound()

  return (
    <AppShell>
      <BondDetailPage bond={bond} entries={entries} />
    </AppShell>
  )
}
