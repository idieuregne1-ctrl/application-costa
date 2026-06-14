import type { MergedPlace } from '../core'
import type { ReviewSummary } from '../adapters/types'
import { useReviewSummary } from '../hooks/useReviewSummary'

/**
 * Section « Résumé d'avis IA » de la fiche détail.
 * Génération à la demande (bouton) pour maîtriser les coûts ; une fois généré,
 * le résumé est servi depuis le cache (et dispo hors ligne).
 */
export default function ReviewSummarySection({ place }: { place: MergedPlace }) {
  const { cached, isLoadingCache, generate, isGenerating, error } = useReviewSummary(place)

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-800/30 p-3">
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-200">
        ✨ Résumé d'avis IA
      </h3>

      {isLoadingCache ? (
        <div className="h-4 w-32 animate-pulse rounded bg-slate-700" />
      ) : cached && 'summary' in cached ? (
        <SummaryView summary={cached.summary} />
      ) : cached && 'insufficient' in cached ? (
        <p className="text-sm text-slate-500">
          Pas assez d'avis pour générer un résumé fiable sur ce lieu.
        </p>
      ) : isGenerating ? (
        <p className="flex items-center gap-2 text-sm text-slate-400">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-creme-500 border-t-transparent" />
          Lecture des avis…
        </p>
      ) : error ? (
        <div className="space-y-2">
          <p className="text-sm text-amber-400">{error.message}</p>
          <GenerateButton onClick={() => generate()} />
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">
            Condense les avis en un verdict clair — sans lire 30 commentaires.
          </p>
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
      className="rounded-lg bg-creme-500/90 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-creme-400"
    >
      ✨ Résumer les avis
    </button>
  )
}

function SummaryView({ summary }: { summary: ReviewSummary }) {
  return (
    <div className="space-y-3 text-sm">
      <p className="italic text-slate-200">« {summary.verdict} »</p>

      {summary.loves.length > 0 && (
        <List title="On aime" items={summary.loves} marker="✅" markerClass="text-emerald-400" />
      )}
      {summary.caveats.length > 0 && (
        <List title="Bémols" items={summary.caveats} marker="⚠️" markerClass="text-amber-400" />
      )}
      {summary.bestFor.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Idéal pour
          </p>
          <div className="flex flex-wrap gap-1.5">
            {summary.bestFor.map((b, i) => (
              <span key={i} className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-200">
                {b}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function List({
  title,
  items,
  marker,
  markerClass,
}: {
  title: string
  items: string[]
  marker: string
  markerClass: string
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-slate-300">
            <span className={markerClass}>{marker}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
