import { apiGet, apiUrl } from '../lib/api'
import { SUBTYPE } from '../core/subtypes'
import type { Place, PlaceProvider, SearchParams, TrailDifficulty, TrailInfo } from './types'

/**
 * Adapter OpenStreetMap / Overpass.
 * Couvre les plages, le plein air (sentiers, sommets, points de vue, refuges,
 * spots de pêche) et la culture locale (marchés, sites historiques, musées,
 * artisans). Les lieux OSM n'ont ni note ni avis → rating/reviewCount = null
 * (le scoring les traite comme « peu documentés »).
 */

interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

type Tags = Record<string, string>

/** Mappe l'échelle SAC (OSM) vers notre difficulté. */
function difficultyFromSac(sac?: string): TrailDifficulty | undefined {
  switch (sac) {
    case 'hiking':
    case 'T1':
      return 'facile'
    case 'mountain_hiking':
    case 'T2':
    case 'T3':
      return 'modéré'
    case 'demanding_mountain_hiking':
    case 'alpine_hiking':
    case 'demanding_alpine_hiking':
    case 'difficult_alpine_hiking':
    case 'T4':
    case 'T5':
    case 'T6':
      return 'difficile'
    default:
      return undefined
  }
}

/** Parse une distance OSM (« 12 », « 12 km », « 12000 ») en km. */
function parseDistanceKm(raw?: string): number | undefined {
  if (!raw) return undefined
  // Le tag `distance` est parfois une durée (« 3.45 hours », « 2h30 ») : on l'ignore.
  if (/\b(h|hr|hrs|hour|hours|heure|heures|min|minutes)\b/i.test(raw)) return undefined
  const n = parseFloat(raw.replace(',', '.'))
  if (Number.isNaN(n)) return undefined
  // Heuristique : > 100 ⇒ probablement des mètres.
  return n > 100 ? Math.round((n / 1000) * 10) / 10 : n
}

/** Construit les infos sentier pour un itinéraire de randonnée, si disponibles. */
function buildTrail(tags: Tags): TrailInfo | undefined {
  const distanceKm = parseDistanceKm(tags.distance)
  const elevationGainM = tags.ascent ? parseInt(tags.ascent, 10) : undefined
  const difficulty = difficultyFromSac(tags.sac_scale)
  const loop = tags.roundtrip === 'yes' || (tags.from !== undefined && tags.from === tags.to)
  if (distanceKm === undefined && elevationGainM === undefined && difficulty === undefined) {
    return undefined
  }
  return {
    distanceKm,
    elevationGainM: Number.isNaN(elevationGainM as number) ? undefined : elevationGainM,
    difficulty,
    loop,
  }
}

/** Détermine le sous-type lisible d'un élément OSM selon ses tags. */
function subtypeOf(tags: Tags, category: SearchParams['category']): string {
  if (category === 'beach') {
    const surface = tags.surface ?? tags['beach:surface']
    if (surface === 'sand') return SUBTYPE.beachSand
    if (surface === 'pebbles' || surface === 'gravel') return SUBTYPE.beachPebbles
    return SUBTYPE.beach
  }
  if (tags.natural === 'peak') return SUBTYPE.peak
  if (tags.tourism === 'viewpoint') return SUBTYPE.viewpoint
  if (tags.tourism === 'alpine_hut') return SUBTYPE.hut
  if (tags.route === 'hiking') return SUBTYPE.trail
  if (tags.leisure === 'fishing' || tags.amenity === 'fishing') return SUBTYPE.fishingSpot
  if (tags.natural === 'water') return SUBTYPE.water
  if (tags.amenity === 'marketplace') return SUBTYPE.market
  if (tags.historic) return SUBTYPE.historic
  if (tags.tourism === 'museum') return SUBTYPE.museum
  if (tags.shop) return SUBTYPE.artisan
  return ''
}

/** Nom de repli quand l'élément n'a pas de tag `name`. */
function fallbackName(subtype: string): string {
  return subtype ? `${subtype.charAt(0).toUpperCase()}${subtype.slice(1)} sans nom` : 'Lieu sans nom'
}

/** Tags conservés comme métadonnées affichables. */
const KEEP_TAGS = ['surface', 'access', 'supervised', 'natural', 'ele', 'fishing', 'historic', 'opening_hours']

function normalize(el: OverpassElement, category: SearchParams['category']): Place | null {
  const lat = el.lat ?? el.center?.lat
  const lng = el.lon ?? el.center?.lon
  if (lat === undefined || lng === undefined) return null
  const tags = el.tags ?? {}
  const subtype = subtypeOf(tags, category)

  return {
    id: `osm:${el.type}/${el.id}`,
    source: 'osm',
    name: tags.name ?? fallbackName(subtype),
    category,
    subtype: subtype || undefined,
    lat,
    lng,
    rating: null,
    reviewCount: null,
    priceLevel: null,
    photos: [],
    address: tags['addr:city'] ?? tags['addr:street'] ?? '',
    openNow: null,
    tags: Object.entries(tags)
      .filter(([k]) => KEEP_TAGS.includes(k))
      .map(([k, v]) => `${k}=${v}`),
    sourceUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
    trail: category === 'hike' ? buildTrail(tags) : undefined,
  }
}

export const osmAdapter: PlaceProvider = {
  source: 'osm',
  async search(params: SearchParams): Promise<Place[]> {
    const url = apiUrl('/api/osm/search', {
      lat: params.lat,
      lng: params.lng,
      radius: params.radiusM,
      category: params.category,
    })
    const data = await apiGet<{ elements?: OverpassElement[] }>(url, params.signal)
    return (data.elements ?? [])
      .map((el) => normalize(el, params.category))
      .filter((p): p is Place => p !== null)
  },
}
