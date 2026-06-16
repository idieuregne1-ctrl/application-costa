import type { MergedPlace } from '../core'
import type { ReviewSummary } from '../adapters/types'
import { useReviewSummary } from '../hooks/useReviewSummary'
import Icon from './Icon'

/**
 * Section « Résumé d'avis IA » de la fiche détail.
 * Génération à la demande (bouton), puis servie depuis le cache (dispo hors ligne).
 */
export default function ReviewSummarySection({ place }: { place: MergedPlace }) {
  const { cached, isLoadingCache, generate, isGenerating, error } = useReviewSummary(place)

  return (
    <section className="rounded-xl border border-line bg-white p-3.5">
      <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400">
        <Icon name="sparkles" size={14} className="text-accent" />
        Résumé d'avis
      </h3>

      {isLoadingCache ? (
        <div className="h-4 w-32 animate-pulse rounded bg-stone-200" />
      ) : cached && 'summary' in cached ? (
        <SummaryView summary={cached.summary} />
      ) : cached && 'insufficient' in cached ? (
        <p className="text-sm text-stone-400">Pas assez d'avis pour générer un résumé fiable.</p>
      ) : isGenerating ? (
        <p className="flex items-center gap-2 text-sm text-stone-500">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          Lecture des avis…
        </p>
      ) : error ? (
        <div className="space-y-2">
          <p className="text-sm text-amber-700">{error.message}</p>
          <GenerateButton onClick={() => generate()} />
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-stone-500">Le verdict en un coup d'œil — sans lire 30 commentaires.</p>
          <GenerateButton onClick={() => generate()} />
        </div>
      )}
    </section>
  )
}

function GenerateButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-sm font-medium text-white hover:bg-accent-dark"
    >
      <Icon name="sparkles" size={14} />
      Résumer les avis
    </button>
  )
}

function SummaryView({ summary }: { summary: ReviewSummary }) {
  return (
    <div className="space-y-3 text-sm">
      <p className="font-serif text-[15px] italic text-ink">« {summary.verdict} »</p>

      {summary.loves.length > 0 && <List title="On aime" items={summary.loves} accent="emerald" />}
      {summary.caveats.length > 0 && <List title="Bémols" items={summary.caveats} accent="amber" />}
      {summary.bestFor.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400">Idéal pour</p>
          <div className="flex flex-wrap gap-1.5">
            {summary.bestFor.map((b, i) => (
              <span key={i} className="rounded-full border border-line bg-stone-50 px-2.5 py-0.5 text-xs text-stone-600">
                {b}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function List({ title, items, accent }: { title: string; items: string[]; accent: 'emerald' | 'amber' }) {
  const dot = accent === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-400">{title}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-stone-700">
            <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${dot}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
