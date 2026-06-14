import { useState } from 'react'
import type { AggregateResult, MergedPlace } from '../core'
import { useAppStore } from '../store/useAppStore'
import PlaceCard from './PlaceCard'

/**
 * Affichage des résultats en paliers (🏆 Crème · ⭐ Excellents · 💎 Pépites)
 * + toggle « Voir plus de résultats » au-delà de la sélection curée.
 */

function Section({
  title,
  hint,
  places,
  selectedId,
  onSelect,
}: {
  title: string
  hint?: string
  places: MergedPlace[]
  selectedId: string | null
  onSelect: (p: MergedPlace) => void
}) {
  if (places.length === 0) return null
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
        {hint && <span className="text-xs text-slate-500">{hint}</span>}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {places.map((p) => (
          <PlaceCard key={p.id} place={p} selected={p.id === selectedId} onSelect={onSelect} />
        ))}
      </div>
    </section>
  )
}

export default function TieredResults({ result }: { result: AggregateResult }) {
  const [showAll, setShowAll] = useState(false)
  const selectedId = useAppStore((s) => s.selectedPlaceId)
  const openDetail = useAppStore((s) => s.openDetail)
  const onSelect = (p: MergedPlace) => openDetail(p.id)

  const curatedIds = new Set(result.curated.map((p) => p.id))
  const extra = result.all.filter((p) => !curatedIds.has(p.id))

  return (
    <div className="space-y-5">
      <Section title="🏆 Crème de la crème" hint="valeurs sûres" places={result.creme} selectedId={selectedId} onSelect={onSelect} />
      <Section title="⭐ Excellents choix" places={result.excellents} selectedId={selectedId} onSelect={onSelect} />
      <Section title="💎 Pépites" hint="peu connues, très bien notées" places={result.pepites} selectedId={selectedId} onSelect={onSelect} />

      {extra.length > 0 && (
        <div>
          <button
            onClick={() => setShowAll((v) => !v)}
            className="w-full rounded-lg border border-slate-700 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            {showAll ? 'Réduire' : `Voir plus de résultats (${extra.length})`}
          </button>
          {showAll && (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {extra.map((p) => (
                <PlaceCard key={p.id} place={p} selected={p.id === selectedId} onSelect={onSelect} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
