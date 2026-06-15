/**
 * Types de la section Location de véhicules (séparée du système `Place`).
 * Même esprit adapter multi-sources : un `RentalProvider` par agrégateur de loueurs.
 */

export type VehicleType = 'car' | 'motorcycle'

export interface RentalSearch {
  vehicleType: VehicleType
  country: string
  city: string // ou code aéroport
  pickupDate: string // ISO (YYYY-MM-DD)
  pickupTime: string // HH:MM
  dropoffDate: string
  dropoffTime: string
  driverAge?: number
}

export interface RentalOffer {
  id: string
  source: string // 'amadeus' | 'rentalcars' | ...
  supplier: string // Hertz, Avis, agence locale...
  vehicleType: VehicleType
  category: string // économique, SUV, scooter, trail 650cc...
  model: string // ex : « Toyota Yaris ou similaire »
  transmission?: 'auto' | 'manuelle'
  seats?: number
  pricePerDay: number
  priceTotal: number
  currency: string
  mileage: string // illimité ou X km
  insuranceIncluded: boolean
  pickupLocation: string
  rating?: number | null
  deepLink: string // lien pour réserver SUR le site du fournisseur
  photo?: string
}

export interface RentalProvider {
  readonly source: string
  search(params: RentalSearch): Promise<RentalOffer[]>
}

/**
 * Lien de comparaison « deep-link » vers un loueur (recherche pré-remplie).
 * Sert de repli sans clé API : on ne connaît pas les prix, mais on redirige
 * l'utilisateur vers la recherche du fournisseur. Aucun paiement dans l'app.
 */
export interface RentalRedirect {
  source: string
  label: string
  vehicleType: VehicleType
  deepLink: string
  /** Couverture : complète, ou partielle (surtout moto). */
  coverage: 'full' | 'partial'
}
