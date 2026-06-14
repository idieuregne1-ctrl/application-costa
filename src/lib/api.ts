/**
 * Client HTTP minimal vers le backend proxy (/api).
 * En dev, Vite proxie /api → :8787. En prod, on peut surcharger via VITE_API_BASE_URL.
 */

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export interface ApiError extends Error {
  status: number
  payload?: unknown
}

/** GET JSON depuis le backend, avec remontée d'erreur structurée. */
export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { signal })
  const text = await res.text()
  const payload = text ? safeJson(text) : undefined
  if (!res.ok) {
    const err = new Error(
      (payload as { message?: string })?.message ?? `Erreur ${res.status}`,
    ) as ApiError
    err.status = res.status
    err.payload = payload
    throw err
  }
  return payload as T
}

/** POST JSON vers le backend, avec remontée d'erreur structurée. */
export async function apiPost<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  const text = await res.text()
  const payload = text ? safeJson(text) : undefined
  if (!res.ok) {
    const err = new Error(
      (payload as { message?: string })?.message ?? `Erreur ${res.status}`,
    ) as ApiError
    err.status = res.status
    err.payload = payload
    throw err
  }
  return payload as T
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

/** Construit une URL /api avec query params (ignore les valeurs nullish). */
export function apiUrl(path: string, params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') search.set(k, String(v))
  }
  const qs = search.toString()
  return qs ? `${path}?${qs}` : path
}

/**
 * URL ABSOLUE vers une ressource du backend (inclut VITE_API_BASE_URL).
 * Indispensable pour les `<img src>` (photos proxy) : contrairement à `fetch`
 * qui passe par `apiGet`/`apiPost` (lesquels préfixent déjà BASE), une balise
 * img utilise l'URL telle quelle — une URL relative pointerait sur le domaine du
 * frontend, pas sur le backend.
 */
export function apiAssetUrl(
  path: string,
  params: Record<string, string | number | undefined>,
): string {
  return `${BASE}${apiUrl(path, params)}`
}
