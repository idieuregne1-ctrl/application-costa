import type { MergedPlace } from './types'
import type { TrailDifficulty } from '../adapters/types'

/**
 * Filtres et tri appliqués CÔTÉ CLIENT, après agrégation/scoring.
 * Avantage : changer un filtre prix/note/ouvert/tri ne déclenche AUCUN appel API
 * (le scoring tourne déjà sur les données en cache) — essentiel aussi pour
 * l'usage hors ligne (Phase 12).
 *
 * Le rayon, lui, fait partie de la requête (il change l'appel aux sources) et
 * vit donc dans la clé de cache de `usePlaces`, pas ici.
 */

export type SortBy = 'quality' | 'distance' | 'rating' | 'reviews'

export interface Filters {
  /** Rayon de recherche en mètres (500 → 25000). Pilote l'appel API. */
  radiusM: number
  /** Niveaux de prix retenus (sous-ensemble de [1,2,3,4]) ; vide = tous. */
  priceLevels: number[]
  /** Note minimale (null = pas de minimum). */
  minRating: number | null
  /** N'afficher que les lieux ouverts maintenant. */
  openNow: boolean
  /** Critère de tri. */
  sortBy: SortBy
  /** Filtre par sous-type (générique par catégorie : sommet, marché, musée…). Vide = tous. */
  subtypes: string[]
  /** Difficulté de randonnée retenue (vide = toutes). */
  difficulties: TrailDifficulty[]
}

export const DEFAULT_FILTERS: Filters = {
  radiusM: 5000,
  priceLevels: [],
  minRating: null,
  openNow: false,
  sortBy: 'quality',
  subtypes: [],
  difficulties: [],
}

/** Filtres « client » uniquement (hors rayon). Compte des filtres actifs pour le badge. */
export function activeFilterCount(f: Filters): number {
  let n = 0
  if (f.priceLevels.length > 0) n++
  if (f.minRating !== null) n++
  if (f.openNow) n++
  if (f.radiusM !== DEFAULT_FILTERS.radiusM) n++
  if (f.sortBy !== DEFAULT_FILTERS.sortBy) n++
  if (f.subtypes.length > 0) n++
  if (f.difficulties.length > 0) n++
  return n
}

/** Compare deux ensembles (ordre indifférent). */
function sameSet<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every((x) => set.has(x))
}

/** Égalité de deux jeux de filtres (sert à détecter le preset actif). */
export function filtersEqual(a: Filters, b: Filters): boolean {
  return (
    a.radiusM === b.radiusM &&
    a.minRating === b.minRating &&
    a.openNow === b.openNow &&
    a.sortBy === b.sortBy &&
    sameSet(a.priceLevels, b.priceLevels) &&
    sameSet(a.subtypes, b.subtypes) &&
    sameSet(a.difficulties, b.difficulties)
  )
}

/** Applique prix / note / ouvert (le rayon est déjà géré à la requête). */
export function filterPlaces(places: MergedPlace[], f: Filters): MergedPlace[] {
  return places.filter((p) => {
    if (f.priceLevels.length > 0 && p.priceLevel !== null && !f.priceLevels.includes(p.priceLevel)) {
      return false
    }
    if (f.minRating !== null && (p.rating === null || p.rating < f.minRating)) return false
    if (f.openNow && p.openNow !== true) return false
    if (f.subtypes.length > 0 && (p.subtype === undefined || !f.subtypes.includes(p.subtype))) {
      return false
    }
    if (f.difficulties.length > 0 && (!p.trail?.difficulty || !f.difficulties.includes(p.trail.difficulty))) {
      return false
    }
    return true
  })
}

/** Comparateur plaçant les valeurs nulles en dernier. */
function byDescNullsLast(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return b - a
}

export function sortPlaces(places: MergedPlace[], sortBy: SortBy): MergedPlace[] {
  const arr = [...places]
  switch (sortBy) {
    case 'distance':
      return arr.sort((a, b) => {
        if (a.distanceM === null && b.distanceM === null) return 0
        if (a.distanceM === null) return 1
        if (b.distanceM === null) return -1
        return a.distanceM - b.distanceM
      })
    case 'rating':
      return arr.sort((a, b) => byDescNullsLast(a.rating, b.rating))
    case 'reviews':
      return arr.sort((a, b) => byDescNullsLast(a.reviewCount, b.reviewCount))
    case 'quality':
    default:
      return arr.sort((a, b) => b.qualityScore - a.qualityScore)
  }
}
