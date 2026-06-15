import type { RentalOffer } from '../../adapters/rentals'
import { offerPriceIn, formatMoney, type FxRates } from '../../core/currency'

/** Carte comparative d'une offre de location (depuis une API partenaire). */
export default function RentalOfferCard({
  offer,
  displayCurrency,
  fx,
}: {
  offer: RentalOffer
  displayCurrency: string
  fx: FxRates | null
}) {
  const total = offerPriceIn(offer, displayCurrency, fx)
  const perDay = fx ? offerPriceIn({ ...offer, priceTotal: offer.pricePerDay }, displayCurrency, fx) : offer.pricePerDay

  return (
    <div className="flex gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
      {offer.photo ? (
        <img src={offer.photo} alt="" loading="lazy" className="h-16 w-24 flex-shrink-0 rounded-lg object-cover" />
      ) : (
        <div className="flex h-16 w-24 flex-shrink-0 items-center justify-center rounded-lg bg-slate-800 text-2xl">
          {offer.vehicleType === 'car' ? '🚗' : '🏍️'}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-medium text-slate-100">{offer.model}</p>
          <span className="flex-shrink-0 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase text-slate-400">
            {offer.source}
          </span>
        </div>
        <p className="text-xs text-slate-500">
          {offer.supplier} · {offer.category}
          {offer.transmission ? ` · ${offer.transmission}` : ''}
          {offer.seats ? ` · ${offer.seats} places` : ''}
        </p>
        <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-slate-400">
          <span>{offer.mileage}</span>
          <span className={offer.insuranceIncluded ? 'text-emerald-400' : 'text-slate-500'}>
            {offer.insuranceIncluded ? 'assurance incluse' : 'assurance en option'}
          </span>
          {offer.rating != null && <span>⭐ {offer.rating.toFixed(1)}</span>}
        </div>
      </div>

      <div className="flex flex-shrink-0 flex-col items-end justify-between">
        <div className="text-right">
          <p className="font-semibold text-white">
            {total != null ? formatMoney(total, displayCurrency) : `${offer.priceTotal} ${offer.currency}`}
          </p>
          <p className="text-[11px] text-slate-500">
            {perDay != null ? `${formatMoney(perDay, displayCurrency)}/j` : `${offer.pricePerDay} ${offer.currency}/j`}
          </p>
        </div>
        <a
          href={offer.deepLink}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-creme-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-creme-400"
        >
          Réserver
        </a>
      </div>
    </div>
  )
}
