/* Script de validation du cœur (Phase 3) — exécuter avec tsx.
   Vérifie : déduplication multi-sources, scoring Wilson, bonus consensus, paliers. */
import type { Place, PlaceProvider, SearchParams } from '../src/adapters/types'
import { aggregate } from '../src/core/aggregator'
import { organizeIntoTiers } from '../src/core/tiers'
import { filterPlaces, sortPlaces, DEFAULT_FILTERS } from '../src/core/filters'
import { wilsonLowerBound } from '../src/core/scoring'
import { nameSimilarity } from '../src/lib/similarity'
import { haversineMeters } from '../src/lib/geo'

const CENTER = { lat: 43.4832, lng: -1.5586 }

// Décale un point de ~d mètres vers le nord.
function offsetNorth(lat: number, lng: number, meters: number) {
  return { lat: lat + meters / 111_320, lng }
}

function place(p: Partial<Place> & Pick<Place, 'id' | 'source' | 'name' | 'lat' | 'lng'>): Place {
  return {
    category: 'restaurant',
    rating: null,
    reviewCount: null,
    priceLevel: null,
    photos: [],
    address: '',
    openNow: null,
    tags: [],
    sourceUrl: '',
    ...p,
  }
}

// Un même resto vu par Google ET Foursquare (à 25 m, noms quasi identiques) → doit fusionner.
const chezLeonG = offsetNorth(CENTER.lat, CENTER.lng, 200)
const chezLeonF = offsetNorth(chezLeonG.lat, chezLeonG.lng, 25)

const googlePlaces: Place[] = [
  place({ id: 'g1', source: 'google', name: 'Chez Léon', lat: chezLeonG.lat, lng: chezLeonG.lng, rating: 4.6, reviewCount: 1200, openNow: true, priceLevel: 2 }),
  place({ id: 'g2', source: 'google', name: 'Le Petit Bistro', lat: offsetNorth(CENTER.lat, CENTER.lng, 500).lat, lng: CENTER.lng, rating: 4.9, reviewCount: 12 }), // peu d'avis
  place({ id: 'g3', source: 'google', name: 'La Cantine Moyenne', lat: offsetNorth(CENTER.lat, CENTER.lng, 800).lat, lng: CENTER.lng, rating: 3.2, reviewCount: 400 }), // bas de gamme
  place({ id: 'g4', source: 'google', name: 'Brasserie Populaire', lat: offsetNorth(CENTER.lat, CENTER.lng, 1500).lat, lng: CENTER.lng, rating: 4.7, reviewCount: 3000 }),
  place({ id: 'g5', source: 'google', name: 'Pépite Cachée', lat: offsetNorth(CENTER.lat, CENTER.lng, 300).lat, lng: CENTER.lng, rating: 4.8, reviewCount: 18 }), // pépite
]

const fsPlaces: Place[] = [
  place({ id: 'f1', source: 'foursquare', name: 'Chez Leon', lat: chezLeonF.lat, lng: chezLeonF.lng, rating: 4.4, reviewCount: 300 }), // doublon de g1
  place({ id: 'f2', source: 'foursquare', name: 'Tendance Café', lat: offsetNorth(CENTER.lat, CENTER.lng, 600).lat, lng: CENTER.lng, rating: 4.3, reviewCount: 80 }),
]

const mockGoogle: PlaceProvider = { source: 'google', search: async (_p: SearchParams) => googlePlaces }
const mockFs: PlaceProvider = { source: 'foursquare', search: async (_p: SearchParams) => fsPlaces }

function assert(cond: boolean, msg: string) {
  console.log(`${cond ? '✅' : '❌'} ${msg}`)
  if (!cond) process.exitCode = 1
}

async function main() {
  console.log('\n=== Sanity unitaires ===')
  // Wilson : 4.9/12 doit passer SOUS 4.7/3000.
  const wHigh = wilsonLowerBound((4.9 - 1) / 4, 12)
  const wPop = wilsonLowerBound((4.7 - 1) / 4, 3000)
  console.log(`  Wilson 4.9/12 = ${wHigh.toFixed(3)} | 4.7/3000 = ${wPop.toFixed(3)}`)
  assert(wPop > wHigh, 'Wilson pénalise le petit échantillon (4.7/3000 > 4.9/12)')
  assert(nameSimilarity('Chez Léon', 'Chez Leon') >= 0.8, 'Noms « Chez Léon » ≈ « Chez Leon » > 0.8')
  assert(Math.round(haversineMeters(chezLeonG, chezLeonF)) <= 50, 'Doublon à moins de 50 m')

  console.log('\n=== Agrégation ===')
  const { merged, rawCount } = await aggregate({
    providers: [mockGoogle, mockFs],
    center: CENTER,
    radiusM: 5000,
    category: 'restaurant',
  })
  const result = organizeIntoTiers(merged)

  console.log(`  Bruts: ${rawCount} | Curés: ${result.curated.length}`)
  console.log('  🏆 Crème:', result.creme.map((p) => `${p.name} [${p.qualityScore.toFixed(2)}, ${p.sources.join('+')}]`))
  console.log('  ⭐ Excellents:', result.excellents.map((p) => p.name))
  console.log('  💎 Pépites:', result.pepites.map((p) => `${p.name} (${p.reviewCount} avis)`))

  const chezLeon = result.all.find((p) => p.name === 'Chez Léon')
  assert(rawCount === 7, '7 lieux bruts')
  assert(result.all.length === 6, 'Fusion → 6 lieux (Chez Léon dédupliqué)')
  assert(!!chezLeon && chezLeon.sources.length === 2, 'Chez Léon validé sur 2 sources (consensus)')
  assert(!result.all.some((p) => p.name === 'La Cantine Moyenne' && result.curated.includes(p)), 'Bas de gamme (3.2) coupé de la sélection curée')
  assert(result.pepites.some((p) => p.name === 'Pépite Cachée'), 'Pépite Cachée (4.8/18) classée en pépite')
  assert(result.pepites.some((p) => p.name === 'Le Petit Bistro'), 'Le Petit Bistro (4.9/12) classé en pépite')
  const topNames = result.creme.map((p) => p.name)
  assert(topNames.includes('Brasserie Populaire') && topNames.includes('Chez Léon'), 'Valeurs sûres bien notées en tête (Crème)')

  console.log('\n=== Filtres & tri (Phase 5) ===')
  // Prix : ne garder que €€ (niveau 2). Chez Léon (priceLevel 2) doit rester ;
  // les lieux à prix null passent (info inconnue).
  const onlyMid = filterPlaces(merged, { ...DEFAULT_FILTERS, priceLevels: [2] })
  assert(onlyMid.some((p) => p.name === 'Chez Léon'), 'Filtre prix €€ garde Chez Léon (niveau 2)')

  // Note minimale 4.5+ : exclut Brasserie Populaire (4.7 ok) garde, exclut < 4.5.
  const high = filterPlaces(merged, { ...DEFAULT_FILTERS, minRating: 4.5 })
  assert(high.every((p) => p.rating !== null && p.rating >= 4.5), 'Filtre note 4.5+ ne garde que >= 4.5')

  // Ouvert maintenant : seul Chez Léon a openNow=true dans le jeu de test.
  const open = filterPlaces(merged, { ...DEFAULT_FILTERS, openNow: true })
  assert(open.length === 1 && open[0].name === 'Chez Léon', 'Filtre « ouvert » ne garde que les openNow=true')

  // Tri par distance croissante.
  const byDist = sortPlaces(merged, 'distance')
  const distances = byDist.map((p) => p.distanceM ?? Infinity)
  assert(distances.every((d, i) => i === 0 || d >= distances[i - 1]), 'Tri distance croissant')

  console.log('\nTerminé.')
}

main()
