export * from './types'
export { buildRedirects } from './deeplinks'

/**
 * Les offres AVEC PRIX viennent du backend (`/api/rentals/search`), qui agrège
 * les adapters API partenaires côté serveur (clés masquées). Le frontend, lui,
 * génère les liens deep-link (sans clé) via `buildRedirects`.
 */
