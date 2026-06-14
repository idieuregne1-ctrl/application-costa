import { Router } from 'express'
import { z } from 'zod'
import { env, requireKey } from '../lib/env.js'
import { fetchJson } from '../lib/http.js'

export const foursquareRouter = Router()

/**
 * Proxy Foursquare Places API (v3).
 * Renforce le consensus multi-sources (« Recommandé sur Google + Foursquare »).
 * La clé FOURSQUARE_API_KEY reste côté serveur ; le frontend normalise la réponse.
 */

const FSQ_BASE = 'https://api.foursquare.com/v3/places/search'

const FIELDS = [
  'fsq_id',
  'name',
  'geocodes',
  'location',
  'categories',
  'rating',
  'stats',
  'price',
  'photos',
  'hours',
  'website',
].join(',')

/** Catégories Foursquare interrogées par catégorie d'app (IDs racine). */
const FSQ_CATEGORIES: Record<string, string> = {
  restaurant: '13000', // Dining and Drinking
  activity: '10000', // Arts and Entertainment
  culture: '10000,12000', // Arts & Entertainment + Community (musées, sites)
}

const schema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(100).max(100_000).default(5000),
  category: z.enum(['restaurant', 'activity', 'beach', 'hike', 'fishing', 'culture']),
  query: z.string().trim().min(1).max(200).optional(),
})

/** GET /api/foursquare/search */
foursquareRouter.get('/search', async (req, res, next) => {
  try {
    const key = requireKey(env.FOURSQUARE_API_KEY, 'FOURSQUARE_API_KEY')
    const params = schema.parse(req.query)

    const categories = FSQ_CATEGORIES[params.category]
    if (!categories && !params.query) {
      return res.json({ results: [], note: `Catégorie « ${params.category} » non couverte par Foursquare.` })
    }

    const search = new URLSearchParams({
      ll: `${params.lat},${params.lng}`,
      radius: String(params.radius),
      limit: '20',
      sort: 'POPULARITY',
      fields: FIELDS,
    })
    if (categories) search.set('categories', categories)
    if (params.query) search.set('query', params.query)

    const data = await fetchJson<{ results?: unknown[] }>(`${FSQ_BASE}?${search.toString()}`, {
      source: 'foursquare',
      headers: { Authorization: key, Accept: 'application/json' },
    })

    res.json({ results: data.results ?? [] })
  } catch (err) {
    next(err)
  }
})
