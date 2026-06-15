import { useQuery } from '@tanstack/react-query'
import { apiGet, apiUrl } from '../lib/api'
import { buildRedirects, type RentalOffer, type RentalRedirect, type RentalSearch } from '../adapters/rentals'
import type { FxRates } from '../core/currency'

/** Taux de change (frankfurter via proxy), pour comparer les offres en une devise. */
export function useFxRates(base: string) {
  return useQuery<FxRates>({
    queryKey: ['fx', base],
    staleTime: 1000 * 60 * 60 * 6, // 6 h
    queryFn: () => apiGet<FxRates>(apiUrl('/api/rentals/fx', { base })),
  })
}

export interface RentalSearchResult {
  offers: RentalOffer[]
  redirects: RentalRedirect[]
  note?: string
}

/**
 * Recherche de location : offres avec prix depuis le backend (si une API
 * partenaire est branchée) + liens deep-link vers les loueurs (toujours dispo).
 * `search` null = pas encore lancé.
 */
export function useRentals(search: RentalSearch | null) {
  return useQuery<RentalSearchResult>({
    enabled: search !== null,
    queryKey: ['rentals', search],
    queryFn: async ({ signal }) => {
      const s = search as RentalSearch
      const data = await apiGet<{ offers?: RentalOffer[]; note?: string }>(
        apiUrl('/api/rentals/search', {
          vehicleType: s.vehicleType,
          country: s.country,
          city: s.city,
          pickupDate: s.pickupDate,
          pickupTime: s.pickupTime,
          dropoffDate: s.dropoffDate,
          dropoffTime: s.dropoffTime,
          driverAge: s.driverAge,
        }),
        signal,
      )
      return {
        offers: data.offers ?? [],
        redirects: buildRedirects(s),
        note: data.note,
      }
    },
  })
}
