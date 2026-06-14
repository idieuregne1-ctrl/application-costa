import { apiGet, apiUrl, apiAssetUrl } from '../lib/api'
import type { Place, PlaceProvider, SearchParams } from './types'

/**
 * Adapter Google Places (New) v1.
 * Appelle le proxy `/api/google/search` (la clé reste côté serveur) et normalise
 * la réponse brute de l'API vers le type `Place`.
 */

/** Forme brute (partielle) d'un lieu renvoyé par Places API (New). */
interface RawGooglePlace {
  id: string
  displayName?: { text?: string }
  primaryTypeDisplayName?: { text?: string }
  location?: { latitude: number; longitude: number }
  rating?: number
  userRatingCount?: number
  priceLevel?: string
  photos?: { name: string }[]
  formattedAddress?: string
  currentOpeningHours?: { openNow?: boolean }
  types?: string[]
  googleMapsUri?: string
}

/** Mappe l'enum de prix Google (PRICE_LEVEL_*) vers 1-4, ou null. */
function mapPriceLevel(level: string | undefined): number | null {
  switch (level) {
    case 'PRICE_LEVEL_INEXPENSIVE':
      return 1
    case 'PRICE_LEVEL_MODERATE':
      return 2
    case 'PRICE_LEVEL_EXPENSIVE':
      return 3
    case 'PRICE_LEVEL_VERY_EXPENSIVE':
      return 4
    default:
      return null
  }
}

/** Construit l'URL proxy ABSOLUE d'une photo (jamais l'URL Google directe).
 *  Absolue pour fonctionner en prod où le backend est sur un autre domaine. */
function photoUrl(name: string, maxw = 600): string {
  return apiAssetUrl('/api/google/photo', { ref: name, maxw })
}

function normalize(raw: RawGooglePlace, category: SearchParams['category']): Place | null {
  if (!raw.location) return null
  return {
    id: `google:${raw.id}`,
    source: 'google',
    name: raw.displayName?.text ?? 'Lieu sans nom',
    category,
    subtype: raw.primaryTypeDisplayName?.text,
    lat: raw.location.latitude,
    lng: raw.location.longitude,
    rating: raw.rating ?? null,
    reviewCount: raw.userRatingCount ?? null,
    priceLevel: mapPriceLevel(raw.priceLevel),
    photos: (raw.photos ?? []).slice(0, 5).map((p) => photoUrl(p.name)),
    address: raw.formattedAddress ?? '',
    openNow: raw.currentOpeningHours?.openNow ?? null,
    tags: raw.types ?? [],
    sourceUrl: raw.googleMapsUri ?? `https://www.google.com/maps/search/?api=1&query=${raw.location.latitude},${raw.location.longitude}`,
  }
}

/** Forme (partielle) des détails Google, dont les avis. */
interface RawGoogleDetails {
  reviews?: { text?: { text?: string }; originalText?: { text?: string }; rating?: number }[]
}

/**
 * Récupère les textes d'avis d'un lieu Google via Place Details (proxy).
 * Appelé seulement à l'ouverture d'une fiche (coût maîtrisé). `placeId` est l'id
 * Google brut (sans le préfixe « google: »).
 */
export async function fetchGoogleReviews(placeId: string, signal?: AbortSignal): Promise<string[]> {
  const data = await apiGet<RawGoogleDetails>(
    `/api/google/details/${encodeURIComponent(placeId)}`,
    signal,
  )
  return (data.reviews ?? [])
    .map((r) => r.text?.text ?? r.originalText?.text ?? '')
    .map((t) => t.trim())
    .filter(Boolean)
}

export const googleAdapter: PlaceProvider = {
  source: 'google',
  async search(params: SearchParams): Promise<Place[]> {
    const url = apiUrl('/api/google/search', {
      lat: params.lat,
      lng: params.lng,
      radius: params.radiusM,
      category: params.category,
      query: params.query,
    })
    const data = await apiGet<{ places?: RawGooglePlace[] }>(url, params.signal)
    return (data.places ?? [])
      .map((p) => normalize(p, params.category))
      .filter((p): p is Place => p !== null)
  },
}
