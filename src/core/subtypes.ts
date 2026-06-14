import type { PlaceCategory } from '../adapters/types'

/**
 * Sous-types canoniques produits par les adapters et filtrables dans le panneau.
 * Une seule source de vérité pour que le filtre par sous-type matche exactement
 * ce que l'adapter écrit dans `Place.subtype`.
 */
export const SUBTYPE = {
  // Randonnée
  peak: 'sommet',
  viewpoint: 'point de vue',
  hut: 'refuge',
  trail: 'randonnée',
  // Pêche
  fishingSpot: 'spot de pêche',
  water: "plan d'eau",
  // Culture
  market: 'marché',
  historic: 'site historique',
  museum: 'musée',
  artisan: 'artisan / produits locaux',
  // Plage
  beachSand: 'plage de sable',
  beachPebbles: 'plage de galets',
  beach: 'plage',
} as const

/** Options de filtrage par sous-type, par catégorie (affichées dans le panneau). */
export const SUBTYPE_OPTIONS: Partial<Record<PlaceCategory, { value: string; label: string }[]>> = {
  hike: [
    { value: SUBTYPE.trail, label: 'Sentiers' },
    { value: SUBTYPE.peak, label: 'Sommets' },
    { value: SUBTYPE.viewpoint, label: 'Points de vue' },
    { value: SUBTYPE.hut, label: 'Refuges' },
  ],
  fishing: [
    { value: SUBTYPE.fishingSpot, label: 'Spots aménagés' },
    { value: SUBTYPE.water, label: "Plans d'eau" },
  ],
  culture: [
    { value: SUBTYPE.market, label: 'Marchés' },
    { value: SUBTYPE.historic, label: 'Sites historiques' },
    { value: SUBTYPE.museum, label: 'Musées' },
    { value: SUBTYPE.artisan, label: 'Artisans' },
  ],
  beach: [
    { value: SUBTYPE.beachSand, label: 'Sable' },
    { value: SUBTYPE.beachPebbles, label: 'Galets' },
  ],
}
