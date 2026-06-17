import { useState } from 'react'
import type { AggregateResult, MergedPlace } from '../core'
import { useAppStore } from '../store/useAppStore'
import { useI18n } from '../lib/i18n'
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
      <div className="mb-3 flex items-baseline gap-3">
        <h2 className="font-serif text-lg text-ink">{title}</h2>
        <span className="h-px flex-1 bg-line" />
        {hint && <span className="text-xs text-stone-400">{hint}</span>}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {places.map((p) => (
          <PlaceCard key={p.id} place={p} selected={p.id === selectedId} onSelect={onSelect} />
        ))}
      </div>
    </section>
  )
}

export default function TieredResults({ result }: { result: AggregateResult }) {
  const { t } = useI18n()
  const [showAll, setShowAll] = useState(false)
  const selectedId = useAppStore((s) => s.selectedPlaceId)
  const openDetail = useAppStore((s) => s.openDetail)
  const onSelect = (p: MergedPlace) => openDetail(p.id)

  const curatedIds = new Set(result.curated.map((p) => p.id))
  const extra = result.all.filter((p) => !curatedIds.has(p.id))

  return (
    <div className="space-y-7">
      <Section title={t('Crème de la crème')} hint={t('valeurs sûres')} places={result.creme} selectedId={selectedId} onSelect={onSelect} />
      <Section title={t('Excellents choix')} places={result.excellents} selectedId={selectedId} onSelect={onSelect} />
      <Section title={t('Pépites')} hint={t('peu connues, très bien notées')} places={result.pepites} selectedId={selectedId} onSelect={onSelect} />

      {extra.length > 0 && (
        <div>
          <button
            onClick={() => setShowAll((v) => !v)}
            className="w-full rounded-full border border-line py-2.5 text-sm font-medium text-stone-600 hover:bg-white hover:text-ink"
          >
            {showAll ? t('Réduire') : `${t('Voir plus de résultats')} (${extra.length})`}
          </button>
          {showAll && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
