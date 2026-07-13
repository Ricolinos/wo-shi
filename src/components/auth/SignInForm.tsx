"use client"

import { useState, type FormEvent } from "react"
import { useSignIn } from "@clerk/nextjs/legacy"
import { Column, Row, Input, Button, Text, SmartLink } from "@once-ui-system/core"
import { SocialAuthButtons, type OAuthProviderStrategy } from "./SocialAuthButtons"
import { translateClerkError } from "./clerkErrors"

export function SignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn()

  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [loading, setLoading] = useState(false)
  const [oauthPending, setOauthPending] = useState<OAuthProviderStrategy | null>(null)

  async function handleCredentials(e: FormEvent) {
    e.preventDefault()
    if (!isLoaded) return
    setLoading(true)
    setErrorMsg("")

    try {
      const result = await signIn.create({ identifier, password })
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        window.location.href = "/feed"
        return
      }
      setErrorMsg(`Error inesperado (${result.status}). Intenta de nuevo.`)
    } catch (err) {
      setErrorMsg(translateClerkError(err, "Credenciales incorrectas"))
    } finally {
      setLoading(false)
    }
  }

  async function handleOAuth(strategy: OAuthProviderStrategy) {
    if (!isLoaded) return
    setErrorMsg("")
    setOauthPending(strategy)
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/feed",
      })
    } catch (err) {
      setOauthPending(null)
      setErrorMsg(translateClerkError(err, "No se pudo iniciar sesión con este proveedor"))
    }
  }

  return (
    <Column fillWidth gap="l">
      <SocialAuthButtons onSelect={handleOAuth} loading={loading} disabled={!isLoaded} pending={oauthPending} />

      <form onSubmit={handleCredentials} style={{ width: "100%" }}>
        <Column gap="m">
          <Input
            id="signin-identifier"
            label="Email o nombre de usuario"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            required
          />
          <Input
            id="signin-password"
            label="Contraseña"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {errorMsg && (
            <Text variant="body-default-s" onBackground="danger-weak">{errorMsg}</Text>
          )}
          <Button type="submit" fillWidth loading={loading} disabled={!isLoaded}>
            Entrar
          </Button>
        </Column>
      </form>

      <Row horizontal="center">
        <Text variant="body-default-s" onBackground="neutral-weak">
          ¿No tienes cuenta?{" "}
          <SmartLink href="/sign-up" style={{ textDecoration: "underline" }}>Regístrate</SmartLink>
        </Text>
      </Row>
    </Column>
  )
}
