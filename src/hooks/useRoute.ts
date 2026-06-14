import { useQuery } from '@tanstack/react-query'
import { apiGet, apiUrl } from '../lib/api'
import { osrmCoords, type PlanStop } from '../lib/planner'

export interface RouteLeg {
  duration: number // secondes
  distance: number // mètres
}

export interface RouteData {
  legs: RouteLeg[]
  totalDuration: number | null
  totalDistance: number | null
}

/**
 * Temps de trajet réels entre les arrêts (OSRM via proxy). Se recalcule à chaque
 * changement d'ordre des arrêts. Désactivé en dessous de 2 arrêts.
 */
export function useRoute(stops: PlanStop[]) {
  const coords = osrmCoords(stops)
  return useQuery<RouteData>({
    enabled: stops.length >= 2,
    staleTime: 1000 * 60 * 10,
    // La clé inclut l'ordre exact → recalcul au moindre changement.
    queryKey: ['route', coords],
    queryFn: ({ signal }) => apiGet<RouteData>(apiUrl('/api/route', { coords }), signal),
  })
}
