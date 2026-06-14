import type { Place, PlaceCategory, PlaceProvider } from '../adapters/types'
import type { MergedPlace } from './types'
import { haversineMeters } from '../lib/geo'
import { dedupeAndMerge, DEFAULT_DEDUP, type DedupConfig } from './dedup'
import { computeQualityScore, DEFAULT_SCORING, type ScoringConfig } from './scoring'

/**
 * PlaceAggregator — orchestre les adapters en parallèle, déduplique/fusionne,
 * score chaque lieu et répartit en paliers. C'est le pipeline central de l'app.
 */

export interface AggregateParams {
  providers: PlaceProvider[]
  center: { lat: number; lng: number }
  radiusM: number
  category: PlaceCategory
  query?: string
  signal?: AbortSignal
  scoring?: ScoringConfig
  dedup?: DedupConfig
}

export interface AggregateOutput {
  /** Lieux fusionnés et scorés (triés par score qualité décroissant). */
  merged: MergedPlace[]
  /** Sources qui ont échoué (les autres restent intégrées). */
  failedSources: string[]
  /** Nombre de lieux bruts avant déduplication. */
  rawCount: number
}

export async function aggregate(params: AggregateParams): Promise<AggregateOutput> {
  const {
    providers,
    center,
    radiusM,
    category,
    query,
    signal,
    scoring = DEFAULT_SCORING,
    dedup = DEFAULT_DEDUP,
  } = params

  // 1. Interrogation parallèle ; une source en échec n'arrête pas les autres.
  const settled = await Promise.allSettled(
    providers.map((p) =>
      p.search({ lat: center.lat, lng: center.lng, radiusM, category, query, signal }),
    ),
  )

  const raw: Place[] = []
  const failedSources: string[] = []
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') raw.push(...r.value)
    else failedSources.push(providers[i].source)
  })

  // 2. Déduplication + fusion multi-sources.
  const merged = dedupeAndMerge(raw, dedup)

  // 3. Distance au centre + score qualité.
  for (const place of merged) {
    place.distanceM = haversineMeters(center, place)
    place.qualityScore = computeQualityScore(place, radiusM, scoring)
  }

  // 4. Tri par score qualité (les filtres client + tiering s'appliquent en aval).
  merged.sort((a, b) => b.qualityScore - a.qualityScore)

  return { merged, failedSources, rawCount: raw.length }
}
