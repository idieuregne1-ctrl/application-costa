/** Types et helpers météo (Open-Meteo). */

export interface CurrentWeather {
  temperature: number
  weatherCode: number
  windSpeed: number
  time: string
}

export interface DailyForecast {
  date: string
  weatherCode: number
  tempMax: number
  tempMin: number
  sunrise: string
  sunset: string
  precipProbabilityMax: number | null
}

export interface MarineData {
  current: { waveHeight: number | null; seaSurfaceTemp: number | null }
  daily: { date: string; waveHeightMax: number | null }[]
}

export interface WeatherData {
  current: CurrentWeather | null
  daily: DailyForecast[]
  marine: MarineData | null
}

/** Libellé + emoji d'un code météo WMO (Open-Meteo). */
export function describeWeather(code: number): { label: string; emoji: string } {
  if (code === 0) return { label: 'Ciel dégagé', emoji: '☀️' }
  if (code === 1) return { label: 'Peu nuageux', emoji: '🌤️' }
  if (code === 2) return { label: 'Partiellement nuageux', emoji: '⛅' }
  if (code === 3) return { label: 'Couvert', emoji: '☁️' }
  if (code === 45 || code === 48) return { label: 'Brouillard', emoji: '🌫️' }
  if (code >= 51 && code <= 57) return { label: 'Bruine', emoji: '🌦️' }
  if (code >= 61 && code <= 65) return { label: 'Pluie', emoji: '🌧️' }
  if (code === 66 || code === 67) return { label: 'Pluie verglaçante', emoji: '🌧️' }
  if (code >= 71 && code <= 77) return { label: 'Neige', emoji: '🌨️' }
  if (code >= 80 && code <= 82) return { label: 'Averses', emoji: '🌦️' }
  if (code === 85 || code === 86) return { label: 'Averses de neige', emoji: '🌨️' }
  if (code === 95) return { label: 'Orage', emoji: '⛈️' }
  if (code === 96 || code === 99) return { label: 'Orage de grêle', emoji: '⛈️' }
  return { label: 'Variable', emoji: '🌡️' }
}

/** Extrait « HH:MM » d'un horodatage ISO Open-Meteo (heure locale du lieu). */
export function timeOf(iso: string): string {
  return iso.length >= 16 ? iso.slice(11, 16) : iso
}

/** Jour de la semaine court (lun., mar.…) pour une date ISO. */
export function shortDay(dateIso: string): string {
  // Construit la date en UTC pour éviter tout décalage de fuseau.
  const [y, m, d] = dateIso.split('-').map(Number)
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'][day]
}
