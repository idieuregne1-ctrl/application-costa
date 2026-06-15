import type { RentalOffer } from '../adapters/rentals/types'

/**
 * Normalisation des devises pour comparer les offres dans une devise commune.
 * Les taux viennent de frankfurter.app (BCE), exprimés relativement à une `base`.
 */

export interface FxRates {
  base: string
  rates: Record<string, number> // 1 base = rates[XXX] XXX
}

/** Convertit un montant de `from` vers `to` via les taux (base = rates.base). */
export function convert(amount: number, from: string, to: string, fx: FxRates): number | null {
  if (from === to) return amount
  const rFrom = from === fx.base ? 1 : fx.rates[from]
  const rTo = to === fx.base ? 1 : fx.rates[to]
  if (!rFrom || !rTo) return null
  // montant_base = amount / rFrom ; puis * rTo
  return (amount / rFrom) * rTo
}

/** Prix total d'une offre exprimé dans la devise d'affichage (ou null si inconnu). */
export function offerPriceIn(offer: RentalOffer, displayCurrency: string, fx: FxRates | null): number | null {
  if (offer.currency === displayCurrency) return offer.priceTotal
  if (!fx) return null
  return convert(offer.priceTotal, offer.currency, displayCurrency, fx)
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `${Math.round(amount)} ${currency}`
  }
}
