import type { Place, PlaceSource } from '../adapters/types'
import type { MergedPlace } from './types'
import { haversineMeters } from '../lib/geo'
import { nameSimilarity } from '../lib/similarity'

/**
 * Déduplication multi-sources.
 * Deux lieux sont considérés identiques s'ils sont proches (< distanceM) ET que
 * leurs noms se ressemblent (similarité > nameThreshold). On regroupe puis on
 * fusionne chaque grappe en un seul `MergedPlace`.
 */

export interface DedupConfig {
  distanceM: number
  nameThreshold: number
}

export const DEFAULT_DEDUP: DedupConfig = {
  distanceM: 50,
  nameThreshold: 0.8,
}

const UNNAMED = /sans nom/i

/** Priorité de source pour choisir le « représentant » d'une grappe. */
const SOURCE_PRIORITY: Record<PlaceSource, number> = {
  google: 3,
  foursquare: 2,
  tripadvisor: 2,
  osm: 1,
}

function isSameLieu(a: Place, b: Place, cfg: DedupConfig): boolean {
  const dist = haversineMeters(a, b)
  if (dist > cfg.distanceM) return false
  return nameSimilarity(a.name, b.name) >= cfg.nameThreshold
}

/** Choisit le lieu le plus « fiable » d'une grappe comme représentant. */
function pickRepresentative(cluster: Place[]): Place {
  return [...cluster].sort((a, b) => {
    const named = Number(!UNNAMED.test(b.name)) - Number(!UNNAMED.test(a.name))
    if (named !== 0) return named
    const prio = SOURCE_PRIORITY[b.source] - SOURCE_PRIORITY[a.source]
    if (prio !== 0) return prio
    return (b.reviewCount ?? 0) - (a.reviewCount ?? 0)
  })[0]
}

function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)]
}

/** Fusionne une grappe de lieux en un seul `MergedPlace` (distance/score non encore calculés). */
function mergeCluster(cluster: Place[]): MergedPlace {
  const rep = pickRepresentative(cluster)

  // Une entrée de note par source distincte (on garde la plus volumineuse par source).
  const bySource = new Map<PlaceSource, Place>()
  for (const p of cluster) {
    const existing = bySource.get(p.source)
    if (!existing || (p.reviewCount ?? 0) > (existing.reviewCount ?? 0)) {
      bySource.set(p.source, p)
    }
  }
  const perSourceRatings = [...bySource.values()].map((p) => ({
    source: p.source,
    rating: p.rating,
    reviewCount: p.reviewCount,
  }))

  // Note fusionnée : moyenne pondérée par volume des sources notées.
  const rated = perSourceRatings.filter(
    (r) => r.rating !== null && r.reviewCount !== null && r.reviewCount > 0,
  ) as { source: PlaceSource; rating: number; reviewCount: number }[]
  let mergedRating: number | null = null
  let mergedReviewCount: number | null = null
  if (rated.length > 0) {
    const total = rated.reduce((s, r) => s + r.reviewCount, 0)
    mergedRating = rated.reduce((s, r) => s + r.rating * r.reviewCount, 0) / total
    mergedReviewCount = total
  } else {
    // Aucun volume d'avis : retenir une note nue éventuelle (max des sources).
    const bare = cluster.map((p) => p.rating).filter((r): r is number => r !== null)
    if (bare.length) mergedRating = Math.max(...bare)
  }

  const photos = uniq(
    [...cluster].sort((a, b) => SOURCE_PRIORITY[b.source] - SOURCE_PRIORITY[a.source]).flatMap((p) => p.photos),
  ).slice(0, 8)

  const priceLevel =
    cluster.find((p) => p.source === 'google' && p.priceLevel !== null)?.priceLevel ??
    cluster.find((p) => p.priceLevel !== null)?.priceLevel ??
    null

  const openNow =
    cluster.find((p) => p.source === 'google' && p.openNow !== null)?.openNow ??
    cluster.find((p) => p.openNow !== null)?.openNow ??
    null

  const address =
    cluster.map((p) => p.address).filter(Boolean).sort((a, b) => b.length - a.length)[0] ?? ''

  const name = UNNAMED.test(rep.name)
    ? (cluster.find((p) => !UNNAMED.test(p.name))?.name ?? rep.name)
    : rep.name

  return {
    id: rep.id,
    source: rep.source,
    name,
    category: rep.category,
    subtype: rep.subtype,
    lat: rep.lat,
    lng: rep.lng,
    rating: mergedRating,
    reviewCount: mergedReviewCount,
    priceLevel,
    photos,
    address,
    openNow,
    tags: uniq(cluster.flatMap((p) => p.tags)),
    sourceUrl: rep.sourceUrl,
    trail: cluster.find((p) => p.trail)?.trail,
    sources: uniq(cluster.map((p) => p.source)),
    contributingIds: cluster.map((p) => p.id),
    perSourceRatings,
    qualityScore: 0,
    distanceM: null,
  }
}

/**
 * Déduplique et fusionne une liste de lieux issus de plusieurs sources.
 * Complexité O(n²) acceptable pour les volumes visés (quelques dizaines par source).
 */
export function dedupeAndMerge(places: Place[], cfg: DedupConfig = DEFAULT_DEDUP): MergedPlace[] {
  const clusters: Place[][] = []
  for (const place of places) {
    const target = clusters.find((cluster) => cluster.some((c) => isSameLieu(c, place, cfg)))
    if (target) target.push(place)
    else clusters.push([place])
  }
  return clusters.map(mergeCluster)
}
