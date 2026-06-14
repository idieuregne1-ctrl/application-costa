import { Router } from 'express'
import { keyStatus } from '../lib/env.js'

export const healthRouter = Router()

/**
 * GET /api/health
 * Sonde de vie du backend. Sert aussi à exposer (de façon NON sensible) quelles
 * clés API sont configurées — booléens seulement, jamais les valeurs.
 */
healthRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'creme-de-la-creme-server',
    time: new Date().toISOString(),
    keysConfigured: keyStatus,
  })
})
