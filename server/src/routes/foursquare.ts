import { Router } from 'express'
import { z } from 'zod'
import { env, requireKey } from '../lib/env.js'
import { fetchJson } from '../lib/http.js'

export const foursquareRouter = Router()

/**
 * Proxy Foursquare Places API (nouvelle API, post-migration 2025).
 *
 * ⚠️ L'ancienne API v3 (api.foursquare.com/v3) a été RETIRÉE (HTTP 410). On cible
 * donc la nouvelle API :
 *   - base : https://places-api.foursquare.com/places/search
 *   - auth : Authorization: Bearer <SERVICE_KEY>
 *   - header de version requis : X-Places-Api-Version
 * Les anciennes clés « fsq3… » de la v3 ne sont PAS acceptées : il faut une
 * « Service Key » générée dans la console Foursquare à jour.
 *
 * La clé FOURSQUARE_API_KEY reste côté serveur ; le frontend normalise la réponse
 * (de façon défensive, pour gérer les variations de schéma).
 */

const FSQ_BASE = 'https://places-api.foursquare.com/places/search'
const FSQ_API_VERSION = '2025-06-17'

const FIELDS = [
  'fsq_place_id',
  'name',
  'latitude',
  'longitude',
  'location',
  'categories',
  'rating',
  'price',
  'hours',
  'photos',
  'website',
  'distance',
].join(',')

/** Requête texte par défaut par catégorie (la taxonomie de catégories a changé,
 *  la recherche texte est plus robuste à travers les versions). */
const DEFAULT_QUERY: Record<string, string> = {
  restaurant: 'restaurant',
  activity: 'attraction',
  culture: 'musée',
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

    const query = params.query ?? DEFAULT_QUERY[params.category]
    if (!query) {
      return res.json({ results: [], note: `Catégorie « ${params.category} » non couverte par Foursquare.` })
    }

    const search = new URLSearchParams({
      query,
      ll: `${params.lat},${params.lng}`,
      radius: String(params.radius),
      limit: '20',
      sort: 'POPULARITY',
      fields: FIELDS,
    })

    const data = await fetchJson<{ results?: unknown[] }>(`${FSQ_BASE}?${search.toString()}`, {
      source: 'foursquare',
      headers: {
        Authorization: `Bearer ${key}`,
        'X-Places-Api-Version': FSQ_API_VERSION,
        Accept: 'application/json',
      },
    })

    res.json({ results: data.results ?? [] })
  } catch (err) {
    next(err)
  }
})
