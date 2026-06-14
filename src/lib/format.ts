import type { PlaceSource } from '../adapters/types'
import type { Tier } from '../core/types'

/** Libellés et helpers d'affichage partagés. */

export const SOURCE_LABEL: Record<PlaceSource, string> = {
  google: 'Google',
  foursquare: 'Foursquare',
  osm: 'OSM',
  tripadvisor: 'TripAdvisor',
}

export const TIER_BADGE: Record<Tier, { emoji: string; label: string; cls: string; ring: string }> = {
  creme: {
    emoji: '🏆',
    label: 'Crème de la crème',
    cls: 'bg-creme-500/20 text-creme-300',
    ring: 'ring-creme-500',
  },
  excellent: {
    emoji: '⭐',
    label: 'Excellent choix',
    cls: 'bg-sky-500/20 text-sky-200',
    ring: 'ring-sky-500',
  },
  pepite: {
    emoji: '💎',
    label: 'Pépite',
    cls: 'bg-violet-500/20 text-violet-200',
    ring: 'ring-violet-500',
  },
}

/** Couleur de pin de carte par palier (et défaut). */
export const TIER_COLOR: Record<Tier | 'default', string> = {
  creme: '#f59e0b',
  excellent: '#38bdf8',
  pepite: '#a78bfa',
  default: '#94a3b8',
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
