import type { AggregateResult, MergedPlace, Tier } from './types'

/**
 * Organisation des résultats scorés en paliers lisibles, et sélection curée.
 *
 *   🏆 Crème de la crème — le top, les valeurs sûres (souvent multi-sources).
 *   ⭐ Excellents choix   — le reste des très bons.
 *   💎 Pépites            — peu d'avis mais excellentes (hors des sentiers battus).
 *
 * Le but n'est pas de limiter à 3 lieux : on garde une sélection généreuse
 * (jusqu'à `maxCurated`) en coupant seulement le bas de gamme.
 */

export interface TierConfig {
  /** Note plancher : en-dessous, un lieu NOTÉ est coupé (bas de gamme). */
  minRatingFloor: number
  /** Une pépite : très bien notée mais peu d'avis. */
  gemMinRating: number
  gemMaxReviews: number
  /** Taille du palier « Crème de la crème ». */
  cremeSize: number
  /** Taille max de la sélection curée (toutes catégories de paliers confondues). */
  maxCurated: number
}

export const DEFAULT_TIERS: TierConfig = {
  minRatingFloor: 3.5,
  gemMinRating: 4.5,
  gemMaxReviews: 40,
  cremeSize: 5,
  maxCurated: 40,
}

function isPepite(p: MergedPlace, cfg: TierConfig): boolean {
  return (
    p.rating !== null &&
    p.reviewCount !== null &&
    p.rating >= cfg.gemMinRating &&
    p.reviewCount > 0 &&
    p.reviewCount <= cfg.gemMaxReviews
  )
}

/** Un lieu noté sous le plancher est coupé ; un lieu sans note est conservé. */
function passesFloor(p: MergedPlace, cfg: TierConfig): boolean {
  if (p.rating === null) return true
  return p.rating >= cfg.minRatingFloor
}

/**
 * Trie par score, coupe le bas de gamme, borne à `maxCurated`, puis répartit en paliers.
 * `places` doit déjà avoir `qualityScore` calculé.
 */
export function organizeIntoTiers(
  places: MergedPlace[],
  cfg: TierConfig = DEFAULT_TIERS,
): AggregateResult {
  const all = [...places].sort((a, b) => b.qualityScore - a.qualityScore)

  const curated = all.filter((p) => passesFloor(p, cfg)).slice(0, cfg.maxCurated)

  const pepites: MergedPlace[] = []
  const mainPool: MergedPlace[] = []
  for (const p of curated) {
    if (isPepite(p, cfg)) pepites.push(p)
    else mainPool.push(p)
  }

  const creme = mainPool.slice(0, cfg.cremeSize)
  const excellents = mainPool.slice(cfg.cremeSize)

  const tag = (list: MergedPlace[], tier: Tier) => list.forEach((p) => (p.tier = tier))
  tag(creme, 'creme')
  tag(excellents, 'excellent')
  tag(pepites, 'pepite')

  return { creme, excellents, pepites, curated, all }
}
