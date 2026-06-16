import { useState } from 'react'
import { usePlanner } from '../store/usePlanner'
import { useFavorites } from '../store/useFavorites'
import { useRoute } from '../hooks/useRoute'
import {
 planStopFrom,
 suggestedDurationMin,
 formatDuration,
 googleMapsDirUrl,
 buildShareUrl,
 type PlanStop,
} from '../lib/planner'

/**
 * Planificateur de journée : ordonne les favoris en itinéraire, affiche le temps
 * de trajet réel entre arrêts (OSRM) et la durée suggérée par arrêt. Réorganisation
 * par glisser-déposer (ou flèches). Partage par lien + ouverture dans Google Maps.
 */
export default function PlannerSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
 const stops = usePlanner((s) => s.stops)
 const addStops = usePlanner((s) => s.addStops)
 const removeStop = usePlanner((s) => s.removeStop)
 const move = usePlanner((s) => s.move)
 const reorder = usePlanner((s) => s.reorder)
 const clear = usePlanner((s) => s.clear)
 const favoritesMap = useFavorites((s) => s.favorites)

 const route = useRoute(stops)
 const [dragIndex, setDragIndex] = useState<number | null>(null)
 const [copied, setCopied] = useState(false)

 if (!open) return null

 const favorites = Object.values(favoritesMap)
 const stopsMin = stops.reduce((sum, s) => sum + suggestedDurationMin(s.category), 0)
 const travelSec = route.data?.totalDuration ?? 0
 const totalSec = stopsMin * 60 + travelSec

 const share = async () => {
 const url = buildShareUrl(stops)
 try {
 await navigator.clipboard.writeText(url)
 setCopied(true)
 setTimeout(() => setCopied(false), 2000)
 } catch {
 // Repli : afficher l'URL via prompt si le presse-papier est indisponible.
 window.prompt('Copie ce lien de partage :', url)
 }
 }

 return (
 <div className="fixed inset-0 z-40 flex justify-end">
 <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
 <aside
 role="dialog"
 aria-modal="true"
 aria-label="Planificateur"
 className="relative flex h-full w-full max-w-md flex-col bg-paper shadow-2xl"
 >
 <header className="flex items-center justify-between border-b border-line p-4">
 <h2 className="text-lg font-semibold text-ink">Planificateur de journée</h2>
 <button
 onClick={onClose}
 aria-label="Fermer"
 className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100"
 >
 ✕
 </button>
 </header>

 <div className="flex-1 space-y-3 overflow-y-auto p-4">
 {/* Ajout depuis les favoris */}
 {favorites.length > 0 && (
 <button
 onClick={() => addStops(favorites.map(planStopFrom))}
 className="w-full rounded-lg border border-line py-2 text-sm font-medium text-ink hover:bg-stone-100"
 >
 Ajouter mes favoris ({favorites.length})
 </button>
 )}

 {stops.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-12 text-center">
 <span className="text-3xl"></span>
 <p className="mt-2 text-stone-600">Itinéraire vide</p>
 <p className="mt-1 max-w-xs text-sm text-stone-400">
 Ajoute des favoris pour composer ta journée et voir les temps de trajet.
 </p>
 </div>
 ) : (
 <ol className="space-y-0">
 {stops.map((stop, i) => (
 <StopItem
 key={stop.id}
 stop={stop}
 index={i}
 total={stops.length}
 legLabel={
 i > 0 && route.data?.legs[i - 1]
 ? formatDuration(route.data.legs[i - 1].duration)
 : i > 0 && route.isLoading
 ? '…'
 : null
 }
 dragIndex={dragIndex}
 onDragStart={() => setDragIndex(i)}
 onDrop={() => {
 if (dragIndex !== null) reorder(dragIndex, i)
 setDragIndex(null)
 }}
 onMove={(dir) => move(i, dir)}
 onRemove={() => removeStop(stop.id)}
 />
 ))}
 </ol>
 )}
 </div>

 {stops.length > 0 && (
 <footer className="space-y-3 border-t border-line p-4">
 <div className="flex justify-between text-sm">
 <span className="text-stone-500">
 {stops.length} arrêts · trajet {route.data?.totalDuration ? formatDuration(travelSec) : '—'}
 </span>
 <span className="font-semibold text-ink">Total ≈ {formatDuration(totalSec)}</span>
 </div>
 <div className="flex gap-2">
 <a
 href={googleMapsDirUrl(stops)}
 target="_blank"
 rel="noopener noreferrer"
 className="flex flex-1 items-center justify-center rounded-xl bg-accent py-3 text-sm font-semibold text-white hover:bg-accent-dark"
 >
 Google Maps
 </a>
 <button
 onClick={share}
 className="flex flex-1 items-center justify-center rounded-xl border border-line py-3 text-sm font-medium text-ink hover:bg-stone-100"
 >
 {copied ? '✓ Copié !' : 'Partager'}
 </button>
 </div>
 <button
 onClick={clear}
 className="w-full text-center text-xs text-stone-400 hover:text-stone-600"
 >
 Vider l'itinéraire
 </button>
 </footer>
 )}
 </aside>
 </div>
 )
}

function StopItem({
 stop,
 index,
 total,
 legLabel,
 dragIndex,
 onDragStart,
 onDrop,
 onMove,
 onRemove,
}: {
 stop: PlanStop
 index: number
 total: number
 legLabel: string | null
 dragIndex: number | null
 onDragStart: () => void
 onDrop: () => void
 onMove: (dir: -1 | 1) => void
 onRemove: () => void
}) {
 return (
 <li>
 {/* Temps de trajet depuis l'arrêt précédent */}
 {legLabel !== null && (
 <div className="flex items-center gap-2 py-1 pl-4 text-xs text-stone-400">
 <span></span>
 <span>{legLabel}</span>
 </div>
 )}

 <div
 draggable
 onDragStart={onDragStart}
 onDragOver={(e) => e.preventDefault()}
 onDrop={onDrop}
 className={[
 'flex items-center gap-2 rounded-xl border bg-stone-50 p-2',
 dragIndex === index ? 'border-accent opacity-60' : 'border-line',
 ].join(' ')}
 >
 <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
 {index + 1}
 </span>
 <div className="min-w-0 flex-1">
 <p className="truncate text-sm font-medium text-ink">{stop.name}</p>
 <p className="truncate text-xs text-stone-400">
 {stop.subtype ? `${stop.subtype} · ` : ''}{suggestedDurationMin(stop.category)} min
 </p>
 </div>
 <div className="flex flex-shrink-0 items-center gap-0.5 text-stone-500">
 <button
 onClick={() => onMove(-1)}
 disabled={index === 0}
 aria-label="Monter"
 className="flex h-7 w-7 items-center justify-center rounded hover:bg-stone-100 disabled:opacity-30"
 >
 ↑
 </button>
 <button
 onClick={() => onMove(1)}
 disabled={index === total - 1}
 aria-label="Descendre"
 className="flex h-7 w-7 items-center justify-center rounded hover:bg-stone-100 disabled:opacity-30"
 >
 ↓
 </button>
 <button
 onClick={onRemove}
 aria-label="Retirer"
 className="flex h-7 w-7 items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-red-700"
 >
 ✕
 </button>
 </div>
 </div>
 </li>
 )
}
