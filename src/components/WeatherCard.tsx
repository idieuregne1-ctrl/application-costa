import type { MergedPlace } from '../core'
import { useWeather } from '../hooks/useWeather'
import { describeWeather, timeOf, shortDay } from '../lib/weather'
import { useI18n } from '../lib/i18n'

/**
 * Encart météo de la fiche détail (lieux de plein air) : conditions actuelles,
 * lever/coucher du soleil, prévision sur 5 jours, et conditions marines pour les
 * lieux côtiers (plage / pêche).
 */

/** Catégories pour lesquelles la météo est pertinente. */
const OUTDOOR = new Set(['beach', 'hike', 'fishing'])
/** Catégories côtières → on demande aussi les conditions marines. */
const COASTAL = new Set(['beach', 'fishing'])

export function isOutdoor(category: string): boolean {
  return OUTDOOR.has(category)
}

export default function WeatherCard({ place, open }: { place: MergedPlace; open: boolean }) {
  const { t: tr } = useI18n()
  const wantsMarine = COASTAL.has(place.category)
  const { data, isLoading, isError } = useWeather(place.lat, place.lng, wantsMarine, open)

  if (isLoading) {
    return <div className="h-24 animate-pulse rounded-xl bg-stone-200/60" />
  }
  if (isError || !data) {
    return <p className="text-xs text-stone-400">{tr('Météo indisponible pour le moment.')}</p>
  }

  const today = data.daily[0]
  const current = data.current

  return (
    <section className="rounded-xl border border-line bg-white p-3.5">
      <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-stone-400">{tr('Météo')}</h3>

      {/* Conditions actuelles + soleil */}
      <div className="flex items-center justify-between">
        {current && (
          <div className="flex items-center gap-2">
            <span className="text-2xl">{describeWeather(current.weatherCode).emoji}</span>
            <div>
              <p className="text-lg font-semibold text-ink">{Math.round(current.temperature)}°C</p>
              <p className="text-xs text-stone-500">{describeWeather(current.weatherCode).label}</p>
            </div>
          </div>
        )}
        {today && (
          <div className="text-right text-xs text-stone-500">
            <p>{tr('Lever')} {timeOf(today.sunrise)}</p>
            <p>{tr('Coucher')} {timeOf(today.sunset)}</p>
          </div>
        )}
      </div>

      {/* Prévision 5 jours */}
      <div className="mt-3 grid grid-cols-5 gap-1.5 text-center">
        {data.daily.map((d, i) => (
          <div key={d.date} className="rounded-lg bg-stone-50 py-2">
            <p className="text-[11px] text-stone-400">{i === 0 ? tr('Auj.') : shortDay(d.date)}</p>
            <p className="text-base">{describeWeather(d.weatherCode).emoji}</p>
            <p className="text-[11px] font-medium text-ink">{Math.round(d.tempMax)}°</p>
            <p className="text-[10px] text-stone-400">{Math.round(d.tempMin)}°</p>
            {d.precipProbabilityMax !== null && d.precipProbabilityMax >= 30 && (
              <p className="text-[10px] text-sky-600">{d.precipProbabilityMax}%</p>
            )}
          </div>
        ))}
      </div>

      {/* Conditions marines (plage / pêche en bord de mer) */}
      {data.marine && (data.marine.current.waveHeight !== null || data.marine.current.seaSurfaceTemp !== null) && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-2.5 text-xs text-stone-600">
          {data.marine.current.waveHeight !== null && (
            <span>{tr('Vagues')} {data.marine.current.waveHeight.toFixed(1)} m</span>
          )}
          {data.marine.current.seaSurfaceTemp !== null && (
            <span>{tr('Mer')} {Math.round(data.marine.current.seaSurfaceTemp)}°C</span>
          )}
        </div>
      )}
    </section>
  )
}
