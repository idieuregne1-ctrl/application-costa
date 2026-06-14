import { useAppStore } from '../store/useAppStore'
import { DEFAULT_FILTERS, type SortBy } from '../core'

/**
 * Chips des filtres actifs, affichées au-dessus des résultats. Chaque chip a un
 * « × » qui retire ce filtre immédiatement (applique au store sans passer par
 * le panneau).
 */

const SORT_LABEL: Record<SortBy, string> = {
  quality: 'Qualité',
  distance: 'Distance',
  rating: 'Note',
  reviews: "Nb d'avis",
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 py-1 pl-3 pr-1 text-xs text-slate-200">
      {label}
      <button
        onClick={onRemove}
        aria-label={`Retirer ${label}`}
        className="flex h-4 w-4 items-center justify-center rounded-full text-slate-400 hover:bg-slate-700 hover:text-white"
      >
        ×
      </button>
    </span>
  )
}

export default function FilterChips() {
  const filters = useAppStore((s) => s.filters)
  const setFilters = useAppStore((s) => s.setFilters)

  const chips: { key: string; label: string; onRemove: () => void }[] = []

  if (filters.radiusM !== DEFAULT_FILTERS.radiusM) {
    chips.push({
      key: 'radius',
      label: `≤ ${(filters.radiusM / 1000).toFixed(filters.radiusM < 1000 ? 1 : 0)} km`,
      onRemove: () => setFilters({ ...filters, radiusM: DEFAULT_FILTERS.radiusM }),
    })
  }
  for (const level of filters.priceLevels) {
    chips.push({
      key: `price-${level}`,
      label: '€'.repeat(level),
      onRemove: () =>
        setFilters({ ...filters, priceLevels: filters.priceLevels.filter((l) => l !== level) }),
    })
  }
  if (filters.minRating !== null) {
    chips.push({
      key: 'rating',
      label: `${filters.minRating.toFixed(1)}+`,
      onRemove: () => setFilters({ ...filters, minRating: null }),
    })
  }
  if (filters.openNow) {
    chips.push({
      key: 'open',
      label: 'Ouvert',
      onRemove: () => setFilters({ ...filters, openNow: false }),
    })
  }
  if (filters.sortBy !== DEFAULT_FILTERS.sortBy) {
    chips.push({
      key: 'sort',
      label: `Tri : ${SORT_LABEL[filters.sortBy]}`,
      onRemove: () => setFilters({ ...filters, sortBy: DEFAULT_FILTERS.sortBy }),
    })
  }
  for (const subtype of filters.subtypes) {
    chips.push({
      key: `subtype-${subtype}`,
      label: subtype,
      onRemove: () =>
        setFilters({ ...filters, subtypes: filters.subtypes.filter((s) => s !== subtype) }),
    })
  }
  for (const diff of filters.difficulties) {
    chips.push({
      key: `diff-${diff}`,
      label: diff,
      onRemove: () =>
        setFilters({ ...filters, difficulties: filters.difficulties.filter((d) => d !== diff) }),
    })
  }

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((c) => (
        <Chip key={c.key} label={c.label} onRemove={c.onRemove} />
      ))}
    </div>
  )
}
