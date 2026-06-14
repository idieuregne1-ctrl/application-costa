import type { Place, PlaceSource } from '../adapters/types'

/** Palier d'affichage d'un lieu. */
export type Tier = 'creme' | 'excellent' | 'pepite'

/**
 * Lieu après agrégation : fusion de plusieurs sources + score qualité + palier.
 * Étend `Place` ; les champs rating/reviewCount portent les valeurs FUSIONNÉES.
 */
export interface MergedPlace extends Place {
  /** Toutes les sources qui ont contribué (pour le badge de consensus). */
  sources: PlaceSource[]
  /** Ids originaux des lieux fusionnés (traçabilité). */
  contributingIds: string[]
  /** Note par source (pour info / debug). */
  perSourceRatings: { source: PlaceSource; rating: number | null; reviewCount: number | null }[]
  /** Score qualité 0-1 calculé par l'algo. */
  qualityScore: number
  /** Distance au point de recherche, en mètres. */
  distanceM: number | null
  /** Palier assigné (rempli au tiering). */
  tier?: Tier
}

/** Regroupement final par paliers + liste complète triée. */
export interface AggregateResult {
  creme: MergedPlace[]
  excellents: MergedPlace[]
  pepites: MergedPlace[]
  /** Sélection curée (creme + excellents + pepites), bornée à maxCurated. */
  curated: MergedPlace[]
  /** Liste complète triée (pour le toggle « Voir plus de résultats »). */
  all: MergedPlace[]
}
