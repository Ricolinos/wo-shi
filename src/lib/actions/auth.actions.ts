// src/lib/actions/auth.actions.ts
"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { signIn } from "@/auth"

const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(20, "Máximo 20 caracteres")
    .regex(/^[a-z0-9_]+$/, "Solo letras minúsculas, números y guión bajo"),
  email: z.string().email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
})

export type RegisterResult =
  | { ok: true }
  | { ok: false; error: string; field?: string }

export async function registerUser(
  formData: FormData
): Promise<RegisterResult> {
  const raw = {
    username: formData.get("username") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { ok: false, error: first.message, field: String(first.path[0]) }
  }

  const { username, email, password } = parsed.data

  // verificar duplicados
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  })
  if (existing) {
    if (existing.email === email)
      return { ok: false, error: "Este correo ya está registrado", field: "email" }
    return { ok: false, error: "Este usuario ya existe", field: "username" }
  }

  const hash = await bcrypt.hash(password, 12)

  // crear usuario + account de credentials
  await prisma.user.create({
    data: {
      username,
      email,
      name: username,
      accounts: {
        create: {
          type: "credentials",
          provider: "credentials",
          providerAccountId: email,
          access_token: hash, // guardamos el hash en access_token
        },
      },
      privacyConfig: { create: {} },
      feedConfig: { create: {} },
    },
  })

  // auto-login tras registro
  await signIn("credentials", { email, password, redirect: false })

  return { ok: true }
}
