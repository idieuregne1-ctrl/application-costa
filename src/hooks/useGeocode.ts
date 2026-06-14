import { useState } from 'react'
import { apiGet, apiUrl } from '../lib/api'

/** Un candidat de géocodage (recherche manuelle de ville/adresse). */
export interface GeocodeResult {
  name: string
  lat: number
  lng: number
  type: string
}

/**
 * Recherche manuelle de lieu via le proxy /api/geocode (Nominatim).
 * Renvoie une liste de candidats que l'utilisateur choisit.
 */
export function useGeocode() {
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function search(query: string) {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await apiGet<{ results: GeocodeResult[] }>(apiUrl('/api/geocode', { q }))
      setResults(data.results)
      if (data.results.length === 0) setError('Aucun lieu trouvé pour cette recherche.')
    } catch {
      setError('La recherche a échoué. Réessaie.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  function clear() {
    setResults([])
    setError(null)
  }

  return { results, loading, error, search, clear }
}
