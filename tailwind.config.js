import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// Chemins absolus (relatifs à ce fichier) pour que le scan `content` fonctionne
// quel que soit le répertoire courant du process qui lance Vite/PostCSS.
const root = dirname(fileURLToPath(import.meta.url))

/** @type {import('tailwindcss').Config} */
export default {
  content: [join(root, 'index.html'), join(root, 'src/**/*.{ts,tsx}')],
  theme: {
    extend: {
      colors: {
        // Palette de l'app — fond sombre ardoise, accent ambre "crème".
        creme: {
          50: '#fffbeb',
          100: '#fef3c7',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
