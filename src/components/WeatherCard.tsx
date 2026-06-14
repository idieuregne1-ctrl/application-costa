import type { MergedPlace } from '../core'
import { useWeather } from '../hooks/useWeather'
import { describeWeather, timeOf, shortDay } from '../lib/weather'

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
  const wantsMarine = COASTAL.has(place.category)
  const { data, isLoading, isError } = useWeather(place.lat, place.lng, wantsMarine, open)

  if (isLoading) {
    return <div className="h-24 animate-pulse rounded-xl bg-slate-800/40" />
  }
  if (isError || !data) {
    return <p className="text-xs text-slate-500">Météo indisponible pour le moment.</p>
  }

  const today = data.daily[0]
  const current = data.current

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-800/30 p-3">
      <h3 className="mb-2 text-sm font-semibold text-slate-200">🌤️ Météo</h3>

      {/* Conditions actuelles + soleil */}
      <div className="flex items-center justify-between">
        {current && (
          <div className="flex items-center gap-2">
            <span className="text-2xl">{describeWeather(current.weatherCode).emoji}</span>
            <div>
              <p className="text-lg font-semibold text-white">{Math.round(current.temperature)}°C</p>
              <p className="text-xs text-slate-400">{describeWeather(current.weatherCode).label}</p>
            </div>
          </div>
        )}
        {today && (
          <div className="text-right text-xs text-slate-400">
            <p>🌅 {timeOf(today.sunrise)}</p>
            <p>🌇 {timeOf(today.sunset)}</p>
          </div>
        )}
      </div>

      {/* Prévision 5 jours */}
      <div className="mt-3 grid grid-cols-5 gap-1 text-center">
        {data.daily.map((d, i) => (
          <div key={d.date} className="rounded-lg bg-slate-800/50 py-1.5">
            <p className="text-[11px] text-slate-400">{i === 0 ? "Auj." : shortDay(d.date)}</p>
            <p className="text-base">{describeWeather(d.weatherCode).emoji}</p>
            <p className="text-[11px] font-medium text-slate-200">{Math.round(d.tempMax)}°</p>
            <p className="text-[10px] text-slate-500">{Math.round(d.tempMin)}°</p>
            {d.precipProbabilityMax !== null && d.precipProbabilityMax >= 30 && (
              <p className="text-[10px] text-sky-400">💧{d.precipProbabilityMax}%</p>
            )}
          </div>
        ))}
      </div>

      {/* Conditions marines (plage / pêche en bord de mer) */}
      {data.marine && (data.marine.current.waveHeight !== null || data.marine.current.seaSurfaceTemp !== null) && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-800 pt-2 text-xs text-slate-300">
          {data.marine.current.waveHeight !== null && (
            <span>🌊 Vagues {data.marine.current.waveHeight.toFixed(1)} m</span>
          )}
          {data.marine.current.seaSurfaceTemp !== null && (
            <span>🌡️ Mer {Math.round(data.marine.current.seaSurfaceTemp)}°C</span>
          )}
        </div>
      )}
    </section>
  )
}
