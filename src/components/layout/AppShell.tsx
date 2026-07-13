import { Row } from "@once-ui-system/core"
import { AppSidebar } from "./AppSidebar"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Row fillWidth style={{ minHeight: "100dvh" }}>
      <AppSidebar />
      <Row flex={1} style={{ overflowY: "auto" }}>
        {children}
      </Row>
    </Row>
  )
}
