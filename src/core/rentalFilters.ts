import type { RentalOffer } from '../adapters/rentals/types'
import { offerPriceIn, type FxRates } from './currency'

export type RentalSortBy = 'priceTotal' | 'pricePerDay' | 'rating' | 'category'

export interface RentalFilters {
  transmission: ('auto' | 'manuelle')[]
  maxPrice: number | null // dans la devise d'affichage
  unlimitedMileage: boolean
  insuranceIncluded: boolean
  suppliers: string[] // vide = tous
  sortBy: RentalSortBy
}

export const DEFAULT_RENTAL_FILTERS: RentalFilters = {
  transmission: [],
  maxPrice: null,
  unlimitedMileage: false,
  insuranceIncluded: false,
  suppliers: [],
  sortBy: 'priceTotal',
}

function isUnlimited(mileage: string): boolean {
  return /illimit|unlimited/i.test(mileage)
}

export function filterOffers(
  offers: RentalOffer[],
  f: RentalFilters,
  displayCurrency: string,
  fx: FxRates | null,
): RentalOffer[] {
  return offers.filter((o) => {
    if (f.transmission.length > 0 && (!o.transmission || !f.transmission.includes(o.transmission))) {
      return false
    }
    if (f.unlimitedMileage && !isUnlimited(o.mileage)) return false
    if (f.insuranceIncluded && !o.insuranceIncluded) return false
    if (f.suppliers.length > 0 && !f.suppliers.includes(o.supplier)) return false
    if (f.maxPrice !== null) {
      const price = offerPriceIn(o, displayCurrency, fx)
      if (price !== null && price > f.maxPrice) return false
    }
    return true
  })
}

export function sortOffers(
  offers: RentalOffer[],
  sortBy: RentalSortBy,
  displayCurrency: string,
  fx: FxRates | null,
): RentalOffer[] {
  const arr = [...offers]
  switch (sortBy) {
    case 'pricePerDay':
      return arr.sort((a, b) => a.pricePerDay - b.pricePerDay)
    case 'rating':
      return arr.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    case 'category':
      return arr.sort((a, b) => a.category.localeCompare(b.category))
    case 'priceTotal':
    default:
      return arr.sort((a, b) => {
        const pa = offerPriceIn(a, displayCurrency, fx) ?? a.priceTotal
        const pb = offerPriceIn(b, displayCurrency, fx) ?? b.priceTotal
        return pa - pb
      })
  }
}
