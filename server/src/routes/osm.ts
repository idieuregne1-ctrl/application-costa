import { Router } from 'express'
import { z } from 'zod'
import { fetchJson } from '../lib/http.js'

export const osmRouter = Router()

/**
 * Proxy OpenStreetMap / Overpass (sans clé).
 * Phase 2 : plages (`natural=beach`). Sentiers, sommets, spots de pêche et
 * lieux culturels seront ajoutés en Phase 6.
 * Le frontend (OSMAdapter) normalise les éléments bruts vers `Place`.
 */

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter'
// Overpass renvoie 406 sans User-Agent identifiable (politique d'usage).
const OSM_USER_AGENT = 'creme-de-la-creme/0.1 (app de découverte voyage)'

const searchSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(100).max(50_000).default(5000),
  category: z.enum(['restaurant', 'activity', 'beach', 'hike', 'fishing', 'culture']),
})

/** Construit la requête Overpass QL selon la catégorie. */
function buildQuery(category: string, lat: number, lng: number, radius: number): string | null {
  const around = `(around:${radius},${lat},${lng})`
  // Plafond élevé : en rando, les sommets sont nombreux et évinceraient sinon
  // les itinéraires balisés (qui portent les infos distance/dénivelé/difficulté).
  const wrap = (body: string) => `[out:json][timeout:25];\n(${body}\n);\nout center tags 150;`

  switch (category) {
    case 'beach':
      return wrap(`
  node["natural"="beach"]${around};
  way["natural"="beach"]${around};
  relation["natural"="beach"]${around};`)

    case 'hike':
      // Deux passes `out` : Overpass sort les nodes AVANT les relations, donc un
      // seul `out` plafonné serait saturé par les sommets et n'inclurait jamais
      // les itinéraires. On garantit les itinéraires balisés (qui portent
      // distance/dénivelé/difficulté) avec leur propre `out`, puis les points.
      return `[out:json][timeout:25];
(
  relation["route"="hiking"]["name"]${around};
);
out center tags 40;
(
  node["natural"="peak"]["name"]${around};
  node["tourism"="viewpoint"]${around};
  node["tourism"="alpine_hut"]${around};
  way["tourism"="alpine_hut"]${around};
);
out center tags 110;`

    case 'fishing':
      // Spots de pêche aménagés + plans d'eau explicitement ouverts à la pêche.
      return wrap(`
  node["leisure"="fishing"]${around};
  way["leisure"="fishing"]${around};
  node["natural"="water"]["fishing"="yes"]${around};
  way["natural"="water"]["fishing"="yes"]${around};
  node["amenity"="fishing"]${around};`)

    case 'culture':
      // Marchés, sites historiques, musées, artisans/produits locaux.
      return wrap(`
  node["amenity"="marketplace"]${around};
  way["amenity"="marketplace"]${around};
  node["historic"]["name"]${around};
  way["historic"]["name"]${around};
  node["tourism"="museum"]${around};
  way["tourism"="museum"]${around};
  node["shop"~"^(art|craft|bakery|cheese|farm)$"]${around};`)

    default:
      return null
  }
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

/**
 * GET /api/osm/search
 * Renvoie les éléments Overpass bruts (avec center calculé) pour la catégorie.
 */
osmRouter.get('/search', async (req, res, next) => {
  try {
    const params = searchSchema.parse(req.query)
    const query = buildQuery(params.category, params.lat, params.lng, params.radius)
    if (!query) {
      return res.json({ elements: [], note: `Catégorie « ${params.category} » non couverte par OSM en Phase 2.` })
    }

    const data = await fetchJson<{ elements?: OverpassElement[] }>(OVERPASS_ENDPOINT, {
      method: 'POST',
      source: 'osm',
      timeoutMs: 30_000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': OSM_USER_AGENT,
        Accept: 'application/json',
      },
      body: `data=${encodeURIComponent(query)}`,
    })

    res.json({ elements: data.elements ?? [] })
  } catch (err) {
    next(err)
  }
})
