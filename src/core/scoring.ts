import type { MergedPlace } from './types'

/**
 * Algorithme « crème de la crème ».
 *
 * Idée : une note seule ment (un 4.9 sur 12 avis ≠ un 4.7 sur 3000). On calcule
 * donc une borne inférieure de Wilson sur la proportion d'avis « positifs »,
 * qui pénalise mécaniquement les petits échantillons. On module ensuite par :
 *   • le consensus multi-sources (le différenciateur de l'app),
 *   • une légère pénalité de distance (proche = mieux, sans dominer),
 *   • un petit bonus « ouvert maintenant » quand la catégorie s'y prête.
 */

export interface ScoringConfig {
  /** Score z pour la borne de Wilson (1.96 ≈ 95 %). */
  wilsonZ: number
  /** Moyenne a priori (sur 5) pour les lieux sans note → score neutre. */
  neutralBase: number
  /** Bonus multiplicatif par source notée supplémentaire (consensus). */
  consensusBonusPerSource: number
  /** Plafond du multiplicateur de consensus. */
  consensusMaxMultiplier: number
  /** Pénalité de distance maximale (fraction retirée au bord du rayon). */
  maxDistancePenalty: number
  /** Bonus / malus « ouvert maintenant » (catégories à horaires). */
  openNowBonus: number
  openNowPenalty: number
}

export const DEFAULT_SCORING: ScoringConfig = {
  wilsonZ: 1.96,
  neutralBase: 0.5,
  consensusBonusPerSource: 0.08,
  consensusMaxMultiplier: 1.2,
  maxDistancePenalty: 0.15,
  openNowBonus: 1.05,
  openNowPenalty: 0.97,
}

/**
 * Borne inférieure de Wilson (95 %) d'une proportion `p` observée sur `n` essais.
 * Renvoie une estimation conservatrice : plus n est petit, plus on tire vers le bas.
 */
export function wilsonLowerBound(positiveFraction: number, n: number, z = 1.96): number {
  if (n <= 0) return 0
  const p = Math.min(1, Math.max(0, positiveFraction))
  const z2 = z * z
  const denom = 1 + z2 / n
  const center = p + z2 / (2 * n)
  const margin = z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n)
  return (center - margin) / denom
}

/** Convertit une note 0-5 en proportion « positive » 0-1. */
function ratingToFraction(rating: number): number {
  return Math.min(1, Math.max(0, (rating - 1) / 4))
}

/** Les catégories où « ouvert maintenant » est pertinent pour le score. */
const HOURS_RELEVANT = new Set(['restaurant', 'activity', 'culture'])

/**
 * Calcule la qualité de base (0-1) d'un lieu à partir de ses notes par source.
 * Combine les sources notées via une borne de Wilson sur la note moyenne pondérée
 * par le volume d'avis. Les lieux sans aucune note reçoivent `neutralBase`.
 */
export function computeBaseQuality(place: MergedPlace, cfg: ScoringConfig): number {
  const rated = place.perSourceRatings.filter(
    (r): r is { source: typeof r.source; rating: number; reviewCount: number } =>
      r.rating !== null && r.reviewCount !== null && r.reviewCount > 0,
  )
  if (rated.length === 0) {
    // Pas d'avis du tout (ex : plage OSM). Si on a une note nue sans volume, on
    // la prend prudemment ; sinon score neutre.
    const bareRating = place.rating
    if (bareRating !== null) return ratingToFraction(bareRating) * 0.85
    return cfg.neutralBase
  }
  const totalReviews = rated.reduce((s, r) => s + r.reviewCount, 0)
  const weightedRating =
    rated.reduce((s, r) => s + r.rating * r.reviewCount, 0) / totalReviews
  return wilsonLowerBound(ratingToFraction(weightedRating), totalReviews, cfg.wilsonZ)
}

/** Multiplicateur de consensus : monte avec le nombre de sources notées concordantes. */
export function consensusMultiplier(place: MergedPlace, cfg: ScoringConfig): number {
  const ratedSources = place.perSourceRatings.filter(
    (r) => r.rating !== null && (r.reviewCount ?? 0) > 0,
  ).length
  const mult = 1 + cfg.consensusBonusPerSource * Math.max(0, ratedSources - 1)
  return Math.min(mult, cfg.consensusMaxMultiplier)
}

/** Facteur de distance (1 au point de recherche, jusqu'à 1 - maxDistancePenalty au bord). */
export function distanceFactor(
  distanceM: number | null,
  radiusM: number,
  cfg: ScoringConfig,
): number {
  if (distanceM === null || radiusM <= 0) return 1
  const ratio = Math.min(1, distanceM / radiusM)
  return 1 - cfg.maxDistancePenalty * ratio
}

/** Facteur horaire selon la catégorie et l'état d'ouverture. */
export function openNowFactor(place: MergedPlace, cfg: ScoringConfig): number {
  if (!HOURS_RELEVANT.has(place.category)) return 1
  if (place.openNow === true) return cfg.openNowBonus
  if (place.openNow === false) return cfg.openNowPenalty
  return 1
}

/** Score qualité final (0-1+) d'un lieu fusionné. */
export function computeQualityScore(
  place: MergedPlace,
  radiusM: number,
  cfg: ScoringConfig = DEFAULT_SCORING,
): number {
  const base = computeBaseQuality(place, cfg)
  return (
    base *
    consensusMultiplier(place, cfg) *
    distanceFactor(place.distanceM, radiusM, cfg) *
    openNowFactor(place, cfg)
  )
}
