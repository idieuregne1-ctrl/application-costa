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
    ? { text: 'Risque de pluie aujourd’hui', cls: 'text-amber-700' }
    : { text: 'Bonne journée pour sortir', cls: 'text-emerald-700' }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-line bg-white px-3 py-2 text-xs">
      <span className="text-base">{emoji}</span>
      <span className="font-medium text-ink">
        {Math.round(today.tempMax)}° / {Math.round(today.tempMin)}°
      </span>
      <span className="text-stone-500">{label}</span>
      <span className={sentiment.cls}>· {sentiment.text}</span>
      <span className="ml-auto text-stone-400">
        Lever {timeOf(today.sunrise)} · Coucher {timeOf(today.sunset)}
      </span>
    </div>
  )
}
