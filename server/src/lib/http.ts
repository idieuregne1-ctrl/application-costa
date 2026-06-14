/**
 * Helpers de requêtes sortantes pour le proxy.
 * Timeout via AbortController + messages d'erreur exploitables côté client.
 */

export class UpstreamError extends Error {
  constructor(
    public readonly status: number,
    public readonly source: string,
    message: string,
  ) {
    super(message)
    this.name = 'UpstreamError'
  }
}

interface FetchOptions {
  method?: string
  headers?: Record<string, string>
  body?: string
  /** Timeout en ms (défaut 15s). */
  timeoutMs?: number
  /** Nom de la source, pour les messages d'erreur. */
  source: string
}

/** Effectue un fetch JSON avec timeout et remontée d'erreur typée. */
export async function fetchJson<T = unknown>(url: string, opts: FetchOptions): Promise<T> {
  const { method = 'GET', headers, body, timeoutMs = 15_000, source } = opts
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { method, headers, body, signal: controller.signal })
    const text = await res.text()
    if (!res.ok) {
      throw new UpstreamError(
        res.status,
        source,
        `Réponse ${res.status} de ${source}: ${text.slice(0, 300)}`,
      )
    }
    return text ? (JSON.parse(text) as T) : ({} as T)
  } catch (err) {
    if (err instanceof UpstreamError) throw err
    if (err instanceof Error && err.name === 'AbortError') {
      throw new UpstreamError(504, source, `Timeout (${timeoutMs}ms) en interrogeant ${source}`)
    }
    throw new UpstreamError(502, source, `Échec de la requête vers ${source}: ${String(err)}`)
  } finally {
    clearTimeout(timer)
  }
}
