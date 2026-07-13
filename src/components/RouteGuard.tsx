"use client"

// Feature-flag de secciones top-level vía routes de once-ui.config.ts.
// El auth real (quién puede entrar) ya lo resuelve src/proxy.ts (Clerk,
// server-side) — esto solo apaga/prende secciones completas sin tocar código.

import { usePathname, notFound } from "next/navigation"
import { routes } from "@/resources"

const alwaysAllowed = ["/", "/sign-in", "/sign-up", "/sso-callback", "/api"]

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  function isEnabled(): boolean {
    if (!pathname) return false
    if (alwaysAllowed.some(p => pathname === p)) return true

    const topLevel = `/${pathname.split("/")[1]}` as keyof typeof routes
    if (topLevel in routes) return routes[topLevel]

    return true
  }

  if (!isEnabled()) notFound()

  return <>{children}</>
}
