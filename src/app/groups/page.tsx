import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getGroups } from "@/lib/actions/bonds.actions"
import { AppShell } from "@/components/layout/AppShell"
import { GroupsPage } from "@/components/groups/GroupsPage"

export default async function GroupsRoute() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const groups = await getGroups()

  return (
    <AppShell>
      <GroupsPage groups={groups.map(g => ({
        id: g.id,
        name: g.name,
        description: g.description,
        isShared: g.isShared,
        bondCount: g._count.groupBonds,
        entryCount: g._count.groupEntries,
      }))} />
    </AppShell>
  )
}
