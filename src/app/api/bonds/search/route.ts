// src/app/api/bonds/search/route.ts
import { requireDbUser } from "@/lib/user"
import { NextResponse } from "next/server"
import { searchBondsAndUsers } from "@/lib/actions/entry.actions"

export async function GET(req: Request) {
  const userId = await requireDbUser()
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q    = searchParams.get("q") ?? ""
  const type = searchParams.get("type") ?? undefined

  if (q.length < 1) return NextResponse.json({ results: [] })

  const results = await searchBondsAndUsers(userId, q, type)
  return NextResponse.json({ results })
}
