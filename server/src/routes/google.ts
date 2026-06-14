import { Router } from 'express'
import { z } from 'zod'
import { env, requireKey } from '../lib/env.js'
import { fetchJson, UpstreamError } from '../lib/http.js'

export const googleRouter = Router()

/**
 * Proxy Google Places API (New) v1.
 * La clé GOOGLE_PLACES_API_KEY reste côté serveur (header X-Goog-Api-Key) et
 * n'est jamais renvoyée au client. Le frontend (GooglePlacesAdapter) normalise
 * la réponse brute vers le type `Place`.
 */

const PLACES_BASE = 'https://places.googleapis.com/v1'

// Champs demandés via FieldMask — on ne paie que ce qu'on liste.
const SEARCH_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.priceLevel',
  'places.photos',
  'places.formattedAddress',
  'places.currentOpeningHours.openNow',
  'places.types',
  'places.googleMapsUri',
  'places.primaryTypeDisplayName',
].join(',')

const searchSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(100).max(50_000).default(5000),
  category: z.enum(['restaurant', 'activity', 'beach', 'hike', 'fishing', 'culture']),
  query: z.string().trim().min(1).max(200).optional(),
})

/** Types Google Places (New) interrogés par catégorie pour la recherche à proximité. */
const TYPES_BY_CATEGORY: Record<string, string[]> = {
  restaurant: ['restaurant'],
  activity: ['tourist_attraction', 'amusement_park', 'park', 'night_club', 'art_gallery'],
  culture: ['museum', 'art_gallery', 'historical_landmark', 'tourist_attraction'],
  // beach / hike passent par OSM ; fishing complète OSM via une recherche texte.
}

/**
 * Requête texte par défaut pour les catégories peu couvertes par les `types`
 * Google. La pêche étant mal documentée, on complète OSM par une recherche texte.
 */
const DEFAULT_TEXT_QUERY: Record<string, string> = {
  fishing: 'spot de pêche',
}

/**
 * GET /api/google/search
 * Recherche à proximité (ou recherche texte si `query` fourni).
 */
googleRouter.get('/search', async (req, res, next) => {
  try {
    const key = requireKey(env.GOOGLE_PLACES_API_KEY, 'GOOGLE_PLACES_API_KEY')
    const params = searchSchema.parse(req.query)

    const center = { latitude: params.lat, longitude: params.lng }
    const textQuery = params.query ?? DEFAULT_TEXT_QUERY[params.category]
    let url: string
    let body: Record<string, unknown>

    if (textQuery) {
      // Recherche texte : cuisines, « spot de pêche », etc.
      url = `${PLACES_BASE}/places:searchText`
      body = {
        textQuery,
        locationBias: { circle: { center, radius: params.radius } },
        maxResultCount: 20,
        languageCode: 'fr',
      }
    } else {
      // Recherche à proximité par types.
      const includedTypes = TYPES_BY_CATEGORY[params.category]
      if (!includedTypes) {
        return res.json({ places: [], note: `Catégorie « ${params.category} » non couverte par Google (voir OSM).` })
      }
      url = `${PLACES_BASE}/places:searchNearby`
      body = {
        includedTypes,
        maxResultCount: 20,
        rankPreference: 'POPULARITY',
        locationRestriction: { circle: { center, radius: params.radius } },
        languageCode: 'fr',
      }
    }

    const data = await fetchJson<{ places?: unknown[] }>(url, {
      method: 'POST',
      source: 'google',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': SEARCH_FIELD_MASK,
      },
      body: JSON.stringify(body),
    })

    res.json({ places: data.places ?? [] })
  } catch (err) {
    next(err)
  }
})

const DETAILS_FIELD_MASK = [
  'id',
  'displayName',
  'location',
  'rating',
  'userRatingCount',
  'priceLevel',
  'photos',
  'formattedAddress',
  'currentOpeningHours',
  'types',
  'googleMapsUri',
  'reviews',
  'websiteUri',
  'internationalPhoneNumber',
].join(',')

/**
 * GET /api/google/details/:id
 * Détails d'un lieu (incluant les avis) — appelé seulement à l'ouverture d'une
 * fiche pour limiter les coûts (Phases 4 et 7).
 */
googleRouter.get('/details/:id', async (req, res, next) => {
  try {
    const key = requireKey(env.GOOGLE_PLACES_API_KEY, 'GOOGLE_PLACES_API_KEY')
    const id = z.string().min(1).parse(req.params.id)
    const data = await fetchJson(`${PLACES_BASE}/places/${encodeURIComponent(id)}?languageCode=fr`, {
      source: 'google',
      headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': DETAILS_FIELD_MASK },
    })
    res.json(data)
  } catch (err) {
    next(err)
  }
})

const photoSchema = z.object({
  // Nom de ressource photo Google, ex : places/XXX/photos/YYY
  ref: z.string().min(1).max(500),
  maxw: z.coerce.number().min(50).max(1600).default(600),
})

/**
 * GET /api/google/photo?ref=...&maxw=...
 * Proxie le binaire d'une photo Google pour masquer la clé. Le client référence
 * cette route au lieu de l'URL Google directe.
 */
googleRouter.get('/photo', async (req, res, next) => {
  try {
    const key = requireKey(env.GOOGLE_PLACES_API_KEY, 'GOOGLE_PLACES_API_KEY')
    const { ref, maxw } = photoSchema.parse(req.query)
    const url = `${PLACES_BASE}/${ref}/media?maxWidthPx=${maxw}&key=${key}`
    const upstream = await fetch(url)
    if (!upstream.ok || !upstream.body) {
      throw new UpstreamError(upstream.status, 'google', 'Photo introuvable')
    }
    res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=86400')
    const buffer = Buffer.from(await upstream.arrayBuffer())
    res.send(buffer)
  } catch (err) {
    next(err)
  }
})
