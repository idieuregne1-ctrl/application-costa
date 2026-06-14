import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import type { MergedPlace } from '../core'
import { idbGet, idbSet, idbDel } from '../lib/idb'

/**
 * Favoris — sauvegardés localement (IndexedDB), sans compte requis (MVP).
 * On stocke le lieu COMPLET (pas juste l'id) pour pouvoir l'afficher hors ligne
 * et l'utiliser dans le planificateur (Phase 10).
 */

interface FavoritesState {
  favorites: Record<string, MergedPlace>
  toggle: (place: MergedPlace) => void
  remove: (id: string) => void
  isFavorite: (id: string) => boolean
  count: () => number
}

const idbStorage: StateStorage = {
  getItem: async (name) => (await idbGet<string>(name)) ?? null,
  setItem: async (name, value) => {
    await idbSet(name, value)
  },
  removeItem: async (name) => {
    await idbDel(name)
  },
}

export const useFavorites = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: {},
      toggle: (place) =>
        set((state) => {
          const next = { ...state.favorites }
          if (next[place.id]) delete next[place.id]
          else next[place.id] = place
          return { favorites: next }
        }),
      remove: (id) =>
        set((state) => {
          const next = { ...state.favorites }
          delete next[id]
          return { favorites: next }
        }),
      isFavorite: (id) => Boolean(get().favorites[id]),
      count: () => Object.keys(get().favorites).length,
    }),
    {
      name: 'creme-favorites',
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({ favorites: state.favorites }),
    },
  ),
)
