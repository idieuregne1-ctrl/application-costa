import { useAppStore } from '../store/useAppStore'
import { filtersEqual } from '../core'
import { PRESETS, presetFilters } from '../lib/presets'

/**
 * Raccourcis contextuels (chips) : un tap applique catégorie + filtres + tri.
 * Le chip s'allume quand l'état courant correspond exactement au preset.
 */
export default function PresetChips() {
  const activeCategory = useAppStore((s) => s.activeCategory)
  const filters = useAppStore((s) => s.filters)
  const setActiveCategory = useAppStore((s) => s.setActiveCategory)
  const setFilters = useAppStore((s) => s.setFilters)

  const apply = (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    setActiveCategory(preset.category)
    setFilters(presetFilters(preset))
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <div className="flex gap-2 pb-1">
        {PRESETS.map((preset) => {
          const active =
            activeCategory === preset.category && filtersEqual(filters, presetFilters(preset))
          return (
            <button
              key={preset.id}
              onClick={() => apply(preset.id)}
              className={[
                'flex-shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-line bg-white text-stone-600 hover:text-ink',
              ].join(' ')}
            >
              {preset.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
