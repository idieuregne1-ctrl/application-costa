import type { PlaceSource } from '../adapters/types'
import type { Tier } from '../core/types'

/** Libellés et helpers d'affichage partagés. */

export const SOURCE_LABEL: Record<PlaceSource, string> = {
  google: 'Google',
  foursquare: 'Foursquare',
  osm: 'OSM',
  tripadvisor: 'TripAdvisor',
}

export const TIER_BADGE: Record<Tier, { label: string; short: string; cls: string }> = {
  creme: {
    label: 'Crème de la crème',
    short: 'Crème de la crème',
    // Pastille claire sur la photo : fond ivoire, texte or.
    cls: 'bg-white/90 text-accent',
  },
  excellent: {
    label: 'Excellent choix',
    short: 'Excellent',
    cls: 'bg-white/90 text-ink',
  },
  pepite: {
    label: 'Pépite',
    short: 'Pépite',
    cls: 'bg-white/90 text-stone-600',
  },
}

/** Couleur de pin de carte par palier (et défaut) — tons sobres. */
export const TIER_COLOR: Record<Tier | 'default', string> = {
  creme: '#a6772e',
  excellent: '#44403c',
  pepite: '#8a7a64',
  default: '#a8a29e',
}

export function formatDistance(m: number | null): string {
  if (m === null) return ''
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`
}

export function priceText(level: number | null): string {
  return level ? '€'.repeat(level) : ''
}

/** Lien d'itinéraire universel (ouvre Google/Apple Maps selon l'appareil). */
export function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}
