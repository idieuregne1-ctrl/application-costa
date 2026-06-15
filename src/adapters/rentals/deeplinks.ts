import type { RentalRedirect, RentalSearch } from './types'

/**
 * Liens « deep-link » de recherche pré-remplie vers les loueurs — fonctionnent
 * SANS aucune clé API. On ne connaît pas les prix (il faut une API partenaire pour
 * ça), mais on redirige l'utilisateur vers la recherche du fournisseur. Aucun
 * paiement dans l'app : le bouton ouvre simplement le site du loueur.
 *
 * Le pré-remplissage exact dépend de chaque fournisseur ; quand le format n'est
 * pas garanti, on amène l'utilisateur sur la bonne page de recherche.
 */

function loc(s: RentalSearch): string {
  return encodeURIComponent(`${s.city}${s.country ? `, ${s.country}` : ''}`)
}

/** Loueurs auto. */
function carRedirects(s: RentalSearch): RentalRedirect[] {
  const city = encodeURIComponent(s.city || s.country)
  const age = s.driverAge ?? 30
  return [
    {
      source: 'kayak',
      label: 'Kayak (comparateur multi-loueurs)',
      vehicleType: 'car',
      coverage: 'full',
      // Format d'URL voiture lisible et fiable de Kayak.
      deepLink: `https://www.kayak.com/cars/${city}/${s.pickupDate}/${s.dropoffDate}/${age}yo`,
    },
    {
      source: 'discovercars',
      label: 'DiscoverCars',
      vehicleType: 'car',
      coverage: 'full',
      deepLink: `https://www.discovercars.com/?country=&pickup-place=${loc(s)}&date-from=${s.pickupDate}&time-from=${s.pickupTime}&date-to=${s.dropoffDate}&time-to=${s.dropoffTime}`,
    },
    {
      source: 'rentalcars',
      label: 'Rentalcars (Booking)',
      vehicleType: 'car',
      coverage: 'full',
      deepLink: `https://www.rentalcars.com/en/search/?location=${loc(s)}&puDay=${s.pickupDate}&doDay=${s.dropoffDate}`,
    },
  ]
}

/** Loueurs moto (couverture plus limitée). */
function motoRedirects(s: RentalSearch): RentalRedirect[] {
  return [
    {
      source: 'bikesbooking',
      label: 'BikesBooking (scooters & motos)',
      vehicleType: 'motorcycle',
      coverage: 'partial',
      deepLink: `https://www.bikesbooking.com/search?location=${loc(s)}&date_from=${s.pickupDate}&date_to=${s.dropoffDate}`,
    },
    {
      source: 'eaglerider',
      label: 'EagleRider (motos)',
      vehicleType: 'motorcycle',
      coverage: 'partial',
      deepLink: `https://www.eaglerider.com/motorcycle-rentals?location=${loc(s)}`,
    },
    {
      source: 'google',
      label: `Recherche Google « location moto ${s.city} »`,
      vehicleType: 'motorcycle',
      coverage: 'partial',
      deepLink: `https://www.google.com/search?q=${encodeURIComponent(`location moto ${s.city} ${s.country}`)}`,
    },
  ]
}

export function buildRedirects(s: RentalSearch): RentalRedirect[] {
  return s.vehicleType === 'car' ? carRedirects(s) : motoRedirects(s)
}
