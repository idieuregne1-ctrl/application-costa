import type { MergedPlace } from '../core'
import type { PlaceCategory } from '../adapters/types'

/**
 * Modèle léger du planificateur de journée.
 * Un « arrêt » ne garde que le minimum nécessaire pour l'itinéraire et le partage
 * (pas tout le `MergedPlace`) — pour des liens de partage compacts.
 */
export interface PlanStop {
  id: string
  name: string
  lat: number
  lng: number
  category: PlaceCategory
  subtype?: string
  address?: string
}

/** Durée suggérée par arrêt (minutes), selon la catégorie. */
const SUGGESTED_MIN: Record<PlaceCategory, number> = {
  restaurant: 90,
  activity: 90,
  beach: 120,
  hike: 180,
  fishing: 120,
  culture: 60,
}

export function suggestedDurationMin(category: PlaceCategory): number {
  return SUGGESTED_MIN[category] ?? 90
}

export function planStopFrom(place: MergedPlace): PlanStop {
  return {
    id: place.id,
    name: place.name,
    lat: place.lat,
    lng: place.lng,
    category: place.category,
    subtype: place.subtype,
    address: place.address || undefined,
  }
}

/** Coordonnées au format OSRM « lng,lat;lng,lat;… ». */
export function osrmCoords(stops: PlanStop[]): string {
  return stops.map((s) => `${s.lng},${s.lat}`).join(';')
}

/** Itinéraire complet ouvrable dans Google/Apple Maps. */
export function googleMapsDirUrl(stops: PlanStop[]): string {
  const path = stops.map((s) => `${s.lat},${s.lng}`).join('/')
  return `https://www.google.com/maps/dir/${path}`
}

/** Formate une durée en secondes → « 8 min » / « 1 h 25 ». */
export function formatDuration(seconds: number): string {
  const min = Math.round(seconds / 60)
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h} h` : `${h} h ${m}`
}

// ── Partage par lien (encodage de l'itinéraire dans l'URL) ───────────────────

function toBase64Url(str: string): string {
  const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(str)))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(b64url: string): string {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/** Encode un itinéraire en fragment d'URL partageable (#plan=…). */
export function encodePlan(stops: PlanStop[]): string {
  return toBase64Url(JSON.stringify({ v: 1, stops }))
}

/** Décode un itinéraire depuis le fragment d'URL ; null si invalide. */
export function decodePlan(encoded: string): PlanStop[] | null {
  try {
    const parsed = JSON.parse(fromBase64Url(encoded)) as { v?: number; stops?: PlanStop[] }
    if (!Array.isArray(parsed.stops)) return null
    // Validation minimale des champs requis.
    return parsed.stops.filter(
      (s) => s && typeof s.id === 'string' && typeof s.lat === 'number' && typeof s.lng === 'number',
    )
  } catch {
    return null
  }
}

/** Construit le lien de partage complet à partir de l'URL courante. */
export function buildShareUrl(stops: PlanStop[]): string {
  const base = `${window.location.origin}${window.location.pathname}`
  return `${base}#plan=${encodePlan(stops)}`
}
