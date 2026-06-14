import { Router } from 'express'
import { z } from 'zod'
import { fetchJson } from '../lib/http.js'

export const routeRouter = Router()

/**
 * Proxy OSRM (gratuit, sans clé) — temps de trajet réels entre les arrêts d'un
 * itinéraire. Utilisé par le planificateur de journée (Phase 10).
 */

const OSRM = 'https://router.project-osrm.org/route/v1/driving'

const schema = z.object({
  // « lng,lat;lng,lat;... » (ordre OSRM : longitude d'abord).
  coords: z
    .string()
    .regex(/^(-?\d+(\.\d+)?,-?\d+(\.\d+)?)(;-?\d+(\.\d+)?,-?\d+(\.\d+)?)+$/, 'coords invalides'),
})

interface OsrmResponse {
  code: string
  routes?: { duration: number; distance: number; legs: { duration: number; distance: number }[] }[]
}

/** GET /api/route?coords=lng,lat;lng,lat;... */
routeRouter.get('/', async (req, res, next) => {
  try {
    const { coords } = schema.parse(req.query)
    const url = `${OSRM}/${coords}?overview=false&annotations=false`
    const data = await fetchJson<OsrmResponse>(url, { source: 'osrm', timeoutMs: 15_000 })

    const route = data.routes?.[0]
    if (!route) {
      return res.json({ legs: [], totalDuration: null, totalDistance: null })
    }
    res.json({
      legs: route.legs.map((l) => ({ duration: l.duration, distance: l.distance })),
      totalDuration: route.duration,
      totalDistance: route.distance,
    })
  } catch (err) {
    next(err)
  }
})
