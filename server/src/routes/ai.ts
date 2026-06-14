import { Router } from 'express'
import { z } from 'zod'
import { env, requireKey } from '../lib/env.js'
import { fetchJson, UpstreamError } from '../lib/http.js'

export const aiRouter = Router()

/**
 * Résumé d'avis IA via l'API Anthropic (modèle claude-sonnet-4-6).
 * Le différenciateur de l'app : condenser 30 avis en un verdict structuré.
 *
 * Sécurité / robustesse :
 *  - la clé ANTHROPIC_API_KEY reste côté serveur ;
 *  - on EXIGE une réponse strictement JSON (pas de Markdown, pas de préambule) ;
 *  - parsing défensif (extraction de l'objet JSON) + validation Zod ;
 *  - on borne le nombre/longueur d'avis envoyés pour maîtriser les coûts.
 */

const MODEL = 'claude-sonnet-4-6'
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MAX_REVIEWS = 12
const MAX_REVIEW_LEN = 600

const requestSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().max(40).optional(),
  reviews: z.array(z.string().min(1)).min(1).max(50),
})

/** Schéma de sortie attendu (ReviewSummary). */
const summarySchema = z.object({
  verdict: z.string().min(1),
  loves: z.array(z.string()).max(6),
  caveats: z.array(z.string()).max(5),
  bestFor: z.array(z.string()).max(5),
})

const SYSTEM_PROMPT =
  "Tu résumes des avis de lieux pour des voyageurs francophones. " +
  "Tu réponds UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après, " +
  "sans bloc de code Markdown. Tout le contenu est en français."

function buildUserPrompt(name: string, category: string | undefined, reviews: string[]): string {
  const trimmed = reviews
    .slice(0, MAX_REVIEWS)
    .map((r) => r.slice(0, MAX_REVIEW_LEN).trim())
    .filter(Boolean)
  return [
    `Lieu : « ${name} »${category ? ` (catégorie : ${category})` : ''}.`,
    'Voici des avis de visiteurs :',
    trimmed.map((r, i) => `${i + 1}. ${r}`).join('\n'),
    '',
    'Produis STRICTEMENT cet objet JSON (et rien d\'autre) :',
    '{',
    '  "verdict": "une seule phrase résumant l\'ambiance générale",',
    '  "loves": ["3 à 4 points que les gens aiment"],',
    '  "caveats": ["1 à 3 bémols à savoir"],',
    '  "bestFor": ["2 à 3 occasions/profils : ex. en famille, romantique, pêche matinale"]',
    '}',
    'Réponds en français, sois concis et concret.',
  ].join('\n')
}

/** Extrait le premier objet JSON d'un texte (tolère un éventuel bavardage du modèle). */
export function extractJson(text: string): unknown {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Aucun objet JSON trouvé dans la réponse du modèle')
  }
  return JSON.parse(text.slice(start, end + 1))
}

interface AnthropicResponse {
  content?: { type: string; text?: string }[]
}

/**
 * POST /api/ai/review-summary
 * Corps : { name, category?, reviews: string[] } → renvoie un ReviewSummary.
 */
aiRouter.post('/review-summary', async (req, res, next) => {
  try {
    const key = requireKey(env.ANTHROPIC_API_KEY, 'ANTHROPIC_API_KEY')
    const { name, category, reviews } = requestSchema.parse(req.body)

    const data = await fetchJson<AnthropicResponse>(ANTHROPIC_URL, {
      method: 'POST',
      source: 'anthropic',
      timeoutMs: 30_000,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 700,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildUserPrompt(name, category, reviews) }],
      }),
    })

    const text = data.content?.find((c) => c.type === 'text')?.text ?? ''
    if (!text) throw new UpstreamError(502, 'anthropic', 'Réponse vide du modèle')

    // Parsing défensif + validation stricte du schéma.
    const parsed = summarySchema.parse(extractJson(text))
    res.json({ summary: parsed })
  } catch (err) {
    if (err instanceof SyntaxError) {
      return next(new UpstreamError(502, 'anthropic', 'JSON invalide renvoyé par le modèle'))
    }
    next(err)
  }
})
