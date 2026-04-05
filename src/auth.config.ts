// src/auth.config.ts
// Configuración de Auth.js compatible con Edge runtime.
// Usada por el middleware (que corre en Edge).
// No importa Prisma ni bcrypt — solo lógica de routing/callbacks.

import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/auth",
    error:  "/auth?error=true",
    verifyRequest: "/auth?verify=true",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isAuthenticated = !!auth?.user
      const pathname = nextUrl.pathname

      const publicPaths = ["/auth", "/api/auth", "/terms", "/privacy"]
      const isPublic = publicPaths.some(p => pathname.startsWith(p))

      if (!isAuthenticated && !isPublic) return false  // → redirige a signIn
      if (isAuthenticated && pathname === "/auth") {
        return Response.redirect(new URL("/dashboard", nextUrl))
      }
      return true
    },
  },
  providers: [],  // los providers reales están en auth.ts (Node.js only)
}
