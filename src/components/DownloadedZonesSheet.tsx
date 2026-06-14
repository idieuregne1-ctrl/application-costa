import { useState } from 'react'
import { useZones, isZoneExpired, type ZoneMeta } from '../store/useZones'
import { providersFor } from '../adapters'
import { aggregate } from '../core'
import { useNetworkStatus } from '../hooks/useNetworkStatus'

/**
 * Section « Mes zones téléchargées » : liste les zones sauvegardées (date, taille,
 * nombre de lieux), avec rafraîchir (réseau requis) et supprimer.
 */

const ALL_SOURCES = { google: true, osm: true, foursquare: true, tripadvisor: false }

function formatBytes(n: number): string {
  if (n < 1024) return `${n} o`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} Ko`
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`
}

export default function DownloadedZonesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const index = useZones((s) => s.index)
  const remove = useZones((s) => s.remove)
  const download = useZones((s) => s.download)
  const online = useNetworkStatus()
  const [refreshing, setRefreshing] = useState<string | null>(null)

  if (!open) return null

  const refresh = async (zone: ZoneMeta) => {
    setRefreshing(zone.id)
    try {
      for (const category of zone.categories) {
        const { merged } = await aggregate({
          providers: providersFor(category, ALL_SOURCES),
          center: zone.center,
          radiusM: zone.radiusM,
          category,
        })
        await download({ label: zone.label, center: zone.center, radiusM: zone.radiusM, category, places: merged })
      }
    } finally {
      setRefreshing(null)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Zones téléchargées"
        className="relative flex h-full w-full max-w-md flex-col bg-slate-900 shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-800 p-4">
          <h2 className="text-lg font-semibold text-white">📥 Mes zones téléchargées</h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {index.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="text-3xl">🗺️</span>
              <p className="mt-2 text-slate-300">Aucune zone téléchargée</p>
              <p className="mt-1 max-w-xs text-sm text-slate-500">
                Connecté, télécharge une zone pour la consulter hors ligne en voyage.
              </p>
            </div>
          ) : (
            index.map((zone) => {
              const expired = isZoneExpired(zone)
              return (
                <div key={zone.id} className="rounded-xl border border-slate-800 bg-slate-800/40 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-100">{zone.label}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(zone.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                        })}{' '}
                        · {zone.placeCount} lieux · {formatBytes(zone.sizeBytes)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-600">
                        {zone.categories.join(', ')}
                      </p>
                    </div>
                    {expired && (
                      <span className="flex-shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-300">
                        à rafraîchir
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => refresh(zone)}
                      disabled={!online || refreshing === zone.id}
                      className="flex-1 rounded-lg border border-slate-700 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                    >
                      {refreshing === zone.id ? 'Rafraîchissement…' : '🔄 Rafraîchir'}
                    </button>
                    <button
                      onClick={() => remove(zone.id)}
                      className="flex-1 rounded-lg border border-slate-700 py-1.5 text-xs font-medium text-red-400 hover:bg-slate-800"
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </aside>
    </div>
  )
}
