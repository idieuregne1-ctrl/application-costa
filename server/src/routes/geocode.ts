import { Router } from 'express'
import { z } from 'zod'
import { fetchJson } from '../lib/http.js'

export const geocodeRouter = Router()

/**
 * Géocodage via Nominatim (OpenStreetMap, sans clé).
 * Convertit « Nice », « Biarritz, France »… en coordonnées pour la recherche
 * manuelle. Nominatim exige un User-Agent identifiable (politique d'usage).
 */

const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
const USER_AGENT = 'creme-de-la-creme/0.1 (app de découverte voyage)'

const schema = z.object({
  q: z.string().trim().min(2).max(200),
  limit: z.coerce.number().min(1).max(10).default(5),
})

interface NominatimResult {
  lat: string
  lon: string
  display_name: string
  type: string
  importance?: number
}

/**
 * GET /api/geocode?q=...
 * Renvoie une liste de candidats { name, lat, lng }.
 */
geocodeRouter.get('/', async (req, res, next) => {
  try {
    const { q, limit } = schema.parse(req.query)
    const url = `${NOMINATIM}?q=${encodeURIComponent(q)}&format=json&limit=${limit}&addressdetails=0&accept-language=fr`
    const data = await fetchJson<NominatimResult[]>(url, {
      source: 'nominatim',
      headers: { 'User-Agent': USER_AGENT },
    })
    const results = data.map((r) => ({
      name: r.display_name,
      lat: Number(r.lat),
      lng: Number(r.lon),
      type: r.type,
    }))
    res.json({ results })
  } catch (err) {
    next(err)
  }
})
