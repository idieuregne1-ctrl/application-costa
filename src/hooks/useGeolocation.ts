import { useCallback, useState } from 'react'
import { useAppStore } from '../store/useAppStore'

/**
 * Géolocalisation du navigateur (avec permission).
 * Expose un état clair pour gérer proprement les cas refus / indisponible.
 */

type GeoStatus = 'idle' | 'loading' | 'success' | 'denied' | 'unavailable' | 'error'

export function useGeolocation() {
  const setPosition = useAppStore((s) => s.setPosition)
  const setPositionLabel = useAppStore((s) => s.setPositionLabel)
  const [status, setStatus] = useState<GeoStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable')
      setError("La géolocalisation n'est pas disponible sur cet appareil.")
      return
    }
    setStatus('loading')
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setPositionLabel('Ma position')
        setStatus('success')
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('denied')
          setError('Permission de localisation refusée. Cherche une ville à la place.')
        } else {
          setStatus('error')
          setError("Impossible d'obtenir ta position.")
        }
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    )
  }, [setPosition, setPositionLabel])

  return { locate, status, error }
}
