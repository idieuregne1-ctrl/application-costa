import { useState } from 'react'
import { useGeolocation } from '../hooks/useGeolocation'
import { useGeocode } from '../hooks/useGeocode'
import { useAppStore } from '../store/useAppStore'

/**
 * Barre de localisation : bouton « Ma position » (géoloc) + recherche manuelle
 * d'une ville/adresse avec liste de candidats.
 */
export default function LocationBar() {
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
          className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-creme-500 px-3 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-creme-400 disabled:opacity-60"
        >
          📍 {geoStatus === 'loading' ? 'Localisation…' : 'Ma position'}
        </button>
        <form onSubmit={onSubmit} className="relative flex-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Chercher une ville, une adresse…"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-creme-500 focus:outline-none"
          />
        </form>
      </div>

      {/* Candidats de géocodage */}
      {(loading || results.length > 0 || geoCodeError) && (
        <div className="rounded-lg border border-slate-700 bg-slate-900 text-sm">
          {loading && <p className="px-3 py-2 text-slate-400">Recherche…</p>}
          {geoCodeError && <p className="px-3 py-2 text-amber-400">{geoCodeError}</p>}
          {results.map((r) => (
            <button
              key={`${r.lat},${r.lng}`}
              onClick={() => {
                setPosition({ lat: r.lat, lng: r.lng })
                setPositionLabel(r.name.split(',')[0])
                clear()
                setInput(r.name.split(',')[0])
              }}
              className="block w-full truncate px-3 py-2 text-left text-slate-300 hover:bg-slate-800"
            >
              {r.name}
            </button>
          ))}
        </div>
      )}

      {geoError && <p className="text-xs text-amber-400">{geoError}</p>}

      {position && (
        <p className="text-xs text-slate-500">
          Position : {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
        </p>
      )}
    </div>
  )
}
