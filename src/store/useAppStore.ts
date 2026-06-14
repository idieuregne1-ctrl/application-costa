import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import type { PlaceCategory, PlaceSource } from '../adapters/types'
import { DEFAULT_FILTERS, type Filters } from '../core/filters'
import { idbGet, idbSet, idbDel } from '../lib/idb'

/**
 * State global de l'app (Zustand).
 * Les préférences durables (filtres, sources actives, dernière position) sont
 * persistées dans IndexedDB pour être retrouvées à la prochaine ouverture.
 * L'état d'UI éphémère (sélection, fiche ouverte, vue) n'est pas persisté.
 */

export interface Coords {
  lat: number
  lng: number
}

/** Vue principale des résultats. */
export type ViewMode = 'list' | 'map'

interface AppState {
  activeCategory: PlaceCategory
  setActiveCategory: (category: PlaceCategory) => void

  position: Coords | null
  setPosition: (position: Coords | null) => void
  /** Libellé lisible de la position (ville), pour nommer les zones téléchargées. */
  positionLabel: string | null
  setPositionLabel: (label: string | null) => void

  activeSources: Record<PlaceSource, boolean>
  toggleSource: (source: PlaceSource) => void
  setActiveSources: (sources: Record<PlaceSource, boolean>) => void

  /** Filtres appliqués (rayon, prix, note, ouvert, tri). */
  filters: Filters
  setFilters: (filters: Filters) => void
  resetFilters: () => void

  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void

  selectedPlaceId: string | null
  setSelectedPlaceId: (id: string | null) => void

  detailPlaceId: string | null
  openDetail: (id: string) => void
  closeDetail: () => void
}

/** Adaptateur de stockage IndexedDB pour le middleware persist. */
const idbStorage: StateStorage = {
  getItem: async (name) => (await idbGet<string>(name)) ?? null,
  setItem: async (name, value) => {
    await idbSet(name, value)
  },
  removeItem: async (name) => {
    await idbDel(name)
  },
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeCategory: 'restaurant',
      setActiveCategory: (activeCategory) => set({ activeCategory }),

      position: null,
      setPosition: (position) => set({ position }),
      positionLabel: null,
      setPositionLabel: (positionLabel) => set({ positionLabel }),

      activeSources: { google: true, foursquare: true, osm: true, tripadvisor: false },
      toggleSource: (source) =>
        set((state) => ({
          activeSources: { ...state.activeSources, [source]: !state.activeSources[source] },
        })),
      setActiveSources: (activeSources) => set({ activeSources }),

      filters: DEFAULT_FILTERS,
      setFilters: (filters) => set({ filters }),
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),

      viewMode: 'list',
      setViewMode: (viewMode) => set({ viewMode }),

      selectedPlaceId: null,
      setSelectedPlaceId: (selectedPlaceId) => set({ selectedPlaceId }),

      detailPlaceId: null,
      openDetail: (id) => set({ detailPlaceId: id, selectedPlaceId: id }),
      closeDetail: () => set({ detailPlaceId: null }),
    }),
    {
      name: 'creme-app-state',
      version: 2,
      storage: createJSONStorage(() => idbStorage),
      // On ne persiste que les préférences durables.
      partialize: (state) => ({
        filters: state.filters,
        activeSources: state.activeSources,
        position: state.position,
        positionLabel: state.positionLabel,
      }),
      // Fusion profonde avec les défauts : un état persisté plus ancien (sans
      // certains champs de filtre) ne casse pas l'app et récupère les défauts.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>
        return {
          ...current,
          ...p,
          filters: { ...DEFAULT_FILTERS, ...(p.filters ?? {}) },
          activeSources: { ...current.activeSources, ...(p.activeSources ?? {}) },
        }
      },
    },
  ),
)
