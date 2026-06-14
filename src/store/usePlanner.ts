import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import type { PlanStop } from '../lib/planner'
import { idbGet, idbSet, idbDel } from '../lib/idb'

/**
 * Planificateur de journée — itinéraire ordonné d'arrêts (persisté IndexedDB).
 * Construit depuis les favoris, réorganisable, partageable par lien.
 */

interface PlannerState {
  stops: PlanStop[]
  setStops: (stops: PlanStop[]) => void
  /** Ajoute les arrêts absents (dédup par id), conserve l'ordre existant. */
  addStops: (stops: PlanStop[]) => void
  removeStop: (id: string) => void
  /** Déplace un arrêt d'une position (dir = -1 monter, +1 descendre). */
  move: (index: number, dir: -1 | 1) => void
  /** Réordonne par glisser-déposer (de `from` vers `to`). */
  reorder: (from: number, to: number) => void
  clear: () => void
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

export const usePlanner = create<PlannerState>()(
  persist(
    (set) => ({
      stops: [],
      setStops: (stops) => set({ stops }),
      addStops: (incoming) =>
        set((state) => {
          const existing = new Set(state.stops.map((s) => s.id))
          const fresh = incoming.filter((s) => !existing.has(s.id))
          return { stops: [...state.stops, ...fresh] }
        }),
      removeStop: (id) => set((state) => ({ stops: state.stops.filter((s) => s.id !== id) })),
      move: (index, dir) =>
        set((state) => {
          const target = index + dir
          if (target < 0 || target >= state.stops.length) return state
          const next = [...state.stops]
          ;[next[index], next[target]] = [next[target], next[index]]
          return { stops: next }
        }),
      reorder: (from, to) =>
        set((state) => {
          if (from === to || from < 0 || to < 0 || from >= state.stops.length || to >= state.stops.length) {
            return state
          }
          const next = [...state.stops]
          const [moved] = next.splice(from, 1)
          next.splice(to, 0, moved)
          return { stops: next }
        }),
      clear: () => set({ stops: [] }),
    }),
    {
      name: 'creme-planner',
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({ stops: state.stops }),
    },
  ),
)
