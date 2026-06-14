import { Router } from 'express'
import { z } from 'zod'
import { fetchJson } from '../lib/http.js'

export const weatherRouter = Router()

/**
 * WeatherService — Open-Meteo (gratuit, sans clé).
 * Fournit la météo courante + prévision par jour, lever/coucher du soleil, et
 * (pour les lieux côtiers) les conditions marines. Essentiel pour planifier
 * randonnée et pêche. Le backend normalise la réponse Open-Meteo en une forme
 * propre consommée directement par le frontend.
 */

const FORECAST = 'https://api.open-meteo.com/v1/forecast'
const MARINE = 'https://marine-api.open-meteo.com/v1/marine'

const schema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  /** Demande aussi les conditions marines (plage / pêche en bord de mer). */
  marine: z.coerce.boolean().optional(),
})

interface OMForecast {
  current?: { time: string; temperature_2m: number; weather_code: number; wind_speed_10m: number }
  daily?: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    sunrise: string[]
    sunset: string[]
    precipitation_probability_max: (number | null)[]
  }
}

interface OMMarine {
  current?: { wave_height?: number; sea_surface_temperature?: number }
  daily?: { time: string[]; wave_height_max: (number | null)[] }
}

/** GET /api/weather?lat=&lng=&marine=1 */
weatherRouter.get('/', async (req, res, next) => {
  try {
    const { lat, lng, marine } = schema.parse(req.query)

    const forecastUrl =
      `${FORECAST}?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,weather_code,wind_speed_10m` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max` +
      `&timezone=auto&forecast_days=5`

    const data = await fetchJson<OMForecast>(forecastUrl, { source: 'open-meteo' })

    const daily =
      data.daily?.time.map((date, i) => ({
        date,
        weatherCode: data.daily!.weather_code[i],
        tempMax: data.daily!.temperature_2m_max[i],
        tempMin: data.daily!.temperature_2m_min[i],
        sunrise: data.daily!.sunrise[i],
        sunset: data.daily!.sunset[i],
        precipProbabilityMax: data.daily!.precipitation_probability_max[i] ?? null,
      })) ?? []

    const current = data.current
      ? {
          temperature: data.current.temperature_2m,
          weatherCode: data.current.weather_code,
          windSpeed: data.current.wind_speed_10m,
          time: data.current.time,
        }
      : null

    // Conditions marines (optionnelles) : l'API renvoie une erreur pour les points
    // continentaux → on dégrade proprement en `marine: null`.
    let marineData: unknown = null
    if (marine) {
      try {
        const marineUrl =
          `${MARINE}?latitude=${lat}&longitude=${lng}` +
          `&current=wave_height,sea_surface_temperature` +
          `&daily=wave_height_max&timezone=auto&forecast_days=5`
        const m = await fetchJson<OMMarine>(marineUrl, { source: 'open-meteo-marine', timeoutMs: 10_000 })
        marineData = {
          current: {
            waveHeight: m.current?.wave_height ?? null,
            seaSurfaceTemp: m.current?.sea_surface_temperature ?? null,
          },
          daily:
            m.daily?.time.map((date, i) => ({
              date,
              waveHeightMax: m.daily!.wave_height_max[i] ?? null,
            })) ?? [],
        }
      } catch {
        marineData = null // point continental ou API marine indisponible
      }
    }

    res.json({ current, daily, marine: marineData })
  } catch (err) {
    next(err)
  }
})
