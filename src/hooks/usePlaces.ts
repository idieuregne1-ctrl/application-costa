import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { providersFor, type PlaceCategory } from '../adapters'
import {
  aggregate,
  filterPlaces,
  sortPlaces,
  organizeIntoTiers,
  type AggregateOutput,
  type AggregateResult,
  type MergedPlace,
} from '../core'
import { useAppStore, type Coords } from '../store/useAppStore'
import { useZones } from '../store/useZones'
import { useNetworkStatus } from './useNetworkStatus'

/** Arrondit la position pour stabiliser la clé de cache (≈ 100 m). */
function roundCoord(n: number): number {
  return Math.round(n * 1000) / 1000
}

/**
 * Requête de base : interroge + agrège + score les lieux d'une catégorie.
 * La clé de cache inclut le RAYON (qui change l'appel API) mais PAS les filtres
 * client (prix/note/ouvert/tri) — ceux-ci s'appliquent en aval sans refetch.
 */
function usePlacesQuery(category: PlaceCategory, query?: string) {
  const position = useAppStore((s) => s.position)
  const activeSources = useAppStore((s) => s.activeSources)
  const radiusM = useAppStore((s) => s.filters.radiusM)
  const online = useNetworkStatus()
  const providers = providersFor(category, activeSources)

  return useQuery<AggregateOutput>({
    enabled: position !== null,
    // 'always' : exécuter la requête même hors ligne (notre branche offline lit
    // alors la zone téléchargée). Sans ça, React Query met la requête en pause.
    networkMode: 'always',
    // Résultats stables 15 min : on évite de re-solliciter (et re-payer) les
    // sources tant que la zone/les filtres ne changent pas.
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 60,
    queryKey: [
      'places',
      category,
      position ? roundCoord(position.lat) : null,
      position ? roundCoord(position.lng) : null,
      radiusM,
      query ?? '',
      providers.map((p) => p.source).join(','),
      online ? 'on' : 'off',
    ],
    queryFn: async ({ signal }) => {
      const pos = position as Coords

      // Hors ligne : servir les lieux de la zone téléchargée (scoring déjà calculé).
      if (!online) {
        const offline = await useZones.getState().getOfflinePlaces(category, pos)
        return {
          merged: offline ?? [],
          failedSources: offline ? [] : ['offline'],
          rawCount: offline?.length ?? 0,
        }
      }

      return aggregate({ providers, center: pos, radiusM, category, query, signal })
    },
  })
}

export interface PlaceResults {
  /** Tous les lieux scorés après filtres client (avant tiering). */
  filtered: MergedPlace[]
  /** Vue en paliers (pour le tri par qualité). */
  tiers: AggregateResult
  /** Liste plate triée selon `sortBy` (pour les autres tris). */
  flat: MergedPlace[]
  rawCount: number
  failedSources: string[]
}

/**
 * Hook principal de la page : la requête de base + l'application réactive des
 * filtres client (prix/note/ouvert) et du tri. Changer un filtre recalcule
 * instantanément sans rappeler les APIs.
 */
export function usePlaceResults(category: PlaceCategory, query?: string) {
  const result = usePlacesQuery(category, query)
  const filters = useAppStore((s) => s.filters)

  const merged = result.data?.merged
  const data = useMemo<PlaceResults | null>(() => {
    if (!merged) return null
    const filtered = filterPlaces(merged, filters)
    return {
      filtered,
      tiers: organizeIntoTiers(filtered),
      flat: sortPlaces(filtered, filters.sortBy),
      rawCount: result.data?.rawCount ?? 0,
      failedSources: result.data?.failedSources ?? [],
    }
  }, [merged, filters, result.data?.rawCount, result.data?.failedSources])

  return {
    ...result,
    results: data,
    sortBy: filters.sortBy,
  }
}
