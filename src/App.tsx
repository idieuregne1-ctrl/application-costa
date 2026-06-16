import { useEffect, useState } from 'react'
import HomePage from './pages/HomePage'
import RentalsPage from './pages/RentalsPage'
import { useZones } from './store/useZones'
import Icon, { type IconName } from './components/Icon'

type Section = 'discovery' | 'rentals'

const TABS: { key: Section; label: string; icon: IconName }[] = [
  { key: 'discovery', label: 'Découverte', icon: 'compass' },
  { key: 'rentals', label: 'Location', icon: 'car' },
]

export default function App() {
  const [section, setSection] = useState<Section>('discovery')

  // Charge l'index des zones téléchargées (pour le mode hors ligne).
  useEffect(() => {
    void useZones.getState().load()
  }, [])

  return (
    <div className="flex min-h-full flex-col">
      {/* Basculeur de section */}
      <nav className="flex justify-center gap-8 border-b border-line bg-paper/95 py-3">
        {TABS.map((t) => {
          const active = section === t.key
          return (
            <button
              key={t.key}
              onClick={() => setSection(t.key)}
              aria-pressed={active}
              className={[
                'flex items-center gap-2 border-b-2 pb-1 text-sm font-medium transition-colors',
                active ? 'border-accent text-ink' : 'border-transparent text-stone-400 hover:text-ink',
              ].join(' ')}
            >
              <Icon name={t.icon} size={16} />
              {t.label}
            </button>
          )
        })}
      </nav>

      <div className="flex-1">{section === 'discovery' ? <HomePage /> : <RentalsPage />}</div>
    </div>
  )
}
