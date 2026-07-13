"use client"

import { useState, type FormEvent } from "react"
import { useSearchParams } from "next/navigation"
import { useSignUp } from "@clerk/nextjs/legacy"
import { Column, Row, Input, Button, Text, SmartLink } from "@once-ui-system/core"
import { SocialAuthButtons, type OAuthProviderStrategy } from "./SocialAuthButtons"
import { translateClerkError } from "./clerkErrors"
import { getSafeRedirect } from "./redirectUrl"

type Step = "register" | "verify"

export function SignUpForm() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const searchParams = useSearchParams()
  const redirectTarget = getSafeRedirect(searchParams)

  const [step, setStep] = useState<Step>("register")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [loading, setLoading] = useState(false)
  const [oauthPending, setOauthPending] = useState<OAuthProviderStrategy | null>(null)

  async function handleRegister(e: FormEvent) {
    e.preventDefault()
    if (!isLoaded) return
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      setErrorMsg("Usuario: 3-20 caracteres, solo minúsculas/números/guión bajo.")
      return
    }
    setLoading(true)
    setErrorMsg("")

    try {
      await signUp.create({ emailAddress: email, password, username })
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      setStep("verify")
    } catch (err) {
      setErrorMsg(translateClerkError(err, "Error al crear la cuenta"))
    } finally {
      setLoading(false)
    }
  }

  async function handleOAuth(strategy: OAuthProviderStrategy) {
    if (!isLoaded) return
    setErrorMsg("")
    setOauthPending(strategy)
    try {
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: redirectTarget,
      })
    } catch (err) {
      setOauthPending(null)
      setErrorMsg(translateClerkError(err, "No se pudo continuar con este proveedor"))
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault()
    if (!isLoaded) return
    setLoading(true)
    setErrorMsg("")

    try {
      const result = await signUp.attemptEmailAddressVerification({ code })
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        window.location.href = redirectTarget
      }
    } catch (err) {
      setErrorMsg(translateClerkError(err, "Código incorrecto"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Column fillWidth gap="l">
      <Text variant="body-default-m" onBackground="neutral-weak" align="center">
        {step === "register" ? "Crea tu cuenta para empezar tu diario." : `Ingresa el código enviado a ${email}.`}
      </Text>

      {step === "register" && (
        <>
          <SocialAuthButtons onSelect={handleOAuth} loading={loading} disabled={!isLoaded} pending={oauthPending} />
          <form onSubmit={handleRegister} style={{ width: "100%" }}>
            <Column gap="m">
              <Input id="signup-username" label="Nombre de usuario" value={username} onChange={e => setUsername(e.target.value.toLowerCase())} required />
              <Input id="signup-email" label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              <Input id="signup-password" label="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              {errorMsg && <Text variant="body-default-s" onBackground="danger-weak">{errorMsg}</Text>}
              <Button type="submit" fillWidth loading={loading} disabled={!isLoaded}>Continuar</Button>
            </Column>
          </form>
          <Row horizontal="center">
            <Text variant="body-default-s" onBackground="neutral-weak">
              ¿Ya tienes cuenta?{" "}
              <SmartLink href="/sign-in" style={{ textDecoration: "underline" }}>Inicia sesión</SmartLink>
            </Text>
          </Row>
        </>
      )}

      {step === "verify" && (
        <form onSubmit={handleVerify} style={{ width: "100%" }}>
          <Column gap="m">
            <Input id="signup-code" label="Código de verificación" value={code} onChange={e => setCode(e.target.value)} required />
            {errorMsg && <Text variant="body-default-s" onBackground="danger-weak">{errorMsg}</Text>}
            <Button type="submit" fillWidth loading={loading}>Verificar y continuar</Button>
            <Button type="button" variant="secondary" fillWidth onClick={() => setStep("register")}>Volver</Button>
          </Column>
        </form>
      )}
    </Column>
  )
}
