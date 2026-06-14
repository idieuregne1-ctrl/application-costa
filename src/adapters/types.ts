/**
 * Types unifiés de l'application.
 *
 * C'est le contrat central : chaque adapter (Google, Foursquare, OSM…) normalise
 * sa réponse propriétaire vers le type `Place`. Tout le reste de l'app (scoring,
 * dédup, UI, cache offline) ne manipule QUE ces types — jamais les formats bruts
 * des sources.
 */

export type PlaceSource = 'google' | 'foursquare' | 'tripadvisor' | 'osm'

export type PlaceCategory =
  | 'restaurant'
  | 'activity'
  | 'beach'
  | 'hike'
  | 'fishing'
  | 'culture'

export type TrailDifficulty = 'facile' | 'modéré' | 'difficile'

/** Infos spécifiques aux lieux de plein air (sentiers, sommets…), quand disponibles. */
export interface TrailInfo {
  distanceKm?: number
  elevationGainM?: number
  difficulty?: TrailDifficulty
  estimatedDurationMin?: number
  /** true = boucle, false = aller-retour. */
  loop?: boolean
}

/** Résumé d'avis généré par IA (Claude), affiché dans la fiche détail. */
export interface ReviewSummary {
  /** Une phrase qui résume l'ambiance générale. */
  verdict: string
  /** Ce que les gens aiment (3-4 points). */
  loves: string[]
  /** Bémols à savoir (1-3 points). */
  caveats: string[]
  /** Pour qui / quelle occasion (ex : en famille, romantique, pêche matinale). */
  bestFor: string[]
}

/** Lieu normalisé — le type pivot de toute l'application. */
export interface Place {
  id: string
  source: PlaceSource
  name: string
  category: PlaceCategory
  /** Sous-type libre : 'randonnée', 'sommet', 'marché', 'musée', 'spot de pêche'… */
  subtype?: string
  lat: number
  lng: number
  /** Note brute 0-5, ou null si la source n'en fournit pas. */
  rating: number | null
  reviewCount: number | null
  /** Niveau de prix 1-4, ou null. */
  priceLevel: number | null
  photos: string[]
  address: string
  openNow: boolean | null
  tags: string[]
  sourceUrl: string
  /** Score qualité calculé par notre algo (Phase 3). */
  rawScore?: number
  /** Résumé d'avis IA (Phase 7). */
  reviewSummary?: ReviewSummary
  /** Infos sentier pour les lieux de plein air (Phase 6). */
  trail?: TrailInfo
}

/**
 * Paramètres de recherche passés à chaque adapter.
 * Les filtres fins (prix, cuisine…) sont surtout appliqués côté client après
 * agrégation ; ici on garde les paramètres qui pilotent réellement l'appel API.
 */
export interface SearchParams {
  lat: number
  lng: number
  /** Rayon de recherche en mètres. */
  radiusM: number
  category: PlaceCategory
  /** Requête texte optionnelle (ex : « fishing spot », nom de cuisine…). */
  query?: string
  /** Note minimale souhaitée (filtrage indicatif côté source quand supporté). */
  minRating?: number
  /** Signal d'annulation pour couper les requêtes en vol. */
  signal?: AbortSignal
}

/** Interface commune que chaque source de lieux implémente. */
export interface PlaceProvider {
  /** Identifiant de la source, pour le toggle « Sources actives ». */
  readonly source: PlaceSource
  search(params: SearchParams): Promise<Place[]>
}
