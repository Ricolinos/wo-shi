// src/middleware.ts
// Protege todas las rutas excepto /auth y assets públicos.
// Usa authConfig (Edge-safe) — sin Prisma ni bcrypt.

import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"

export default NextAuth(authConfig).auth

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
