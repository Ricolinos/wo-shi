// src/components/auth/redirectUrl.ts
// Resuelve a dónde mandar al usuario tras sign-in/sign-up completo.
// Clerk (via auth.protect() en src/proxy.ts) agrega `?redirect_url=` a la URL
// de /sign-in cuando redirige a un visitante no autenticado que intentaba ver
// otra página — este helper lo respeta en vez de mandar siempre a /feed.

const DEFAULT_REDIRECT = "/feed"

/**
 * Devuelve un destino de redirect seguro tras autenticarse.
 * Solo acepta paths relativos internos (nunca un origin externo) para
 * evitar un open redirect vía `redirect_url`.
 */
export function getSafeRedirect(
  searchParams: URLSearchParams | null,
  fallback: string = DEFAULT_REDIRECT
): string {
  const raw = searchParams?.get("redirect_url")
  if (!raw) return fallback
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) return fallback
  return raw
}
