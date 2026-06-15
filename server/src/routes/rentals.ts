import { Router } from 'express'
import { z } from 'zod'
import { env } from '../lib/env.js'
import { fetchJson } from '../lib/http.js'

export const rentalsRouter = Router()

/**
 * Section Location de véhicules.
 *
 * Réalisme : il n'existe pas d'API gratuite/instantanée qui compare tous les
 * loueurs. Les vraies APIs (Rentalcars/Booking Demand, Amadeus Cars) exigent une
 * approbation partenaire. Cette route est donc structurée pour accueillir ces
 * adapters dès qu'une clé est dispo ; sans clé, elle renvoie 0 offre + une note,
 * et le frontend bascule sur des liens « deep-link » vers les loueurs.
 *
 * Le taux de change (FX) utilise frankfurter.app (BCE, gratuit, sans clé).
 */

// ── Taux de change ───────────────────────────────────────────────────────────
const FX_BASE = 'https://api.frankfurter.app/latest'

const fxSchema = z.object({
  base: z.string().length(3).default('EUR'),
})

rentalsRouter.get('/fx', async (req, res, next) => {
  try {
    const { base } = fxSchema.parse(req.query)
    const data = await fetchJson<{ base: string; rates: Record<string, number> }>(
      `${FX_BASE}?from=${base.toUpperCase()}`,
      { source: 'frankfurter' },
    )
    // On ajoute la base elle-même à 1 pour simplifier la conversion côté client.
    const rates = { ...data.rates, [data.base]: 1 }
    res.json({ base: data.base, rates })
  } catch (err) {
    next(err)
  }
})

// ── Recherche d'offres ───────────────────────────────────────────────────────
const searchSchema = z.object({
  vehicleType: z.enum(['car', 'motorcycle']),
  country: z.string().trim().min(1).max(80),
  city: z.string().trim().min(1).max(80),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pickupTime: z.string().regex(/^\d{2}:\d{2}$/),
  dropoffDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dropoffTime: z.string().regex(/^\d{2}:\d{2}$/),
  driverAge: z.coerce.number().min(18).max(99).optional(),
})

/**
 * GET /api/rentals/search
 * Renvoie les offres des adapters API CONFIGURÉS (aucun par défaut → 0 offre).
 * Les adapters partenaires (Amadeus, Rentalcars Demand…) viennent se brancher ici.
 */
rentalsRouter.get('/search', async (req, res, next) => {
  try {
    searchSchema.parse(req.query)

    // Aucun fournisseur d'API partenaire branché pour l'instant.
    const hasPartnerApi = Boolean(env.AMADEUS_CLIENT_ID && env.AMADEUS_CLIENT_SECRET)

    res.json({
      offers: [],
      note: hasPartnerApi
        ? 'Adapter partenaire détecté mais non encore implémenté — utilise les liens loueurs.'
        : "Aucune API loueur partenaire branchée. Compare via les liens loueurs (deep-links). Branche une clé partenaire pour afficher les prix ici.",
    })
  } catch (err) {
    next(err)
  }
})
