import { Suspense } from "react"
import { Column, Heading } from "@once-ui-system/core"
import { SignUpForm } from "@/components/auth/SignUpForm"

export default function SignUpPage() {
  return (
    <Column fillWidth minHeight="100vh" horizontal="center" vertical="center" padding="24">
      <Column maxWidth="xs" gap="24" fillWidth>
        <Heading variant="display-strong-s" align="center">wo-shi</Heading>
        {/* SignUpForm lee ?redirect_url= vía useSearchParams — requiere
            Suspense para no romper el prerender estático (ver docs de
            Next.js sobre useSearchParams). */}
        <Suspense fallback={null}>
          <SignUpForm />
        </Suspense>
      </Column>
    </Column>
  )
}
