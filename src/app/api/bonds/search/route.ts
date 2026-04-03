// src/app/api/bonds/search/route.ts
import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { searchBondsAndUsers } from "@/lib/actions/entry.actions"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q    = searchParams.get("q") ?? ""
  const type = searchParams.get("type") ?? undefined

  if (q.length < 1) return NextResponse.json({ results: [] })

  const results = await searchBondsAndUsers(session.user.id, q, type)
  return NextResponse.json({ results })
}
