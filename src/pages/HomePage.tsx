import { useEffect, useState } from 'react'
import { useAppStore, type Coords } from '../store/useAppStore'
import { isCategoryImplemented, type PlaceCategory } from '../adapters'
import { usePlaceResults, type PlaceResults } from '../hooks/usePlaces'
import { activeFilterCount } from '../core'
import LocationBar from '../components/LocationBar'
import TieredResults from '../components/TieredResults'
import MapView from '../components/MapView'
import DetailSheet from '../components/DetailSheet'
import PlaceCard from '../components/PlaceCard'
import FilterPanel from '../components/FilterPanel'
import FilterChips from '../components/FilterChips'
import FavoritesSheet from '../components/FavoritesSheet'
import SurpriseSheet from '../components/SurpriseSheet'
import PlannerSheet from '../components/PlannerSheet'
import PresetChips from '../components/PresetChips'
import WeatherHint from '../components/WeatherHint'
import { isOutdoor } from '../components/WeatherCard'
import OfflineBanner from '../components/OfflineBanner'
import DownloadedZonesSheet from '../components/DownloadedZonesSheet'
import { useZones } from '../store/useZones'
import { useFavorites } from '../store/useFavorites'
import { usePlanner } from '../store/usePlanner'
import { decodePlan } from '../lib/planner'
import type { MergedPlace } from '../core'

/**
 * Plan partagé capturé UNE fois au chargement du module (avant le montage React
 * et l'hydratation du store). Évite que le double-montage de StrictMode ou
 * l'hydratation asynchrone ne fasse perdre l'import.
 */
const SHARED_PLAN = (() => {
  const hash = window.location.hash
  if (!hash.startsWith('#plan=')) return null
  const decoded = decodePlan(hash.slice('#plan='.length))
  // Nettoie le fragment pour ne pas réimporter au refresh.
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
  return decoded && decoded.length > 0 ? decoded : null
})()

const CATEGORIES: { key: PlaceCategory; label: string; emoji: string }[] = [
  { key: 'restaurant', label: 'Restaurants', emoji: '🍽️' },
  { key: 'activity', label: 'Activités', emoji: '🎟️' },
  { key: 'beach', label: 'Plages', emoji: '🏖️' },
  { key: 'hike', label: 'Randonnée', emoji: '🥾' },
  { key: 'fishing', label: 'Pêche', emoji: '🎣' },
  { key: 'culture', label: 'Culture locale', emoji: '🏛️' },
]

export default function HomePage() {
  const activeCategory = useAppStore((s) => s.activeCategory)
  const setActiveCategory = useAppStore((s) => s.setActiveCategory)
  const position = useAppStore((s) => s.position)
  const filterCount = useAppStore((s) => activeFilterCount(s.filters))
  const favCount = useFavorites((s) => Object.keys(s.favorites).length)
  const setStops = usePlanner((s) => s.setStops)
  const zoneCount = useZones((s) => s.index.length)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const [plannerOpen, setPlannerOpen] = useState(false)
  const [zonesOpen, setZonesOpen] = useState(false)

  // Lien partagé : ouvre le planificateur et applique l'itinéraire APRÈS
  // l'hydratation IndexedDB (sinon l'état persisté écraserait le plan partagé).
  useEffect(() => {
    if (!SHARED_PLAN) return
    setPlannerOpen(true)
    if (usePlanner.persist.hasHydrated()) {
      setStops(SHARED_PLAN)
      return
    }
    return usePlanner.persist.onFinishHydration(() => setStops(SHARED_PLAN))
  }, [setStops])

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col px-4 py-6">
      <header className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            La <span className="text-creme-400">crème de la crème</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Le meilleur autour de toi — agrégé, scoré, sans le bruit.
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            onClick={() => setZonesOpen(true)}
            aria-label="Zones téléchargées"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 text-lg hover:bg-slate-800"
          >
            📥
            {zoneCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-creme-500 px-1 text-xs font-semibold text-slate-950">
                {zoneCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setPlannerOpen(true)}
            aria-label="Planificateur de journée"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 text-lg hover:bg-slate-800"
          >
            🗓️
          </button>
          <button
            onClick={() => setFavoritesOpen(true)}
            aria-label="Mes favoris"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 text-lg hover:bg-slate-800"
          >
            ❤️
            {favCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-creme-500 px-1 text-xs font-semibold text-slate-950">
                {favCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <OfflineBanner />

      <div className="mb-4">
        <LocationBar />
      </div>

      {/* Raccourcis contextuels */}
      <div className="mb-3">
        <PresetChips />
      </div>

      {/* Onglets de catégorie */}
      <nav className="-mx-1 mb-4 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const active = cat.key === activeCategory
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              aria-pressed={active}
              className={[
                'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-creme-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700',
              ].join(' ')}
            >
              <span className="mr-1">{cat.emoji}</span>
              {cat.label}
            </button>
          )
        })}
      </nav>

      {/* Barre de filtres */}
      {position !== null && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFiltersOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              <span>⚙️ Filtres</span>
              {filterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-creme-500 px-1.5 text-xs font-semibold text-slate-950">
                  {filterCount}
                </span>
              )}
            </button>
            <div className="min-w-0 flex-1">
              <FilterChips />
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        {position === null ? (
          <EmptyState
            icon="🧭"
            title="Choisis un point de départ"
            text="Active ta position ou cherche une ville pour voir la crème de la crème autour."
          />
        ) : (
          <Results category={activeCategory} />
        )}
      </main>

      <FilterPanel open={filtersOpen} onClose={() => setFiltersOpen(false)} />
      <FavoritesSheet open={favoritesOpen} onClose={() => setFavoritesOpen(false)} />
      <PlannerSheet open={plannerOpen} onClose={() => setPlannerOpen(false)} />
      <DownloadedZonesSheet open={zonesOpen} onClose={() => setZonesOpen(false)} />
    </div>
  )
}

function Results({ category }: { category: PlaceCategory }) {
  const { results, isLoading, isError, error, refetch, sortBy } = usePlaceResults(category)

  if (!isCategoryImplemented(category)) {
    return (
      <EmptyState
        icon="🚧"
        title="Bientôt disponible"
        text="Cette catégorie sera branchée en Phase 6 (plein air & culture)."
      />
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-52 animate-pulse rounded-2xl bg-slate-900/60" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <EmptyState
        icon="⚠️"
        title="Échec du chargement"
        text={error instanceof Error ? error.message : 'Erreur inconnue.'}
        action={{ label: 'Réessayer', onClick: () => refetch() }}
      />
    )
  }

  if (!results || results.filtered.length === 0) {
    return (
      <EmptyState
        icon="🔍"
        title="Aucun résultat"
        text="Rien ne correspond ici. Élargis le rayon, assouplis les filtres, ou change de zone."
      />
    )
  }

  return <ResultsBody results={results} sortBy={sortBy} category={category} />
}

function ResultsBody({
  results,
  sortBy,
  category,
}: {
  results: PlaceResults
  sortBy: string
  category: PlaceCategory
}) {
  const viewMode = useAppStore((s) => s.viewMode)
  const setViewMode = useAppStore((s) => s.setViewMode)
  const selectedId = useAppStore((s) => s.selectedPlaceId)
  const openDetail = useAppStore((s) => s.openDetail)
  const position = useAppStore((s) => s.position) as Coords
  const positionLabel = useAppStore((s) => s.positionLabel)
  const radiusM = useAppStore((s) => s.filters.radiusM)
  const downloadZone = useZones((s) => s.download)

  const [surpriseOpen, setSurpriseOpen] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  const onSelect = (p: MergedPlace) => openDetail(p.id)
  const mapPlaces = sortBy === 'quality' ? results.tiers.all : results.flat
  // Vivier « Surprends-moi » : la sélection curée (top picks de la catégorie).
  const surprisePool = results.tiers.curated

  const download = async () => {
    await downloadZone({
      label: positionLabel ?? `${position.lat.toFixed(2)}, ${position.lng.toFixed(2)}`,
      center: position,
      radiusM,
      category,
      places: results.tiers.all,
    })
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2500)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          {results.filtered.length} lieu(x) sur {results.rawCount} bruts
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={download}
            className="rounded-lg border border-slate-700 px-2 py-1.5 font-medium text-slate-200 hover:bg-slate-800"
          >
            {downloaded ? '✓ Téléchargé' : '⬇️ Télécharger'}
          </button>
          <button
            onClick={() => setSurpriseOpen(true)}
            className="rounded-lg border border-slate-700 px-2 py-1.5 font-medium text-slate-200 hover:bg-slate-800"
          >
            🎲 Surprends-moi
          </button>
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>
      </div>
      {results.failedSources.length > 0 && (
        <p className="text-xs text-amber-400">
          Source(s) en échec : {results.failedSources.join(', ')}
        </p>
      )}

      {/* Indice météo du jour pour les catégories plein air */}
      {isOutdoor(category) && <WeatherHint position={position} category={category} />}

      {viewMode === 'map' ? (
        <MapView places={mapPlaces} center={position} selectedId={selectedId} onSelect={onSelect} />
      ) : sortBy === 'quality' ? (
        <TieredResults result={results.tiers} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {results.flat.map((p) => (
            <PlaceCard key={p.id} place={p} selected={p.id === selectedId} onSelect={onSelect} />
          ))}
        </div>
      )}

      <DetailSheet places={results.filtered} />
      <SurpriseSheet open={surpriseOpen} onClose={() => setSurpriseOpen(false)} pool={surprisePool} />
    </div>
  )
}

function ViewToggle({ mode, onChange }: { mode: 'list' | 'map'; onChange: (m: 'list' | 'map') => void }) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-slate-700 text-xs">
      {(['list', 'map'] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          aria-pressed={mode === m}
          className={[
            'px-3 py-1.5 font-medium transition-colors',
            mode === m ? 'bg-creme-500 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800',
          ].join(' ')}
        >
          {m === 'list' ? '☰ Liste' : '🗺️ Carte'}
        </button>
      ))}
    </div>
  )
}

function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: string
  title: string
  text: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 p-10 text-center">
      <span className="text-3xl">{icon}</span>
      <p className="mt-2 font-medium text-slate-200">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-lg bg-creme-500 px-4 py-1.5 text-sm font-medium text-slate-950 hover:bg-creme-400"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
