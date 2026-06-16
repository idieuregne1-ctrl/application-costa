import { useEffect, useState } from 'react'
import type { MergedPlace } from '../core'
import { useAppStore } from '../store/useAppStore'
import PlaceCard from './PlaceCard'

/**
 * Mode « Surprends-moi » : propose 3-4 suggestions tirées au hasard parmi les
 * meilleurs lieux de la catégorie active, pour les indécis. Bouton « Régénère »
 * pour en obtenir d'autres.
 */

const PICK_COUNT = 4

/** Tire `n` éléments distincts au hasard (mélange de Fisher-Yates partiel). */
function sample<T>(arr: T[], n: number): T[] {
 const copy = [...arr]
 for (let i = copy.length - 1; i > 0; i--) {
 const j = Math.floor(Math.random() * (i + 1))
 ;[copy[i], copy[j]] = [copy[j], copy[i]]
 }
 return copy.slice(0, Math.min(n, copy.length))
}

export default function SurpriseSheet({
 open,
 onClose,
 pool,
}: {
 open: boolean
 onClose: () => void
 pool: MergedPlace[]
}) {
 const openDetail = useAppStore((s) => s.openDetail)
 const [picks, setPicks] = useState<MergedPlace[]>([])

 const regenerate = () => setPicks(sample(pool, PICK_COUNT))

 useEffect(() => {
 if (open) setPicks(sample(pool, PICK_COUNT))
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [open])

 if (!open) return null

 return (
 <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
 <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
 <div
 role="dialog"
 aria-modal="true"
 aria-label="Surprends-moi"
 className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-paper p-4 sm:rounded-3xl"
 >
 <div className="mb-3 flex items-center justify-between">
 <h2 className="text-lg font-semibold text-ink">Surprends-moi</h2>
 <button
 onClick={onClose}
 aria-label="Fermer"
 className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100"
 >
 ✕
 </button>
 </div>

 {picks.length === 0 ? (
 <p className="py-8 text-center text-sm text-stone-400">
 Pas assez de lieux ici pour proposer une sélection.
 </p>
 ) : (
 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
 {picks.map((p) => (
 <PlaceCard key={p.id} place={p} onSelect={() => openDetail(p.id)} />
 ))}
 </div>
 )}

 <button
 onClick={regenerate}
 className="mt-4 w-full rounded-xl bg-accent py-3 font-semibold text-white hover:bg-accent-dark"
 >
 Régénère
 </button>
 </div>
 </div>
 )
}
