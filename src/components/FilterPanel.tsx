import { useEffect, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { DEFAULT_FILTERS, SUBTYPE_OPTIONS, type Filters, type SortBy } from '../core'
import type { PlaceSource, TrailDifficulty } from '../adapters'

/**
 * Panneau de filtres : drawer (mobile, glisse depuis la droite) / sidebar (desktop).
 * Édite un BROUILLON local ; rien n'est appliqué tant qu'on ne clique pas
 * « Appliquer ». « Réinitialiser » remet les valeurs par défaut.
 *
 * Phase 5 : rayon, prix, note min, ouvert, tri, sources actives. Les filtres
 * par catégorie (cuisine, difficulté de rando, type de plan d'eau…) s'ajouteront
 * en Phase 6.
 */

const RATING_OPTIONS: { value: number | null; label: string }[] = [
 { value: null, label: 'Toutes' },
 { value: 3.5, label: '3.5+' },
 { value: 4.0, label: '4.0+' },
 { value: 4.5, label: '4.5+' },
]

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
 { value: 'quality', label: 'Qualité' },
 { value: 'distance', label: 'Distance' },
 { value: 'rating', label: 'Note' },
 { value: 'reviews', label: "Nb d'avis" },
]

const SOURCE_OPTIONS: { value: PlaceSource; label: string; note?: string }[] = [
 { value: 'google', label: 'Google' },
 { value: 'osm', label: 'OpenStreetMap' },
 { value: 'foursquare', label: 'Foursquare' },
]

const DIFFICULTY_OPTIONS: { value: TrailDifficulty; label: string }[] = [
 { value: 'facile', label: 'Facile' },
 { value: 'modéré', label: 'Modéré' },
 { value: 'difficile', label: 'Difficile' },
]

interface FilterPanelProps {
 open: boolean
 onClose: () => void
}

export default function FilterPanel({ open, onClose }: FilterPanelProps) {
 const filters = useAppStore((s) => s.filters)
 const setFilters = useAppStore((s) => s.setFilters)
 const activeSources = useAppStore((s) => s.activeSources)
 const setActiveSources = useAppStore((s) => s.setActiveSources)
 const activeCategory = useAppStore((s) => s.activeCategory)

 // Brouillon local initialisé à l'ouverture.
 const [draft, setDraft] = useState<Filters>(filters)
 const [draftSources, setDraftSources] = useState(activeSources)

 useEffect(() => {
 if (open) {
 setDraft(filters)
 setDraftSources(activeSources)
 }
 }, [open, filters, activeSources])

 useEffect(() => {
 const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
 if (open) window.addEventListener('keydown', onKey)
 return () => window.removeEventListener('keydown', onKey)
 }, [open, onClose])

 if (!open) return null

 const togglePrice = (level: number) =>
 setDraft((d) => ({
 ...d,
 priceLevels: d.priceLevels.includes(level)
 ? d.priceLevels.filter((l) => l !== level)
 : [...d.priceLevels, level].sort(),
 }))

 const toggleInArray = <T,>(key: 'subtypes' | 'difficulties', value: T) =>
 setDraft((d) => {
 const arr = d[key] as T[]
 const next = arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value]
 return { ...d, [key]: next }
 })

 const subtypeOptions = SUBTYPE_OPTIONS[activeCategory]
 const showDifficulty = activeCategory === 'hike'
 const showPrice = activeCategory === 'restaurant' || activeCategory === 'activity'

 const apply = () => {
 setFilters(draft)
 setActiveSources(draftSources)
 onClose()
 }

 const reset = () => {
 setDraft(DEFAULT_FILTERS)
 setDraftSources({ google: true, foursquare: true, osm: true, tripadvisor: false })
 }

 const km = (draft.radiusM / 1000).toFixed(draft.radiusM < 1000 ? 1 : 0)

 return (
 <div className="fixed inset-0 z-50 flex justify-end">
 <div className="absolute inset-0 bg-ink/40" onClick={onClose} />

 <aside
 role="dialog"
 aria-modal="true"
 aria-label="Filtres"
 className="relative flex h-full w-full max-w-sm flex-col bg-paper shadow-2xl"
 >
 <header className="flex items-center justify-between border-b border-line p-4">
 <h2 className="text-lg font-semibold text-ink">Filtres</h2>
 <button
 onClick={onClose}
 aria-label="Fermer"
 className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100"
 >
 ✕
 </button>
 </header>

 <div className="flex-1 space-y-6 overflow-y-auto p-4">
 {/* Rayon */}
 <Group label={`Rayon : ${km} km`}>
 <input
 type="range"
 min={500}
 max={25000}
 step={500}
 value={draft.radiusM}
 onChange={(e) => setDraft((d) => ({ ...d, radiusM: Number(e.target.value) }))}
 className="w-full accent-creme-500"
 />
 <div className="flex justify-between text-[11px] text-stone-400">
 <span>500 m</span>
 <span>25 km</span>
 </div>
 </Group>

 {/* Filtres par sous-type (selon la catégorie) */}
 {subtypeOptions && (
 <Group label="Type">
 <div className="grid grid-cols-2 gap-2">
 {subtypeOptions.map((opt) => (
 <Toggle
 key={opt.value}
 active={draft.subtypes.includes(opt.value)}
 onClick={() => toggleInArray('subtypes', opt.value)}
 >
 {opt.label}
 </Toggle>
 ))}
 </div>
 </Group>
 )}

 {/* Difficulté (randonnée) */}
 {showDifficulty && (
 <Group label="Difficulté">
 <div className="flex gap-2">
 {DIFFICULTY_OPTIONS.map((opt) => (
 <Toggle
 key={opt.value}
 active={draft.difficulties.includes(opt.value)}
 onClick={() => toggleInArray('difficulties', opt.value)}
 >
 {opt.label}
 </Toggle>
 ))}
 </div>
 </Group>
 )}

 {/* Prix (restaurants / activités) */}
 {showPrice && (
 <Group label="Prix">
 <div className="flex gap-2">
 {[1, 2, 3, 4].map((level) => (
 <Toggle
 key={level}
 active={draft.priceLevels.includes(level)}
 onClick={() => togglePrice(level)}
 >
 {'€'.repeat(level)}
 </Toggle>
 ))}
 </div>
 </Group>
 )}

 {/* Note minimale */}
 <Group label="Note minimale">
 <div className="flex gap-2">
 {RATING_OPTIONS.map((opt) => (
 <Toggle
 key={String(opt.value)}
 active={draft.minRating === opt.value}
 onClick={() => setDraft((d) => ({ ...d, minRating: opt.value }))}
 >
 {opt.label}
 </Toggle>
 ))}
 </div>
 </Group>

 {/* Ouvert maintenant */}
 <Group label="">
 <label className="flex cursor-pointer items-center justify-between">
 <span className="text-sm text-ink">Ouvert maintenant</span>
 <Switch
 checked={draft.openNow}
 onChange={(v) => setDraft((d) => ({ ...d, openNow: v }))}
 />
 </label>
 </Group>

 {/* Tri */}
 <Group label="Trier par">
 <div className="grid grid-cols-2 gap-2">
 {SORT_OPTIONS.map((opt) => (
 <Toggle
 key={opt.value}
 active={draft.sortBy === opt.value}
 onClick={() => setDraft((d) => ({ ...d, sortBy: opt.value }))}
 >
 {opt.label}
 </Toggle>
 ))}
 </div>
 </Group>

 {/* Sources actives */}
 <Group label="Sources actives">
 <div className="space-y-2">
 {SOURCE_OPTIONS.map((src) => (
 <label key={src.value} className="flex cursor-pointer items-center justify-between">
 <span className="text-sm text-ink">
 {src.label}
 {src.note && <span className="ml-1 text-[11px] text-stone-400">({src.note})</span>}
 </span>
 <Switch
 checked={draftSources[src.value]}
 onChange={(v) => setDraftSources((s) => ({ ...s, [src.value]: v }))}
 />
 </label>
 ))}
 </div>
 <p className="mt-1 text-[11px] text-stone-400">Catégorie active : {activeCategory}</p>
 </Group>
 </div>

 <footer className="flex gap-2 border-t border-line p-4">
 <button
 onClick={reset}
 className="flex-1 rounded-xl border border-line py-3 text-sm font-medium text-stone-600 hover:bg-stone-100"
 >
 Réinitialiser
 </button>
 <button
 onClick={apply}
 className="flex-[2] rounded-xl bg-accent py-3 text-sm font-semibold text-white hover:bg-accent-dark"
 >
 Appliquer
 </button>
 </footer>
 </aside>
 </div>
 )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
 return (
 <div className="space-y-2">
 {label && <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</h3>}
 {children}
 </div>
 )
}

function Toggle({
 active,
 onClick,
 children,
}: {
 active: boolean
 onClick: () => void
 children: React.ReactNode
}) {
 return (
 <button
 onClick={onClick}
 className={[
 'flex-1 rounded-lg border px-2 py-2 text-sm font-medium transition-colors',
 active
 ? 'border-accent bg-accent-soft text-accent'
 : 'border-line text-stone-600 hover:bg-stone-100',
 ].join(' ')}
 >
 {children}
 </button>
 )
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
 return (
 <button
 role="switch"
 aria-checked={checked}
 onClick={() => onChange(!checked)}
 className={[
 'relative h-6 w-11 rounded-full transition-colors',
 checked ? 'bg-accent' : 'bg-stone-200',
 ].join(' ')}
 >
 <span
 className={[
 'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
 checked ? 'translate-x-5' : 'translate-x-0.5',
 ].join(' ')}
 />
 </button>
 )
}
