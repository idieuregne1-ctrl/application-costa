import 'dotenv/config'
import { z } from 'zod'

/**
 * Chargement + validation des variables d'environnement du backend.
 *
 * Les clés API sont OPTIONNELLES : le serveur doit démarrer même sans elles
 * (utile en Phase 1 et pour développer une source à la fois). Chaque route
 * vérifie la présence de SA clé et renvoie une erreur claire si elle manque,
 * via le helper `requireKey`.
 *
 * Les secrets ne quittent jamais ce process : ils servent uniquement à signer
 * les appels sortants vers les APIs externes.
 */

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(8787),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  GOOGLE_PLACES_API_KEY: z.string().optional(),
  FOURSQUARE_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  TRIPADVISOR_API_KEY: z.string().optional(),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Variables d\'environnement invalides :', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data

/** Clés présentes/absentes — affiché au démarrage pour le diagnostic. */
export const keyStatus = {
  google: Boolean(env.GOOGLE_PLACES_API_KEY),
  foursquare: Boolean(env.FOURSQUARE_API_KEY),
  anthropic: Boolean(env.ANTHROPIC_API_KEY),
  tripadvisor: Boolean(env.TRIPADVISOR_API_KEY),
}

/**
 * Récupère une clé requise par une route. Lève une erreur typée si absente,
 * que le gestionnaire d'erreurs traduit en réponse 503 explicite.
 */
export class MissingKeyError extends Error {
  constructor(public readonly keyName: string) {
    super(`Clé API manquante : ${keyName}. Renseigne-la dans server/.env`)
    this.name = 'MissingKeyError'
  }
}

export function requireKey(value: string | undefined, keyName: string): string {
  if (!value) throw new MissingKeyError(keyName)
  return value
}
