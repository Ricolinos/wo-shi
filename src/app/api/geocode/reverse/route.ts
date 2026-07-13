// Geocodificación inversa (lat/lon -> nombre de localidad) para el botón de
// ubicación de /journal/new. No hay API key de mapas configurada en el
// proyecto, así que se usa Nominatim (OpenStreetMap), gratuito y sin
// credenciales para volumen bajo. Su política de uso pide un User-Agent
// identificable y desaconseja pegarle directo desde el navegador en
// producción — por eso este route handler intermedia la llamada desde el
// servidor en vez de que el cliente golpee Nominatim directamente.
import { requireDbUser } from "@/lib/user"
import { NextResponse } from "next/server"

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"
const USER_AGENT = "wo-shi/1.0 (personal journal app; contact: ricardo@ricolinos.com)"

interface NominatimAddress {
  city?: string
  town?: string
  village?: string
  county?: string
}

interface NominatimResponse {
  address?: NominatimAddress
  display_name?: string
}

export async function GET(req: Request) {
  const userId = await requireDbUser()
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const lat = searchParams.get("lat")
  const lon = searchParams.get("lon")
  if (!lat || !lon) return NextResponse.json({ error: "Faltan coordenadas" }, { status: 400 })

  try {
    const url = `${NOMINATIM_URL}?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=14&addressdetails=1`
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } })
    if (!res.ok) return NextResponse.json({ error: "Geocoding falló" }, { status: 502 })

    const data: NominatimResponse = await res.json()
    const addr = data.address ?? {}
    const place =
      addr.city ?? addr.town ?? addr.village ?? addr.county ??
      (data.display_name ? data.display_name.split(",").slice(0, 2).join(",").trim() : undefined)

    if (!place) return NextResponse.json({ error: "Sin resultado" }, { status: 404 })
    return NextResponse.json({ place })
  } catch {
    return NextResponse.json({ error: "Geocoding falló" }, { status: 502 })
  }
}
