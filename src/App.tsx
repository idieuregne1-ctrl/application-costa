import { useEffect, useState } from 'react'
import HomePage from './pages/HomePage'
import RentalsPage from './pages/RentalsPage'
import { useZones } from './store/useZones'

type Section = 'discovery' | 'rentals'

export default function App() {
  const [section, setSection] = useState<Section>('discovery')

  // Charge l'index des zones téléchargées (pour le mode hors ligne).
  useEffect(() => {
    void useZones.getState().load()
  }, [])

  return (
    <div className="flex min-h-full flex-col">
      {/* Basculeur de section */}
      <nav className="flex justify-center gap-1 border-b border-slate-800 bg-slate-950/80 p-2 backdrop-blur">
        {(
          [
            { key: 'discovery', label: '🧭 Découverte' },
            { key: 'rentals', label: '🚗 Location' },
          ] as const
        ).map((s) => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            aria-pressed={section === s.key}
            className={[
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              section === s.key ? 'bg-creme-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800',
            ].join(' ')}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <div className="flex-1">{section === 'discovery' ? <HomePage /> : <RentalsPage />}</div>
    </div>
  )
}
