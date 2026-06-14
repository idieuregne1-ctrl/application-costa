# 🚀 Déploiement — La crème de la crème

Frontend sur **Vercel** (HTTPS auto, gratuit) + backend Express sur **Render** (tier gratuit).
Tout est déjà configuré (`vercel.json`, `render.yaml`) — il reste à connecter tes comptes.

> ⚠️ **Avant tout : régénère tes clés** (Google, Anthropic) si elles ont été exposées.
> Elles iront dans les dashboards d'hébergement, jamais dans le code (`.env` est gitignoré).

---

## 0. Mettre le projet sur GitHub

Depuis le dossier `creme-de-la-creme/` :

```bash
git init
git add .
git commit -m "App crème de la crème"
```

Crée un repo vide sur github.com, puis :

```bash
git remote add origin https://github.com/<toi>/creme-de-la-creme.git
git branch -M main
git push -u origin main
```

> `node_modules/`, `dist/` et les `.env` ne sont pas poussés (gitignore) — c'est voulu.

---

## 1. Backend → Render

1. [render.com](https://render.com) → **New +** → **Blueprint**
2. Connecte ton repo GitHub → Render détecte `render.yaml` et propose le service **creme-backend**
3. **Apply**. Dans l'onglet **Environment** du service, renseigne :
   | Variable | Valeur |
   |---|---|
   | `GOOGLE_PLACES_API_KEY` | ta clé `AIza…` |
   | `ANTHROPIC_API_KEY` | ta clé `sk-ant-…` |
   | `FOURSQUARE_API_KEY` | (optionnel) `fsq3…` |
   | `CORS_ORIGIN` | *(on la remplit à l'étape 3)* |
4. Récupère l'URL publique du service, ex. `https://creme-backend.onrender.com`

> Le tier gratuit s'endort après inactivité → le 1er appel peut prendre ~30 s (cold start). Normal.

---

## 2. Frontend → Vercel

1. [vercel.com](https://vercel.com) → **Add New… → Project** → importe le même repo
2. **Root Directory** : laisse la racine (là où est `vercel.json`)
3. **Environment Variables** → ajoute :
   | Variable | Valeur |
   |---|---|
   | `VITE_API_BASE_URL` | l'URL Render de l'étape 1 (ex. `https://creme-backend.onrender.com`) |
4. **Deploy**. Tu obtiens une URL, ex. `https://creme.vercel.app`

> `VITE_API_BASE_URL` est injectée **au build** : si tu la changes, redéploie.

---

## 3. Relier les deux (CORS)

Retourne sur Render → service → **Environment** → mets :

```
CORS_ORIGIN = https://creme.vercel.app
```

(plusieurs origines possibles, séparées par des virgules — utile pour les preview Vercel)
Le service redémarre tout seul. ✅

---

## 4. Installer sur le téléphone

Ouvre `https://creme.vercel.app` sur ton tél :
- **iOS Safari** : Partager → **Sur l'écran d'accueil**
- **Android Chrome** : menu ⋮ → **Installer l'application**

Le Service Worker s'active (HTTPS ✓) → carte, photos et zones téléchargées fonctionnent **hors ligne**.

---

## Récap des variables d'environnement

**Render (backend)** : `GOOGLE_PLACES_API_KEY`, `ANTHROPIC_API_KEY`, `FOURSQUARE_API_KEY` (opt.), `CORS_ORIGIN`
**Vercel (frontend)** : `VITE_API_BASE_URL`

Les catégories **Plages · Randonnée · Pêche · Culture · météo** marchent même sans aucune clé.
