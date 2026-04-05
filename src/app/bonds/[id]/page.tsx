// src/app/bonds/[id]/page.tsx
// Server Component de /bonds/[id]. Verifica auth, carga el bond y sus entradas.

import { notFound, redirect } from "next/navigation"
import { Suspense }            from "react"
import { auth }                from "@/auth"
import { getBondDetail, getBondEntries } from "@/lib/actions/bonds.actions"
import { AppSidebar }          from "@/components/layout/AppSidebar"
import { BondDetailPage }      from "@/components/bonds/BondDetailPage"

interface Props {
  params:      Promise<{ id: string }>
  searchParams: Promise<Record<string, string>>
}

export default async function BondDetailRoute({ params, searchParams }: Props) {
  const session = await auth()
  if (!session?.user) redirect("/auth")

  const { id } = await params
  const sp      = await searchParams

  const [bond, entries] = await Promise.all([
    getBondDetail(id),
    getBondEntries(id),
  ])

  if (!bond) notFound()

  // URL de retorno a /bonds preservando searchParams previos (si vienen en el referer)
  const bondsHref = `/bonds${sp.from ? `?${sp.from}` : ""}`

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0eff8]">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        <Suspense>
          <BondDetailPage
            bond={bond}
            entries={entries}
            bondsHref={bondsHref}
          />
        </Suspense>
      </div>
    </div>
  )
}
