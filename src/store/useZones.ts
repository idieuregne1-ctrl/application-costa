import { create } from 'zustand'
import type { MergedPlace } from '../core'
import type { PlaceCategory } from '../adapters/types'
import type { Coords } from './useAppStore'
import { idbGet, idbSet, idbDel } from '../lib/idb'

/**
 * Zones téléchargées pour l'usage hors ligne.
 * Données (lieux par catégorie) stockées en IndexedDB ; un index léger
 * (métadonnées) est gardé en mémoire pour la liste « Mes zones téléchargées ».
 *
 * Stratégie : les photos et tuiles de carte sont mises en cache par le Service
 * Worker (Cache API, voir vite.config) ; ici on persiste les fiches complètes
 * pour que filtrage/tri/scoring tournent côté client sans réseau.
 */

/** Durée de validité d'une zone (jours) — conformité aux conditions des APIs. */
export const ZONE_TTL_DAYS = 5

export interface ZoneMeta {
  id: string
  label: string
  center: Coords
  radiusM: number
  /** Date de téléchargement (ISO). */
  date: string
  categories: PlaceCategory[]
  placeCount: number
  /** Taille approximative des données stockées (octets). */
  sizeBytes: number
}

export type ZoneData = Partial<Record<PlaceCategory, MergedPlace[]>>

const INDEX_KEY = 'zones:index'
const dataKey = (id: string) => `zone:data:${id}`

/** Id stable d'une zone à partir de son centre + rayon (re-télécharger met à jour). */
function zoneId(center: Coords, radiusM: number): string {
  return `${center.lat.toFixed(3)},${center.lng.toFixed(3)},${radiusM}`
}

/** Âge d'une zone en jours. */
export function zoneAgeDays(meta: ZoneMeta): number {
  return (Date.now() - new Date(meta.date).getTime()) / 86_400_000
}

export function isZoneExpired(meta: ZoneMeta): boolean {
  return zoneAgeDays(meta) > ZONE_TTL_DAYS
}

interface ZonesState {
  index: ZoneMeta[]
  loaded: boolean
  load: () => Promise<void>
  download: (args: {
    label: string
    center: Coords
    radiusM: number
    category: PlaceCategory
    places: MergedPlace[]
  }) => Promise<void>
  remove: (id: string) => Promise<void>
  /** Lieux hors ligne pour une catégorie autour d'une position (zone englobante). */
  getOfflinePlaces: (category: PlaceCategory, position: Coords) => Promise<MergedPlace[] | null>
}

async function persistIndex(index: ZoneMeta[]): Promise<void> {
  await idbSet(INDEX_KEY, index)
}

export const useZones = create<ZonesState>((set, get) => ({
  index: [],
  loaded: false,

  load: async () => {
    const index = (await idbGet<ZoneMeta[]>(INDEX_KEY)) ?? []
    set({ index, loaded: true })
  },

  download: async ({ label, center, radiusM, category, places }) => {
    const id = zoneId(center, radiusM)
    const data = (await idbGet<ZoneData>(dataKey(id))) ?? {}
    data[category] = places
    await idbSet(dataKey(id), data)

    const placeCount = Object.values(data).reduce((sum, arr) => sum + (arr?.length ?? 0), 0)
    const categories = Object.keys(data) as PlaceCategory[]
    const sizeBytes = JSON.stringify(data).length
    const meta: ZoneMeta = {
      id,
      label,
      center,
      radiusM,
      date: new Date().toISOString(),
      categories,
      placeCount,
      sizeBytes,
    }
    const index = [meta, ...get().index.filter((z) => z.id !== id)]
    await persistIndex(index)
    set({ index })
  },

  remove: async (id) => {
    await idbDel(dataKey(id))
    const index = get().index.filter((z) => z.id !== id)
    await persistIndex(index)
    set({ index })
  },

  getOfflinePlaces: async (category, position) => {
    // Zone dont le rayon englobe la position et qui contient la catégorie.
    const candidate = get().index.find(
      (z) =>
        z.categories.includes(category) &&
        haversine(z.center, position) <= z.radiusM,
    )
    if (!candidate) return null
    const data = await idbGet<ZoneData>(dataKey(candidate.id))
    return data?.[category] ?? null
  },
}))

/** Petite distance haversine locale (évite un import circulaire). */
function haversine(a: Coords, b: Coords): number {
  const R = 6_371_000
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
