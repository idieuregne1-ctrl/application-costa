# 🥇 La crème de la crème

App de découverte de voyage : trouve **le meilleur** autour de toi — restaurants,
activités, plages, randonnée, pêche et culture locale — agrégé depuis plusieurs
sources, dédupliqué, et trié par un algorithme de score qualité. Pas un mur de
200 résultats médiocres : une sélection curée en paliers (🏆 Crème de la crème ·
⭐ Excellents choix · 💎 Pépites).

> État : **Toutes les phases livrées** (1 → 13). Agrégation multi-sources, scoring,
> paliers, filtres, plein air & culture, résumés d'avis IA, météo, favoris,
> planificateur de journée, presets contextuels et **mode hors ligne (PWA installable)**.

## Stack

| Côté | Techno |
|------|--------|
| Frontend | Vite · React · TypeScript · Tailwind · Zustand · TanStack Query · Leaflet |
| PWA | `vite-plugin-pwa` (Workbox) — installable, offline (Phase 12) |
| Backend | Node · Express (proxy des APIs externes, masque les clés) |
| Sources | Google Places · Foursquare · OpenStreetMap/Overpass · Open-Meteo · Anthropic (résumés IA) |

**Principe de sécurité :** aucune clé API côté client. Tous les appels externes
passent par le backend proxy, qui lit les secrets depuis `server/.env`.

## Architecture

```
/src
  /adapters   types unifiés (Place, PlaceProvider, SearchParams) + adapters par source
  /core       agrégateur, scoring, déduplication (Phase 3)
  /components  PlaceCard, MapView, FilterPanel, DetailSheet… (Phase 4+)
  /hooks      usePlaces, useGeolocation… (Phase 2+)
  /store      state global Zustand
  /pages      pages de l'app
/server
  /src/routes routes proxy par source (google, foursquare, osm, weather, ai)
  /src/lib    chargement/validation d'environnement
```

Le pattern clé est l'**adapter multi-sources** : chaque source implémente
`PlaceProvider` et normalise sa réponse vers le type `Place`. Un `PlaceAggregator`
(Phase 3) les orchestre en parallèle, déduplique et score.

## Démarrage

### Prérequis
- Node.js ≥ 20 (testé sur v24 LTS). `node --version`

### 1. Backend (proxy)

```bash
cd server
cp .env.example .env      # remplir les clés (toutes optionnelles en Phase 1)
npm install
npm run dev               # → http://localhost:8787
```

Vérifier : `curl http://localhost:8787/api/health` → `{"status":"ok", …}`

### 2. Frontend

```bash
# depuis la racine de l'app (creme-de-la-creme/)
cp .env.example .env      # optionnel en local
npm install
npm run dev               # → http://localhost:5173
```

Vite proxie automatiquement `/api/*` vers le backend (`:8787`). La page d'accueil
affiche un indicateur d'état du backend en bas : vert = proxy joignable.

> Lance les **deux** process (deux terminaux). Le frontend seul affichera
> « Backend injoignable ».

## Clés API — où les obtenir

| Variable (server/.env) | Service | Console | Phase |
|---|---|---|---|
| `GOOGLE_PLACES_API_KEY` | Google Places | console.cloud.google.com (activer *Places API*) | 2 |
| `FOURSQUARE_API_KEY` | Foursquare Places | foursquare.com/developers | 9 |
| `ANTHROPIC_API_KEY` | Anthropic (résumés IA, `claude-sonnet-4-6`) | console.anthropic.com | 7 |
| — | OpenStreetMap / Overpass | aucune clé | 2 / 6 |
| — | Open-Meteo (météo/marées) | aucune clé | 8 |

## Scripts

**Frontend** (`creme-de-la-creme/`)
- `npm run dev` — serveur de dev Vite
- `npm run build` — typecheck + build de prod
- `npm run typecheck` — vérification des types

**Backend** (`server/`)
- `npm run dev` — serveur Express en watch (tsx)
- `npm run build` / `npm start` — build TS puis exécution
- `npm run typecheck` — vérification des types

## Roadmap (phases) — toutes livrées

1. ✅ **Fondations** — scaffold, types, proxy, PWA de base
2. ✅ Première source — GooglePlacesAdapter + OSM (plages) + géoloc + géocodage
3. ✅ Agrégation, déduplication, scoring (Wilson + consensus) + paliers
4. ✅ Interface principale — onglets, cartes, carte Leaflet, fiche détail
5. ✅ Panneau de filtres + persistance (IndexedDB)
6. ✅ Plein air & culture (randonnée, pêche, culture) + champ `trail`
7. ✅ Résumés d'avis IA (Anthropic `claude-sonnet-4-6`, cache)
8. ✅ Météo (Open-Meteo — prévisions, soleil, marine)
9. ✅ Foursquare + favoris + « Surprends-moi »
10. ✅ Planificateur de journée (OSRM) + partage par lien
11. ✅ Presets contextuels intelligents (+ indice météo)
12. ✅ Mode hors ligne (zones téléchargées, Service Worker, bascule auto)
13. ✅ Finitions (icônes/splash PWA, optimisations, accessibilité, ErrorBoundary)

## Tests

Logique cœur (scoring, dédup, filtres) — script exécutable :

```bash
cd creme-de-la-creme
server/node_modules/.bin/tsx scripts/test-core.ts
```
