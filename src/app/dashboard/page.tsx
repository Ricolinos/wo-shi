import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/auth")

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-2">Hola, {session.user.username ?? session.user.name}</h1>
      <p className="text-gray-500 mb-8">¿Qué quieres registrar hoy?</p>
      <Link
        href="/journal/new"
        className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
      >
        Nueva entrada
      </Link>
    </main>
  )
}
