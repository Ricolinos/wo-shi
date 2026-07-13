import { Suspense } from "react"
import { Column, Heading } from "@once-ui-system/core"
import { SignInForm } from "@/components/auth/SignInForm"

export default function SignInPage() {
  return (
    <Column fillWidth minHeight="100vh" horizontal="center" vertical="center" padding="24">
      <Column maxWidth="xs" gap="24" fillWidth>
        <Heading variant="display-strong-s" align="center">wo-shi</Heading>
        {/* SignInForm lee ?redirect_url= vía useSearchParams — requiere
            Suspense para no romper el prerender estático (ver docs de
            Next.js sobre useSearchParams). */}
        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
      </Column>
    </Column>
  )
}
