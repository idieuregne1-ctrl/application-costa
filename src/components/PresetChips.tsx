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
                'flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'border-creme-500 bg-creme-500 text-slate-950'
                  : 'border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800',
              ].join(' ')}
            >
              <span>{preset.emoji}</span>
              {preset.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
