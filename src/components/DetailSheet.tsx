import { useEffect, useState } from 'react'
import type { MergedPlace } from '../core'
import { useAppStore } from '../store/useAppStore'
import { useFavorites } from '../store/useFavorites'
import { SOURCE_LABEL, TIER_BADGE, formatDistance, priceText, directionsUrl } from '../lib/format'
import ReviewSummarySection from './ReviewSummarySection'
import WeatherCard, { isOutdoor } from './WeatherCard'
import FavoriteButton from './FavoriteButton'
import Icon from './Icon'

/**
 * Fiche détail en bottom sheet : carrousel photos, note agrégée, consensus,
 * prix, distance, horaire, résumé d'avis IA, météo, et bouton « Y aller ».
 */
export default function DetailSheet({ places }: { places: MergedPlace[] }) {
  const detailId = useAppStore((s) => s.detailPlaceId)
  const close = useAppStore((s) => s.closeDetail)
  const favorites = useFavorites((s) => s.favorites)
  const place =
    places.find((p) => p.id === detailId) ?? (detailId ? (favorites[detailId] ?? null) : null)

  useEffect(() => {
    if (!place) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [place, close])

  if (!place) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-ink/40" onClick={close} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={place.name}
        className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-paper sm:rounded-2xl"
      >
        <Carousel photos={place.photos} alt={place.name} />

        <button
          onClick={close}
          aria-label="Fermer"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm hover:bg-white"
        >
          <Icon name="x" size={18} />
        </button>
        <FavoriteButton place={place} className="absolute left-3 top-3" />

        <div className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-serif text-xl text-ink">{place.name}</h2>
              {place.subtype && <p className="text-sm text-stone-400">{place.subtype}</p>}
            </div>
            {place.tier && (
              <span
                className={`flex-shrink-0 rounded-full border border-line px-2.5 py-1 text-xs font-medium ${place.tier === 'creme' ? 'text-accent' : 'text-stone-600'}`}
              >
                {TIER_BADGE[place.tier].short}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-600">
            {place.rating !== null ? (
              <span className="flex items-center gap-1 font-medium text-ink">
                <Icon name="star" size={14} className="text-accent" />
                {place.rating.toFixed(1)}
                {place.reviewCount !== null && (
                  <span className="font-normal text-stone-400"> · {place.reviewCount} avis</span>
                )}
              </span>
            ) : (
              <span className="text-stone-400">Pas encore de note</span>
            )}
            {place.priceLevel && <span>{priceText(place.priceLevel)}</span>}
            {place.distanceM !== null && <span>{formatDistance(place.distanceM)}</span>}
            {place.openNow === true && <span className="text-emerald-700">Ouvert maintenant</span>}
            {place.openNow === false && <span className="text-red-700">Fermé</span>}
          </div>

          {place.sources.length >= 2 ? (
            <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              <Icon name="check" size={15} strokeWidth={2.5} />
              Recommandé sur {place.sources.map((s) => SOURCE_LABEL[s]).join(' + ')}
            </p>
          ) : (
            <p className="text-xs text-stone-400">Source : {SOURCE_LABEL[place.sources[0]]}</p>
          )}

          {place.trail && (
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-white p-3 text-sm text-stone-700">
              {place.trail.distanceKm != null && <span>Distance · {place.trail.distanceKm} km</span>}
              {place.trail.elevationGainM != null && <span>Dénivelé · {place.trail.elevationGainM} m D+</span>}
              {place.trail.difficulty && <span>Difficulté · {place.trail.difficulty}</span>}
              {place.trail.estimatedDurationMin != null && (
                <span>Durée · {Math.round(place.trail.estimatedDurationMin / 60)} h</span>
              )}
            </div>
          )}

          {place.address && (
            <p className="flex items-start gap-1.5 text-sm text-stone-500">
              <Icon name="pin" size={15} className="mt-0.5 flex-shrink-0 text-stone-400" />
              {place.address}
            </p>
          )}

          <ReviewSummarySection place={place} />

          {place.category === 'fishing' && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Vérifiez le permis et la réglementation de pêche locaux avant de partir. Les
              informations sur ces spots peuvent être incomplètes.
            </p>
          )}

          {isOutdoor(place.category) && <WeatherCard place={place} open />}

          <div className="flex gap-2 pt-1">
            <a
              href={directionsUrl(place.lat, place.lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-3 font-medium text-white hover:bg-accent-dark"
            >
              <Icon name="navigation" size={17} />
              Y aller
            </a>
            {place.sourceUrl && (
              <a
                href={place.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center rounded-xl border border-line px-4 py-3 text-sm text-stone-600 hover:bg-white"
              >
                Source
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Carrousel de photos simple (précédent / suivant). */
function Carousel({ photos, alt }: { photos: string[]; alt: string }) {
  const [index, setIndex] = useState(0)

  if (photos.length === 0) {
    return (
      <div className="flex h-48 w-full items-center justify-center bg-stone-100 text-stone-300">
        <Icon name="pin" size={36} />
      </div>
    )
  }

  const go = (delta: number) => setIndex((i) => (i + delta + photos.length) % photos.length)

  return (
    <div className="relative h-60 w-full bg-stone-100">
      <img src={photos[index]} alt={alt} className="h-full w-full object-cover" />
      {photos.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            aria-label="Photo précédente"
            className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm hover:bg-white"
          >
            <Icon name="chevron-left" size={18} />
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Photo suivante"
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm hover:bg-white"
          >
            <Icon name="chevron-right" size={18} />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {photos.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/60'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
