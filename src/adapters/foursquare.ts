import { apiGet, apiUrl } from '../lib/api'
import type { Place, PlaceProvider, SearchParams } from './types'

/**
 * Adapter Foursquare Places (v3).
 * Appelle le proxy `/api/foursquare/search` et normalise vers `Place`.
 * Note : la note Foursquare est sur 10 → ramenée sur 5.
 */

interface RawFsqPlace {
  fsq_id: string
  name: string
  geocodes?: { main?: { latitude: number; longitude: number } }
  location?: { formatted_address?: string; locality?: string }
  categories?: { name: string }[]
  rating?: number // 0-10
  stats?: { total_ratings?: number }
  price?: number // 1-4
  photos?: { prefix: string; suffix: string }[]
  hours?: { open_now?: boolean }
  website?: string
}

function photoUrl(p: { prefix: string; suffix: string }): string {
  // Les URLs photo Foursquare sont des CDN publics (pas de clé) → usage direct.
  return `${p.prefix}400x300${p.suffix}`
}

function normalize(raw: RawFsqPlace, category: SearchParams['category']): Place | null {
  const loc = raw.geocodes?.main
  if (!loc) return null
  return {
    id: `foursquare:${raw.fsq_id}`,
    source: 'foursquare',
    name: raw.name,
    category,
    subtype: raw.categories?.[0]?.name,
    lat: loc.latitude,
    lng: loc.longitude,
    rating: raw.rating != null ? Math.round((raw.rating / 2) * 10) / 10 : null,
    reviewCount: raw.stats?.total_ratings ?? null,
    priceLevel: raw.price ?? null,
    photos: (raw.photos ?? []).slice(0, 5).map(photoUrl),
    address: raw.location?.formatted_address ?? raw.location?.locality ?? '',
    openNow: raw.hours?.open_now ?? null,
    tags: (raw.categories ?? []).map((c) => c.name),
    sourceUrl: raw.website ?? `https://foursquare.com/v/${raw.fsq_id}`,
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
