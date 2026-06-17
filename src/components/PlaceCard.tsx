import type { MergedPlace } from '../core'
import { SOURCE_LABEL, TIER_BADGE, formatDistance, priceText } from '../lib/format'
import FavoriteButton from './FavoriteButton'
import Icon from './Icon'
import { useI18n } from '../lib/i18n'

/**
 * Carte de lieu : grande photo, nom, note, palier, consensus multi-sources,
 * distance, prix. Cliquable → ouvre la fiche détail.
 */

interface PlaceCardProps {
  place: MergedPlace
  selected?: boolean
  onSelect: (place: MergedPlace) => void
}

export default function PlaceCard({ place, selected, onSelect }: PlaceCardProps) {
  const { t } = useI18n()
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
        'group block w-full cursor-pointer overflow-hidden rounded-xl border bg-white text-left shadow-card transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        selected ? 'border-accent ring-1 ring-accent' : 'border-line hover:border-stone-300',
      ].join(' ')}
    >
      {/* Photo + overlays */}
      <div className="relative h-44 w-full bg-stone-100">
        {place.photos[0] ? (
          <img
            src={place.photos[0]}
            alt={place.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-stone-100 text-stone-300">
            <Icon name="pin" size={28} />
          </div>
        )}

        {tier && (
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-medium shadow-sm ${TIER_BADGE[tier].cls}`}
          >
            {TIER_BADGE[tier].short}
          </span>
        )}
        {consensus && (
          <span className="absolute right-12 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-emerald-700 shadow-sm">
            <Icon name="check" size={11} strokeWidth={2.5} />
            {place.sources.length} {t('sources')}
          </span>
        )}

        <FavoriteButton place={place} className="absolute right-3 top-2.5" />
      </div>

      {/* Texte */}
      <div className="p-3.5">
        <h3 className="truncate font-serif text-[17px] font-medium leading-snug text-ink">{place.name}</h3>
        {place.subtype && <p className="mt-0.5 truncate text-xs text-stone-400">{place.subtype}</p>}

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
          {place.rating !== null ? (
            <span className="flex items-center gap-1 font-medium text-ink">
              <Icon name="star" size={13} className="text-accent" />
              {place.rating.toFixed(1)}
              {place.reviewCount !== null && (
                <span className="font-normal text-stone-400">({place.reviewCount})</span>
              )}
            </span>
          ) : (
            <span className="text-stone-400">{t('Pas de note')}</span>
          )}
          {place.priceLevel && <span>{priceText(place.priceLevel)}</span>}
          {place.distanceM !== null && <span>{formatDistance(place.distanceM)}</span>}
          {place.openNow === true && <span className="text-emerald-700">{t('Ouvert')}</span>}
          {place.openNow === false && <span className="text-red-700">{t('Fermé')}</span>}
          <span className="ml-auto text-stone-400">
            {consensus
              ? place.sources.map((s) => SOURCE_LABEL[s]).join(' + ')
              : SOURCE_LABEL[place.sources[0]]}
          </span>
        </div>
      </div>
    </div>
  )
}
