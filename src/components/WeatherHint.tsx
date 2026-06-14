import { useWeather } from '../hooks/useWeather'
import { describeWeather, timeOf } from '../lib/weather'
import type { Coords } from '../store/useAppStore'

/**
 * Indice météo du jour au-dessus des résultats plein air (rando/pêche/plage).
 * Donne un go/no-go rapide pour les presets « Rando du matin » / « Sortie pêche ».
 */

const COASTAL = new Set(['beach', 'fishing'])

export default function WeatherHint({
  position,
  category,
}: {
  position: Coords
  category: string
}) {
  const { data } = useWeather(position.lat, position.lng, COASTAL.has(category), true)
  const today = data?.daily[0]
  if (!today) return null

  const { emoji, label } = describeWeather(today.weatherCode)
  const rainy = (today.precipProbabilityMax ?? 0) >= 50
  const sentiment = rainy
    ? { text: 'Risque de pluie aujourd’hui', cls: 'text-amber-300' }
    : { text: 'Bonne journée pour sortir', cls: 'text-emerald-300' }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-slate-800 bg-slate-800/30 px-3 py-2 text-xs">
      <span className="text-base">{emoji}</span>
      <span className="font-medium text-slate-200">
        {Math.round(today.tempMax)}° / {Math.round(today.tempMin)}°
      </span>
      <span className="text-slate-400">{label}</span>
      <span className={sentiment.cls}>· {sentiment.text}</span>
      <span className="ml-auto text-slate-500">
        🌅 {timeOf(today.sunrise)} · 🌇 {timeOf(today.sunset)}
      </span>
    </div>
  )
}
