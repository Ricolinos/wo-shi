// src/app/auth/page.tsx
"use client"

import { useState, useTransition } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { registerUser } from "@/lib/actions/auth.actions"
import Link from "next/link"

// ─── Logo mark ────────────────────────────────────────────────────────────────
function WoshiMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="2" fill="#7F77DD" />
      <circle cx="3" cy="4" r="1.2" fill="#AFA9EC" />
      <circle cx="11" cy="4" r="1.2" fill="#AFA9EC" />
      <circle cx="3" cy="10" r="1.2" fill="#AFA9EC" />
      <circle cx="11" cy="10" r="1.2" fill="#AFA9EC" />
      <line x1="5" y1="6" x2="3.8" y2="4.8" stroke="#CECBF6" strokeWidth="0.8" />
      <line x1="9" y1="6" x2="10.2" y2="4.8" stroke="#CECBF6" strokeWidth="0.8" />
      <line x1="5" y1="8" x2="3.8" y2="9.2" stroke="#CECBF6" strokeWidth="0.8" />
      <line x1="9" y1="8" x2="10.2" y2="9.2" stroke="#CECBF6" strokeWidth="0.8" />
    </svg>
  )
}

// ─── Google icon ──────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.251 17.64 11.943 17.64 9.2z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853" />
      <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}

// ─── Input field ──────────────────────────────────────────────────────────────
function Field({
  label,
  name,
  type = "text",
  placeholder,
  error,
  hint,
}: {
  label: string
  name: string
  type?: string
  placeholder?: string
  error?: string
  hint?: string
}) {
  return (
    <div className="mb-4">
      <label
        htmlFor={name}
        className="block text-xs text-[var(--color-text-secondary)] mb-1.5"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={type === "password" ? "current-password" : name}
        className={`
          w-full px-3 py-2 text-sm rounded-lg
          bg-[var(--color-background-primary)]
          text-[var(--color-text-primary)]
          border outline-none transition-all
          placeholder:text-[var(--color-text-tertiary)]
          focus:ring-2 focus:ring-[#EEEDFE] focus:border-[#7F77DD]
          ${error
            ? "border-[var(--color-border-danger)]"
            : "border-[var(--color-border-secondary)] hover:border-[var(--color-border-primary)]"
          }
        `}
      />
      {error && (
        <p className="mt-1 text-xs text-[var(--color-text-danger)]">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">{hint}</p>
      )}
    </div>
  )
}

// ─── Divider ──────────────────────────────────────────────────────────────────
function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-[var(--color-border-tertiary)]" />
      <span className="text-xs text-[var(--color-text-tertiary)]">{label}</span>
      <div className="flex-1 h-px bg-[var(--color-border-tertiary)]" />
    </div>
  )
}

// ─── Login panel ─────────────────────────────────────────────────────────────
function LoginPanel({ onMagicSent }: { onMagicSent: () => void }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [magicEmail, setMagicEmail] = useState("")
  const [showMagic, setShowMagic] = useState(false)

  async function handleCredentials(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await signIn("credentials", {
        email: fd.get("email"),
        password: fd.get("password"),
        redirect: false,
      })
      if (res?.error) {
        setError("Correo o contraseña incorrectos")
      } else {
        router.push("/dashboard")
      }
    })
  }

  async function handleMagic(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    startTransition(async () => {
      await signIn("resend", { email: magicEmail, redirect: false })
      onMagicSent()
    })
  }

  return (
    <div>
      {!showMagic ? (
        <>
          <form onSubmit={handleCredentials}>
            <Field label="Correo electrónico" name="email" type="email" placeholder="tu@correo.com" />
            <Field label="Contraseña" name="password" type="password" placeholder="••••••••" />
            {error && (
              <p className="text-xs text-[var(--color-text-danger)] mb-3 -mt-2">{error}</p>
            )}
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 rounded-lg text-sm font-medium text-white bg-[#534AB7] hover:bg-[#3C3489] active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {isPending ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <Divider label="o continúa con" />

          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full flex items-center justify-center gap-2 py-2.5 mb-2.5 text-sm rounded-lg border border-[var(--color-border-secondary)] hover:bg-[var(--color-background-secondary)] transition-colors"
          >
            <GoogleIcon />
            Continuar con Google
          </button>

          <button
            onClick={() => setShowMagic(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm rounded-lg border border-[var(--color-border-secondary)] hover:bg-[var(--color-background-secondary)] transition-colors"
          >
            <span className="text-[var(--color-text-secondary)] text-base leading-none">✦</span>
            Enlace mágico
          </button>

          <p className="text-center mt-4 text-xs text-[var(--color-text-tertiary)]">
            <Link href="/auth?forgot=true" className="text-[#534AB7] hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
        </>
      ) : (
        <form onSubmit={handleMagic}>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            Te enviaremos un enlace para entrar sin contraseña.
          </p>
          <Field
            label="Correo electrónico"
            name="magic-email"
            type="email"
            placeholder="tu@correo.com"
          />
          {/* controlado aparte para no confundir con el form de credentials */}
          <input
            hidden
            value={magicEmail}
            onChange={e => setMagicEmail(e.target.value)}
          />
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white bg-[#534AB7] hover:bg-[#3C3489] transition-all disabled:opacity-60"
          >
            {isPending ? "Enviando…" : "Enviar enlace"}
          </button>
          <button
            type="button"
            onClick={() => setShowMagic(false)}
            className="w-full mt-2 py-2 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            ← Volver
          </button>
        </form>
      )}
    </div>
  )
}

// ─── Register panel ───────────────────────────────────────────────────────────
function RegisterPanel() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState<string | null>(null)

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFieldErrors({})
    setGlobalError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await registerUser(fd)
      if (!res.ok) {
        if (res.field) setFieldErrors({ [res.field]: res.error })
        else setGlobalError(res.error)
      } else {
        router.push("/dashboard")
      }
    })
  }

  return (
    <form onSubmit={handleRegister}>
      <Field
        label="Nombre de usuario"
        name="username"
        placeholder="@tuusuario"
        error={fieldErrors.username}
        hint="Solo letras minúsculas, números y _"
      />
      <Field
        label="Correo electrónico"
        name="email"
        type="email"
        placeholder="tu@correo.com"
        error={fieldErrors.email}
      />
      <Field
        label="Contraseña"
        name="password"
        type="password"
        placeholder="••••••••"
        error={fieldErrors.password}
        hint="Mínimo 8 caracteres"
      />
      {globalError && (
        <p className="text-xs text-[var(--color-text-danger)] mb-3">{globalError}</p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2.5 rounded-lg text-sm font-medium text-white bg-[#534AB7] hover:bg-[#3C3489] active:scale-[0.98] transition-all disabled:opacity-60"
      >
        {isPending ? "Creando cuenta…" : "Crear cuenta"}
      </button>

      <Divider label="o regístrate con" />

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm rounded-lg border border-[var(--color-border-secondary)] hover:bg-[var(--color-background-secondary)] transition-colors"
      >
        <GoogleIcon />
        Registrarse con Google
      </button>

      <p className="text-center mt-4 text-xs text-[var(--color-text-tertiary)] leading-relaxed">
        Al crear una cuenta aceptas los{" "}
        <Link href="/terms" className="text-[#534AB7] hover:underline">términos</Link>{" "}
        y la{" "}
        <Link href="/privacy" className="text-[#534AB7] hover:underline">política de privacidad</Link>.
      </p>
    </form>
  )
}

// ─── Magic link confirmation ──────────────────────────────────────────────────
function MagicSentScreen() {
  return (
    <div className="text-center py-6">
      <div className="w-12 h-12 rounded-full bg-[#EEEDFE] flex items-center justify-center mx-auto mb-4">
        <span style={{ fontSize: 22 }}>✦</span>
      </div>
      <p className="text-sm font-medium text-[var(--color-text-primary)] mb-2">
        Revisa tu correo
      </p>
      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
        Te enviamos un enlace para entrar. Puedes cerrar esta ventana.
      </p>
    </div>
  )
}

// ─── Contenido interno (necesita useSearchParams) ────────────────────────────
function AuthPageContent() {
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<"login" | "register">(
    searchParams.get("tab") === "register" ? "register" : "login"
  )
  const [magicSent, setMagicSent] = useState(false)

  return (
    <main className="min-h-screen bg-[var(--color-background-tertiary)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* card */}
        <div className="bg-[var(--color-background-primary)] border border-[var(--color-border-tertiary)] rounded-xl p-8 shadow-none">

          {/* logo */}
          <div className="flex items-baseline gap-2 mb-7">
            <div className="w-7 h-7 rounded-full border border-[#AFA9EC] flex items-center justify-center flex-shrink-0">
              <WoshiMark />
            </div>
            <span className="text-[18px] font-medium tracking-[-0.3px]">wo-shi</span>
            <span className="text-xs text-[var(--color-text-tertiary)]">tu grafo personal</span>
          </div>

          {/* tabs */}
          {!magicSent && (
            <div className="flex border-b border-[var(--color-border-tertiary)] mb-6">
              {(["login", "register"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`
                    flex-1 pb-2.5 text-sm transition-all border-b-2 -mb-px
                    ${tab === t
                      ? "text-[#534AB7] border-[#534AB7] font-medium"
                      : "text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text-primary)]"
                    }
                  `}
                >
                  {t === "login" ? "Entrar" : "Crear cuenta"}
                </button>
              ))}
            </div>
          )}

          {/* contenido */}
          {magicSent ? (
            <MagicSentScreen />
          ) : tab === "login" ? (
            <LoginPanel onMagicSent={() => setMagicSent(true)} />
          ) : (
            <RegisterPanel />
          )}
        </div>

        {/* pie */}
        <p className="text-center mt-5 text-xs text-[var(--color-text-tertiary)]">
          wo-shi · tu espacio privado
        </p>
      </div>
    </main>
  )
}

// ─── Página principal ────────────────────────────────────────────────────────
import { Suspense } from "react"

export default function AuthPage() {
  return (
    <Suspense>
      <AuthPageContent />
    </Suspense>
  )
}
