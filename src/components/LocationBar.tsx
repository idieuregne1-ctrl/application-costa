import { useState } from 'react'
import { useGeolocation } from '../hooks/useGeolocation'
import { useGeocode } from '../hooks/useGeocode'
import { useAppStore } from '../store/useAppStore'
import Icon from './Icon'
import { useI18n } from '../lib/i18n'

/**
 * Barre de localisation : bouton « Ma position » (géoloc) + recherche manuelle
 * d'une ville/adresse avec liste de candidats.
 */
export default function LocationBar() {
  const { t } = useI18n()
  const { locate, status: geoStatus, error: geoError } = useGeolocation()
  const { results, loading, error: geoCodeError, search, clear } = useGeocode()
  const setPosition = useAppStore((s) => s.setPosition)
  const setPositionLabel = useAppStore((s) => s.setPositionLabel)
  const position = useAppStore((s) => s.position)
  const [input, setInput] = useState('')

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    search(input)
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          onClick={locate}
          disabled={geoStatus === 'loading'}
          className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-accent px-3.5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-dark disabled:opacity-60"
        >
          <Icon name="pin" size={16} />
          {geoStatus === 'loading' ? t('Localisation…') : t('Ma position')}
        </button>
        <form onSubmit={onSubmit} className="relative flex-1">
          <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('Chercher une ville, une adresse…')}
            className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-stone-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </form>
      </div>

      {/* Candidats de géocodage */}
      {(loading || results.length > 0 || geoCodeError) && (
        <div className="overflow-hidden rounded-lg border border-line bg-white text-sm shadow-card">
          {loading && <p className="px-3 py-2 text-stone-500">{t('Recherche…')}</p>}
          {geoCodeError && <p className="px-3 py-2 text-amber-700">{t(geoCodeError)}</p>}
          {results.map((r) => (
            <button
              key={`${r.lat},${r.lng}`}
              onClick={() => {
                setPosition({ lat: r.lat, lng: r.lng })
                setPositionLabel(r.name.split(',')[0])
                clear()
                setInput(r.name.split(',')[0])
              }}
              className="block w-full truncate border-b border-line px-3 py-2.5 text-left text-stone-700 last:border-0 hover:bg-stone-50"
            >
              {r.name}
            </button>
          ))}
        </div>
      )}

      {geoError && <p className="text-xs text-amber-700">{t(geoError)}</p>}

      {position && (
        <p className="text-xs text-stone-400">
          {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
        </p>
      )}
    </div>
  )
}
