import { useEffect, useState } from 'react'
import type { MergedPlace } from '../core'
import { useAppStore } from '../store/useAppStore'
import { useFavorites } from '../store/useFavorites'
import {
  SOURCE_LABEL,
  TIER_BADGE,
  formatDistance,
  priceText,
  directionsUrl,
} from '../lib/format'
import ReviewSummarySection from './ReviewSummarySection'
import WeatherCard, { isOutdoor } from './WeatherCard'
import FavoriteButton from './FavoriteButton'

/**
 * Fiche détail en bottom sheet : carrousel photos, note agrégée, consensus,
 * prix, distance, horaire, et un bouton « Y aller » (itinéraire Google/Apple Maps).
 * Le résumé d'avis IA (Phase 7), la météo (Phase 8) et les infos sentier (Phase 6)
 * viendront enrichir cette fiche.
 */

export default function DetailSheet({ places }: { places: MergedPlace[] }) {
  const detailId = useAppStore((s) => s.detailPlaceId)
  const close = useAppStore((s) => s.closeDetail)
  const favorites = useFavorites((s) => s.favorites)
  // Cherche dans les résultats courants, puis dans les favoris (pour ouvrir un
  // favori même s'il n'est pas dans la liste affichée).
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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={place.name}
        className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-slate-900 sm:rounded-3xl"
      >
        <Carousel photos={place.photos} alt={place.name} />

        <button
          onClick={close}
          aria-label="Fermer"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70"
        >
          ✕
        </button>
        <FavoriteButton place={place} className="absolute left-3 top-3" />

        <div className="space-y-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-white">{place.name}</h2>
              {place.subtype && <p className="text-sm text-slate-400">{place.subtype}</p>}
            </div>
            {place.tier && (
              <span
                className={`flex-shrink-0 rounded-full px-2 py-1 text-xs font-medium ${TIER_BADGE[place.tier].cls}`}
              >
                {TIER_BADGE[place.tier].emoji} {TIER_BADGE[place.tier].label}
              </span>
            )}
          </div>

          {/* Méta principale */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-300">
            {place.rating !== null ? (
              <span className="font-medium text-white">
                ⭐ {place.rating.toFixed(1)}
                {place.reviewCount !== null && (
                  <span className="font-normal text-slate-500"> · {place.reviewCount} avis</span>
                )}
              </span>
            ) : (
              <span className="text-slate-500">Pas encore de note</span>
            )}
            {place.priceLevel && <span>{priceText(place.priceLevel)}</span>}
            {place.distanceM !== null && <span>{formatDistance(place.distanceM)}</span>}
            {place.openNow === true && <span className="text-emerald-400">Ouvert maintenant</span>}
            {place.openNow === false && <span className="text-red-400">Fermé</span>}
          </div>

          {/* Consensus de sources */}
          {place.sources.length >= 2 ? (
            <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              ✓ Recommandé sur {place.sources.map((s) => SOURCE_LABEL[s]).join(' + ')}
            </p>
          ) : (
            <p className="text-xs text-slate-500">Source : {SOURCE_LABEL[place.sources[0]]}</p>
          )}

          {/* Infos sentier (plein air) — remplies en Phase 6 */}
          {place.trail && (
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-800/60 p-3 text-sm text-slate-300">
              {place.trail.distanceKm != null && <span>📏 {place.trail.distanceKm} km</span>}
              {place.trail.elevationGainM != null && <span>⛰️ {place.trail.elevationGainM} m D+</span>}
              {place.trail.difficulty && <span>🥾 {place.trail.difficulty}</span>}
              {place.trail.estimatedDurationMin != null && (
                <span>⏱️ {Math.round(place.trail.estimatedDurationMin / 60)} h</span>
              )}
            </div>
          )}

          {place.address && <p className="text-sm text-slate-400">📍 {place.address}</p>}

          {/* Résumé d'avis IA (Phase 7) */}
          <ReviewSummarySection place={place} />

          {/* Avertissement pêche : permis & règlements locaux */}
          {place.category === 'fishing' && (
            <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
              ⚠️ Vérifie le permis et la réglementation de pêche locaux avant de partir. Les
              informations sur ces spots peuvent être incomplètes.
            </p>
          )}

          {/* Encart météo (lieux de plein air) */}
          {isOutdoor(place.category) && <WeatherCard place={place} open />}

          <div className="flex gap-2 pt-1">
            <a
              href={directionsUrl(place.lat, place.lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-creme-500 py-3 font-medium text-slate-950 hover:bg-creme-400"
            >
              🧭 Y aller
            </a>
            {place.sourceUrl && (
              <a
                href={place.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
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
      <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-5xl">
        📍
      </div>
    )
  }

  const go = (delta: number) =>
    setIndex((i) => (i + delta + photos.length) % photos.length)

  return (
    <div className="relative h-56 w-full bg-slate-800">
      <img src={photos[index]} alt={alt} className="h-full w-full object-cover" />
      {photos.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            aria-label="Photo précédente"
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            ‹
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Photo suivante"
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            ›
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {photos.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
