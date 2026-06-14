import { DEFAULT_FILTERS, SUBTYPE, type Filters } from '../core'
import type { PlaceCategory } from '../adapters/types'

/**
 * Presets contextuels : un tap applique un combo catégorie + filtres + tri.
 * Les presets plein air (rando/pêche) sont marqués « weatherAware » : on affiche
 * alors un indice météo du jour au-dessus des résultats.
 */
export interface Preset {
  id: string
  label: string
  emoji: string
  category: PlaceCategory
  /** Filtres appliqués (fusionnés sur les défauts → table rase propre). */
  filters: Partial<Filters>
  /** Met en avant l'indice météo (rando/pêche). */
  weatherAware?: boolean
}

export const PRESETS: Preset[] = [
  {
    id: 'souper-soir',
    label: 'Souper ce soir',
    emoji: '🍽️',
    category: 'restaurant',
    filters: { openNow: true, minRating: 4.0, radiusM: 3000, sortBy: 'quality' },
  },
  {
    id: 'sur-le-pouce',
    label: 'Sur le pouce',
    emoji: '🥡',
    category: 'restaurant',
    filters: { openNow: true, radiusM: 1000, sortBy: 'distance' },
  },
  {
    id: 'rando-matin',
    label: 'Rando du matin',
    emoji: '🥾',
    category: 'hike',
    filters: { radiusM: 15000, sortBy: 'distance' },
    weatherAware: true,
  },
  {
    id: 'sortie-peche',
    label: 'Sortie pêche',
    emoji: '🎣',
    category: 'fishing',
    filters: { radiusM: 15000, sortBy: 'distance' },
    weatherAware: true,
  },
  {
    id: 'journee-culture',
    label: 'Journée culture',
    emoji: '🏛️',
    category: 'culture',
    filters: {
      subtypes: [SUBTYPE.market, SUBTYPE.historic, SUBTYPE.museum],
      radiusM: 5000,
      sortBy: 'quality',
    },
  },
]

/** Filtres complets d'un preset (combo appliqué sur les défauts). */
export function presetFilters(preset: Preset): Filters {
  return { ...DEFAULT_FILTERS, ...preset.filters }
}
