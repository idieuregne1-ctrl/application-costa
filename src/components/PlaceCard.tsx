import type { MergedPlace } from '../core'
import { SOURCE_LABEL, TIER_BADGE, formatDistance, priceText } from '../lib/format'
import FavoriteButton from './FavoriteButton'

/**
 * Carte de lieu visuelle (Phase 4) : grande photo, nom, note, badge de palier
 * et de consensus multi-sources, distance, prix. Cliquable → ouvre la fiche détail.
 */

interface PlaceCardProps {
  place: MergedPlace
  selected?: boolean
  onSelect: (place: MergedPlace) => void
}

export default function PlaceCard({ place, selected, onSelect }: PlaceCardProps) {
  const consensus = place.sources.length >= 2
  const tier = place.tier

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(place)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(place)
        }
      }}
      className={[
        'group block w-full cursor-pointer overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-creme-500',
        selected ? 'ring-2 ring-creme-500' : 'hover:border-slate-700',
      ].join(' ')}
    >
      {/* Photo + overlays */}
      <div className="relative h-40 w-full bg-slate-800">
        {place.photos[0] ? (
          <img
            src={place.photos[0]}
            alt={place.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-4xl">
            📍
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {tier && (
          <span
            className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-medium backdrop-blur ${TIER_BADGE[tier].cls}`}
          >
            {TIER_BADGE[tier].emoji} {TIER_BADGE[tier].label}
          </span>
        )}
        {consensus && (
          <span className="absolute left-2 top-2 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[11px] font-medium text-emerald-950 backdrop-blur">
            ✓ {place.sources.length} sources
          </span>
        )}

        <FavoriteButton place={place} className="absolute bottom-2 right-2" />

        <div className="absolute bottom-0 left-0 right-12 p-3">
          <h3 className="truncate font-semibold text-white">{place.name}</h3>
          {place.subtype && <p className="truncate text-xs text-white/70">{place.subtype}</p>}
        </div>
      </div>

      {/* Méta */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-xs text-slate-400">
        {place.rating !== null ? (
          <span className="font-medium text-slate-200">
            ⭐ {place.rating.toFixed(1)}
            {place.reviewCount !== null && (
              <span className="font-normal text-slate-500"> ({place.reviewCount})</span>
            )}
          </span>
        ) : (
          <span className="text-slate-600">Pas de note</span>
        )}
        {place.priceLevel && <span>{priceText(place.priceLevel)}</span>}
        {place.distanceM !== null && <span>{formatDistance(place.distanceM)}</span>}
        {place.openNow === true && <span className="text-emerald-400">Ouvert</span>}
        {place.openNow === false && <span className="text-red-400">Fermé</span>}
        <span className="ml-auto text-slate-600">
          {consensus
            ? place.sources.map((s) => SOURCE_LABEL[s]).join(' + ')
            : SOURCE_LABEL[place.sources[0]]}
        </span>
      </div>
    </div>
  )
}
