import { useEffect } from 'react'
import HomePage from './pages/HomePage'
import { useZones } from './store/useZones'

export default function App() {
  // Charge l'index des zones téléchargées (pour le mode hors ligne).
  useEffect(() => {
    void useZones.getState().load()
  }, [])

  return <HomePage />
}
