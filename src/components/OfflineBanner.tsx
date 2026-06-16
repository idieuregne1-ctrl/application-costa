import { useNetworkStatus } from '../hooks/useNetworkStatus'
import { useAppStore } from '../store/useAppStore'
import { useZones } from '../store/useZones'
import Icon from './Icon'

/**
 * Bannière affichée quand le réseau est coupé. Indique la date des données
 * locales de la zone courante (si une zone téléchargée englobe la position).
 */
export default function OfflineBanner() {
  const online = useNetworkStatus()
  const position = useAppStore((s) => s.position)
  const index = useZones((s) => s.index)

  if (online) return null

  const zone =
    position &&
    index.find(
      (z) =>
        Math.abs(z.center.lat - position.lat) < z.radiusM / 111000 + 0.2 &&
        Math.abs(z.center.lng - position.lng) < z.radiusM / 111000 + 0.2,
    )

  const dateLabel = zone
    ? new Date(zone.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    : null

  return (
    <div className="mb-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
      <Icon name="wifi-off" size={16} className="flex-shrink-0" />
      <span>
        Mode hors ligne
        {dateLabel ? ` — données du ${dateLabel}` : ' — téléchargez une zone quand vous êtes connecté'}
      </span>
    </div>
  )
}
