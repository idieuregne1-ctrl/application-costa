import { useQuery } from '@tanstack/react-query'
import { apiGet, apiUrl } from '../lib/api'
import type { WeatherData } from '../lib/weather'

/** Arrondit pour stabiliser la clé de cache météo (≈ 1 km). */
function round(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Météo d'un lieu via le proxy Open-Meteo. `marine` demande aussi les conditions
 * marines (plage / pêche en bord de mer). Activé à la demande (fiche ouverte).
 */
export function useWeather(
  lat: number,
  lng: number,
  marine: boolean,
  enabled: boolean,
) {
  return useQuery<WeatherData>({
    enabled,
    staleTime: 1000 * 60 * 30, // 30 min
    queryKey: ['weather', round(lat), round(lng), marine],
    queryFn: ({ signal }) =>
      apiGet<WeatherData>(
        apiUrl('/api/weather', { lat, lng, marine: marine ? 1 : undefined }),
        signal,
      ),
  })
}
