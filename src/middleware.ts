// src/middleware.ts
// Protege todas las rutas excepto /auth y assets públicos.
// Cualquier visitante no autenticado es redirigido a /auth.

import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthenticated = !!req.auth

  const publicPaths = ["/auth", "/api/auth", "/terms", "/privacy"]
  const isPublic = publicPaths.some((p) => pathname.startsWith(p))

  if (!isAuthenticated && !isPublic) {
    const loginUrl = new URL("/auth", req.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // redirigir a /dashboard si ya está autenticado y va a /auth
  if (isAuthenticated && pathname === "/auth") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
