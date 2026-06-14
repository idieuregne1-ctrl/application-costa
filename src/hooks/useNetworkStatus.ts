import { useSyncExternalStore } from 'react'

/**
 * État de connexion réseau (online/offline). Bascule l'app en mode hors ligne
 * automatiquement quand le réseau lâche.
 */

function subscribe(callback: () => void): () => void {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

export function useNetworkStatus(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  )
}
