/** Similarité de chaînes pour le matching de noms lors de la déduplication. */

/** Normalise un nom : minuscules, sans accents, sans ponctuation, espaces compactés. */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // retire les diacritiques
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Ensemble des bigrammes d'une chaîne. */
function bigrams(s: string): Map<string, number> {
  const map = new Map<string, number>()
  for (let i = 0; i < s.length - 1; i++) {
    const bg = s.slice(i, i + 2)
    map.set(bg, (map.get(bg) ?? 0) + 1)
  }
  return map
}

/**
 * Coefficient de Sørensen-Dice sur les bigrammes (0 = rien en commun, 1 = identique).
 * Robuste aux fautes/variations de nom entre sources.
 */
export function diceCoefficient(a: string, b: string): number {
  if (a === b) return 1
  if (a.length < 2 || b.length < 2) return 0
  const bgA = bigrams(a)
  const bgB = bigrams(b)
  let intersection = 0
  let totalA = 0
  for (const count of bgA.values()) totalA += count
  let totalB = 0
  for (const count of bgB.values()) totalB += count
  for (const [bg, countA] of bgA) {
    const countB = bgB.get(bg)
    if (countB) intersection += Math.min(countA, countB)
  }
  return (2 * intersection) / (totalA + totalB)
}

/** Similarité de deux noms après normalisation (0-1). */
export function nameSimilarity(a: string, b: string): number {
  return diceCoefficient(normalizeName(a), normalizeName(b))
}
