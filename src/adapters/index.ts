/**
 * Point d'entrée des adapters + sélection des sources par catégorie.
 * Au fil des phases, de nouveaux adapters (Foursquare, etc.) viendront enrichir
 * cette table. L'agrégateur (Phase 3) consommera `providersFor`.
 */
import type { PlaceCategory, PlaceProvider, PlaceSource } from './types'
import { googleAdapter } from './google'
import { osmAdapter } from './osm'
import { foursquareAdapter } from './foursquare'

export * from './types'
export { googleAdapter } from './google'
export { osmAdapter } from './osm'
export { foursquareAdapter } from './foursquare'

/** Tous les adapters disponibles, indexés par source. */
export const ALL_PROVIDERS: Record<string, PlaceProvider> = {
  google: googleAdapter,
  osm: osmAdapter,
  foursquare: foursquareAdapter,
}

/**
 * Sources pertinentes pour une catégorie donnée.
 * Phase 2 : restaurant/activité → Google ; plage → OSM. Les catégories plein air
 * (rando/pêche/culture) seront branchées en Phase 6.
 */
const PROVIDERS_BY_CATEGORY: Record<PlaceCategory, PlaceProvider[]> = {
  // Google + Foursquare → consensus multi-sources.
  restaurant: [googleAdapter, foursquareAdapter],
  activity: [googleAdapter, foursquareAdapter],
  beach: [osmAdapter],
  // Plein air : OSM est la source clé (Google/Foursquare couvrent mal ces lieux).
  hike: [osmAdapter],
  // Pêche : OSM + complément texte Google (« spot de pêche »).
  fishing: [osmAdapter, googleAdapter],
  // Culture : Google + Foursquare + OSM (marchés, historique, artisans).
  culture: [googleAdapter, foursquareAdapter, osmAdapter],
}

/**
 * Retourne les providers à interroger pour une catégorie, filtrés par les
 * sources que l'utilisateur a laissées actives.
 */
export function providersFor(
  category: PlaceCategory,
  activeSources: Record<PlaceSource, boolean>,
): PlaceProvider[] {
  return PROVIDERS_BY_CATEGORY[category].filter((p) => activeSources[p.source])
}

/** true si la catégorie a au moins une source implémentée (sinon « à venir »). */
export function isCategoryImplemented(category: PlaceCategory): boolean {
  return PROVIDERS_BY_CATEGORY[category].length > 0
}
