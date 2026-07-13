import { Column, Heading } from "@once-ui-system/core"
import { SignUpForm } from "@/components/auth/SignUpForm"

export default function SignUpPage() {
  return (
    <Column fillWidth minHeight="100vh" horizontal="center" vertical="center" padding="24">
      <Column maxWidth="24" gap="24" fillWidth>
        <Heading variant="display-strong-s" align="center">wo-shi</Heading>
        <SignUpForm />
      </Column>
    </Column>
  )
}
