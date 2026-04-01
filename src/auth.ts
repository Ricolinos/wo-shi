// src/auth.ts
// Auth.js v5 — Google + Credentials + Magic Link (Resend)

import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import Resend from "next-auth/providers/resend"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth",
    error: "/auth?error=true",
    verifyRequest: "/auth?verify=true",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    Resend({
      apiKey: process.env.RESEND_API_KEY!,
      from: "wo-shi <noreply@wo-shi.app>",
    }),

    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z.object({
          email: z.string().email(),
          password: z.string().min(8),
        }).safeParse(credentials)

        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          include: { accounts: true },
        })

        if (!user) return null

        // usuarios creados con OAuth no tienen contraseña local
        const credAccount = user.accounts.find(a => a.provider === "credentials")
        if (!credAccount?.access_token) return null

        const valid = await bcrypt.compare(parsed.data.password, credAccount.access_token)
        if (!valid) return null

        return { id: user.id, email: user.email, name: user.name, image: user.avatar }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        // cargar username desde DB
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
        token.username = dbUser?.username ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.username = token.username as string | null
      }
      return session
    },
  },
})
