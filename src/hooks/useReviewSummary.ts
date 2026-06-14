import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { MergedPlace } from '../core'
import type { ReviewSummary } from '../adapters/types'
import { fetchGoogleReviews } from '../adapters/google'
import { apiPost } from '../lib/api'
import { idbGet, idbSet } from '../lib/idb'

/**
 * Résumé d'avis IA : généré À LA DEMANDE à l'ouverture d'une fiche, puis mis en
 * cache (IndexedDB) pour ne jamais le régénérer ni le repayer — et le rendre
 * disponible hors ligne ensuite (Phase 12).
 */

/** Nombre minimal d'avis pour tenter un résumé. */
const MIN_REVIEWS = 3

/** Enregistrement caché : soit un résumé, soit le marqueur « pas assez d'avis ». */
export type CachedSummary = { summary: ReviewSummary } | { insufficient: true }

function cacheKey(placeId: string): string {
  return `review-summary:${placeId}`
}

/** Id Google brut d'un lieu fusionné, si l'une de ses sources est Google. */
function googleIdOf(place: MergedPlace): string | null {
  const id = place.contributingIds.find((c) => c.startsWith('google:'))
  return id ? id.slice('google:'.length) : null
}

export function useReviewSummary(place: MergedPlace | null) {
  const qc = useQueryClient()
  const id = place?.id ?? null

  // Lecture du cache (rapide, hors ligne) — pas d'appel API.
  const cache = useQuery<CachedSummary | null>({
    queryKey: ['review-summary', id],
    enabled: id !== null,
    staleTime: Infinity,
    queryFn: async () => (id ? ((await idbGet<CachedSummary>(cacheKey(id))) ?? null) : null),
  })

  // Génération à la demande (déclenchée par l'utilisateur).
  const generate = useMutation<CachedSummary, Error>({
    mutationFn: async () => {
      if (!place || !id) throw new Error('Aucun lieu')

      const googleId = googleIdOf(place)
      const reviews = googleId ? await fetchGoogleReviews(googleId) : []

      let record: CachedSummary
      if (reviews.length < MIN_REVIEWS) {
        record = { insufficient: true }
      } else {
        const { summary } = await apiPost<{ summary: ReviewSummary }>('/api/ai/review-summary', {
          name: place.name,
          category: place.category,
          reviews,
        })
        record = { summary }
      }
      await idbSet(cacheKey(id), record)
      return record
    },
    onSuccess: (record) => qc.setQueryData(['review-summary', id], record),
  })

  return {
    cached: cache.data ?? null,
    isLoadingCache: cache.isLoading,
    generate: generate.mutate,
    isGenerating: generate.isPending,
    error: generate.error,
  }
}
