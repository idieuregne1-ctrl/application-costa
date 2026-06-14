import { apiGet, apiUrl } from '../lib/api'
import type { Place, PlaceProvider, SearchParams } from './types'

/**
 * Adapter Foursquare Places (nouvelle API post-migration 2025).
 * La note Foursquare est sur 10 → ramenée sur 5.
 *
 * Normalisation DÉFENSIVE : le schéma a évolué entre l'ancienne v3 et la nouvelle
 * API (ex. `fsq_id` → `fsq_place_id`, coordonnées passées en haut niveau). On lit
 * donc les champs avec des replis pour fonctionner quelle que soit la variante.
 */

interface RawFsqPlace {
  // Id : nouveau (fsq_place_id) ou ancien (fsq_id)
  fsq_place_id?: string
  fsq_id?: string
  name?: string
  // Coordonnées : nouveau (haut niveau) ou ancien (geocodes.main)
  latitude?: number
  longitude?: number
  geocodes?: { main?: { latitude: number; longitude: number } }
  location?: { formatted_address?: string; locality?: string; address?: string }
  categories?: { name?: string }[]
  rating?: number // 0-10
  stats?: { total_ratings?: number }
  price?: number // 1-4
  photos?: { prefix: string; suffix: string }[]
  hours?: { open_now?: boolean }
  website?: string
}

function pickCoords(raw: RawFsqPlace): { lat: number; lng: number } | null {
  if (typeof raw.latitude === 'number' && typeof raw.longitude === 'number') {
    return { lat: raw.latitude, lng: raw.longitude }
  }
  const main = raw.geocodes?.main
  if (main) return { lat: main.latitude, lng: main.longitude }
  return null
}

function photoUrl(p: { prefix: string; suffix: string }): string {
  // URLs CDN publiques Foursquare (pas de clé) → usage direct.
  return `${p.prefix}400x300${p.suffix}`
}

function normalize(raw: RawFsqPlace, category: SearchParams['category']): Place | null {
  const id = raw.fsq_place_id ?? raw.fsq_id
  const coords = pickCoords(raw)
  if (!id || !coords || !raw.name) return null
  return {
    id: `foursquare:${id}`,
    source: 'foursquare',
    name: raw.name,
    category,
    subtype: raw.categories?.[0]?.name,
    lat: coords.lat,
    lng: coords.lng,
    rating: raw.rating != null ? Math.round((raw.rating / 2) * 10) / 10 : null,
    reviewCount: raw.stats?.total_ratings ?? null,
    priceLevel: raw.price ?? null,
    photos: (raw.photos ?? []).slice(0, 5).map(photoUrl),
    address: raw.location?.formatted_address ?? raw.location?.address ?? raw.location?.locality ?? '',
    openNow: raw.hours?.open_now ?? null,
    tags: (raw.categories ?? []).map((c) => c.name).filter((n): n is string => Boolean(n)),
    sourceUrl: raw.website ?? `https://foursquare.com/v/${id}`,
  }
}

export const foursquareAdapter: PlaceProvider = {
  source: 'foursquare',
  async search(params: SearchParams): Promise<Place[]> {
    const url = apiUrl('/api/foursquare/search', {
      lat: params.lat,
      lng: params.lng,
      radius: params.radiusM,
      category: params.category,
      query: params.query,
    })
    const data = await apiGet<{ results?: RawFsqPlace[] }>(url, params.signal)
    return (data.results ?? [])
      .map((p) => normalize(p, params.category))
      .filter((p): p is Place => p !== null)
  },
}
