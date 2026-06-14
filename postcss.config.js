import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// Chemin absolu du fichier de config Tailwind, pour que Tailwind le trouve même
// quand Vite/PostCSS est lancé depuis un autre répertoire courant (ex : l'outil
// d'aperçu lance Vite depuis le dossier parent). Sans ça, Tailwind retombe sur
// une config par défaut vide et ne génère AUCUN utilitaire.
const root = dirname(fileURLToPath(import.meta.url))

export default {
  plugins: {
    tailwindcss: { config: join(root, 'tailwind.config.js') },
    autoprefixer: {},
  },
}
