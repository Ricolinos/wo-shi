import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { UserProfile } from "@clerk/nextjs"
import { Column, Heading } from "@once-ui-system/core"
import { AppShell } from "@/components/layout/AppShell"

export default async function SettingsPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  return (
    <AppShell>
      <Column fillWidth paddingY="24" paddingX="16" gap="16" horizontal="center">
        <Column maxWidth="l" fillWidth gap="16">
          <Heading variant="display-strong-xs">Ajustes</Heading>
          <UserProfile routing="hash" />
        </Column>
      </Column>
    </AppShell>
  )
}
