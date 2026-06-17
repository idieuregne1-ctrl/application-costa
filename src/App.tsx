import { useEffect, useState } from 'react'
import HomePage from './pages/HomePage'
import RentalsPage from './pages/RentalsPage'
import SettingsSheet from './components/SettingsSheet'
import { useZones } from './store/useZones'
import { useAppStore } from './store/useAppStore'
import { useI18n } from './lib/i18n'
import Icon, { type IconName } from './components/Icon'

type Section = 'discovery' | 'rentals'

const TABS: { key: Section; label: string; icon: IconName }[] = [
  { key: 'discovery', label: 'Découverte', icon: 'compass' },
  { key: 'rentals', label: 'Location', icon: 'car' },
]

export default function App() {
  const { t } = useI18n()
  const lang = useAppStore((s) => s.lang)
  const [section, setSection] = useState<Section>('discovery')
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Charge l'index des zones téléchargées (pour le mode hors ligne).
  useEffect(() => {
    void useZones.getState().load()
  }, [])

  // Reflète la langue choisie sur l'attribut <html lang>.
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return (
    <div className="flex min-h-full flex-col">
      {/* Barre du haut : sections + préférences */}
      <nav className="relative flex items-center justify-center gap-8 border-b border-line bg-paper/95 py-3">
        {TABS.map((tab) => {
          const active = section === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setSection(tab.key)}
              aria-pressed={active}
              className={[
                'flex items-center gap-2 border-b-2 pb-1 text-sm font-medium transition-colors',
                active ? 'border-accent text-ink' : 'border-transparent text-stone-400 hover:text-ink',
              ].join(' ')}
            >
              <Icon name={tab.icon} size={16} />
              {t(tab.label)}
            </button>
          )
        })}
        <button
          onClick={() => setSettingsOpen(true)}
          aria-label={t('Préférences')}
          className="absolute right-3 flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-ink"
        >
          <Icon name="settings" size={18} />
        </button>
      </nav>

      <div className="flex-1">{section === 'discovery' ? <HomePage /> : <RentalsPage />}</div>

      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
