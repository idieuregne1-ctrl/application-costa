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
        // Palette éditoriale claire « guide de voyage » — papier chaud + or sobre.
        paper: '#faf7f1', // fond, ivoire chaud
        ink: '#211d1a', // titres, presque-noir chaud
        line: '#e9e3d9', // bordures fines
        accent: {
          DEFAULT: '#a6772e', // or/ocre sobre
          dark: '#7f5a20',
          soft: '#f1e7d4', // fond accent discret
        },
      },
      fontFamily: {
        // UI/corps : police système (nette, native). Titres : serif éditoriale.
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(33,29,26,0.04), 0 1px 8px rgba(33,29,26,0.04)',
      },
    },
  },
  plugins: [],
}
