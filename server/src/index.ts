import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import { ZodError } from 'zod'
import { env, keyStatus, MissingKeyError } from './lib/env.js'
import { UpstreamError } from './lib/http.js'
import { healthRouter } from './routes/health.js'
import { googleRouter } from './routes/google.js'
import { foursquareRouter } from './routes/foursquare.js'
import { osmRouter } from './routes/osm.js'
import { geocodeRouter } from './routes/geocode.js'
import { routeRouter } from './routes/route.js'
import { weatherRouter } from './routes/weather.js'
import { aiRouter } from './routes/ai.js'
import { rentalsRouter } from './routes/rentals.js'

const app = express()

// CORS_ORIGIN peut lister plusieurs origines séparées par des virgules (URL de
// prod + previews). « * » autorise tout (pratique pour un test rapide).
const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
app.use(
  cors({
    origin: allowedOrigins.includes('*') ? true : allowedOrigins,
  }),
)
app.use(express.json({ limit: '1mb' }))

// Toutes les routes sont préfixées /api (le frontend Vite y proxie en dev).
app.use('/api/health', healthRouter)
app.use('/api/google', googleRouter)
app.use('/api/foursquare', foursquareRouter)
app.use('/api/osm', osmRouter)
app.use('/api/geocode', geocodeRouter)
app.use('/api/route', routeRouter)
app.use('/api/weather', weatherRouter)
app.use('/api/ai', aiRouter)
app.use('/api/rentals', rentalsRouter)

// 404 pour toute route /api inconnue.
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'not_found' })
})

// Gestionnaire d'erreurs centralisé : traduit les erreurs typées en réponses propres.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'bad_request', issues: err.flatten().fieldErrors })
  }
  if (err instanceof MissingKeyError) {
    return res.status(503).json({ error: 'missing_api_key', message: err.message })
  }
  if (err instanceof UpstreamError) {
    return res.status(err.status >= 400 && err.status < 600 ? err.status : 502).json({
      error: 'upstream_error',
      source: err.source,
      message: err.message,
    })
  }
  console.error('Erreur non gérée :', err)
  res.status(500).json({ error: 'internal_error' })
})

app.listen(env.PORT, () => {
  console.log(`\n🥇 Backend « crème de la crème » sur http://localhost:${env.PORT}`)
  console.log(`   Santé : http://localhost:${env.PORT}/api/health`)
  console.log('   Clés configurées :', keyStatus, '\n')
})
