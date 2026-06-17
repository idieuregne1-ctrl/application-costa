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
import Icon, { type IconName } from '../components/Icon'
import { useI18n } from '../lib/i18n'
import { useZones } from '../store/useZones'
import { useFavorites } from '../store/useFavorites'
import { usePlanner } from '../store/usePlanner'
import { decodePlan } from '../lib/planner'
import type { MergedPlace } from '../core'

const SHARED_PLAN = (() => {
  const hash = window.location.hash
  if (!hash.startsWith('#plan=')) return null
  const decoded = decodePlan(hash.slice('#plan='.length))
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
  return decoded && decoded.length > 0 ? decoded : null
})()

const CATEGORIES: { key: PlaceCategory; label: string }[] = [
  { key: 'restaurant', label: 'Restaurants' },
  { key: 'activity', label: 'Activités' },
  { key: 'beach', label: 'Plages' },
  { key: 'hike', label: 'Randonnée' },
  { key: 'fishing', label: 'Pêche' },
  { key: 'culture', label: 'Culture locale' },
]

function IconButton({
  icon,
  label,
  badge,
  onClick,
}: {
  icon: IconName
  label: string
  badge?: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink transition-colors hover:bg-white"
    >
      <Icon name={icon} size={19} />
      {badge !== undefined && badge > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold text-white">
          {badge}
        </span>
      )}
    </button>
  )
}

export default function HomePage() {
  const { t } = useI18n()
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
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight text-ink">
            {t('Application de voyage')}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            {t('Le meilleur autour de vous, soigneusement sélectionné.')}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <IconButton icon="download" label="Zones téléchargées" badge={zoneCount} onClick={() => setZonesOpen(true)} />
          <IconButton icon="calendar" label="Planificateur de journée" onClick={() => setPlannerOpen(true)} />
          <IconButton icon="heart" label="Mes favoris" badge={favCount} onClick={() => setFavoritesOpen(true)} />
        </div>
      </header>

      <OfflineBanner />

      <div className="mb-4">
        <LocationBar />
      </div>

      <div className="mb-4">
        <PresetChips />
      </div>

      {/* Onglets de catégorie — sous forme d'onglets soulignés */}
      <nav className="-mx-4 mb-5 overflow-x-auto px-4">
        <div className="flex min-w-max gap-6 border-b border-line">
          {CATEGORIES.map((cat) => {
            const active = cat.key === activeCategory
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                aria-pressed={active}
                className={[
                  '-mb-px whitespace-nowrap border-b-2 pb-2.5 text-sm font-medium transition-colors',
                  active ? 'border-accent text-ink' : 'border-transparent text-stone-400 hover:text-ink',
                ].join(' ')}
              >
                {t(cat.label)}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Barre de filtres */}
      {position !== null && (
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => setFiltersOpen(true)}
            className="flex flex-shrink-0 items-center gap-2 rounded-full border border-line px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-white"
          >
            <Icon name="sliders" size={16} />
            {t('Filtres')}
            {filterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-white">
                {filterCount}
              </span>
            )}
          </button>
          <div className="min-w-0 flex-1">
            <FilterChips />
          </div>
        </div>
      )}

      <main className="flex-1">
        {position === null ? (
          <EmptyState
            icon="pin"
            title={t('Choisissez un point de départ')}
            text={t('Activez votre position ou cherchez une ville pour découvrir le meilleur autour.')}
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
  const { t } = useI18n()
  const { results, isLoading, isError, error, refetch, sortBy } = usePlaceResults(category)

  if (!isCategoryImplemented(category)) {
    return <EmptyState icon="compass" title={t('Bientôt disponible')} text={t('Cette catégorie arrive prochainement.')} />
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-56 animate-pulse rounded-xl bg-stone-200/60" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <EmptyState
        icon="wifi-off"
        title={t('Échec du chargement')}
        text={error instanceof Error ? error.message : t('Erreur inconnue.')}
        action={{ label: t('Réessayer'), onClick: () => refetch() }}
      />
    )
  }

  if (!results || results.filtered.length === 0) {
    return (
      <EmptyState
        icon="search"
        title={t('Aucun résultat')}
        text={t('Rien ne correspond ici. Élargissez le rayon, assouplissez les filtres, ou changez de zone.')}
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
  const { t } = useI18n()
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

  const toolBtn = 'flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 font-medium text-ink transition-colors hover:bg-white'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 text-xs text-stone-500">
        <span>
          {results.filtered.length} / {results.rawCount} {t('lieux')}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={download} className={toolBtn}>
            <Icon name={downloaded ? 'check' : 'download'} size={15} />
            <span className="hidden sm:inline">{downloaded ? t('Téléchargé') : t('Télécharger')}</span>
          </button>
          <button onClick={() => setSurpriseOpen(true)} className={toolBtn}>
            <Icon name="dice" size={15} />
            <span className="hidden sm:inline">{t('Surprends-moi')}</span>
          </button>
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>
      </div>
      {results.failedSources.length > 0 && (
        <p className="text-xs text-amber-700">
          {t('Source(s) en échec :')} {results.failedSources.join(', ')}
        </p>
      )}

      {isOutdoor(category) && <WeatherHint position={position} category={category} />}

      {viewMode === 'map' ? (
        <MapView places={mapPlaces} center={position} selectedId={selectedId} onSelect={onSelect} />
      ) : sortBy === 'quality' ? (
        <TieredResults result={results.tiers} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
    <div className="flex overflow-hidden rounded-full border border-line">
      {(['list', 'map'] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          aria-pressed={mode === m}
          aria-label={m === 'list' ? 'Vue liste' : 'Vue carte'}
          className={[
            'flex items-center justify-center px-3 py-1.5 transition-colors',
            mode === m ? 'bg-accent text-white' : 'bg-white text-stone-500 hover:text-ink',
          ].join(' ')}
        >
          <Icon name={m === 'list' ? 'list' : 'map'} size={15} />
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
  icon: IconName
  title: string
  text: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line p-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Icon name={icon} size={22} />
      </span>
      <p className="mt-3 font-serif text-lg text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-stone-500">{text}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
