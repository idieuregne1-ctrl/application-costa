import { useMemo, useState } from 'react'
import type { RentalSearch, RentalRedirect } from '../adapters/rentals'
import { useRentals, useFxRates } from '../hooks/useRentals'
import {
 DEFAULT_RENTAL_FILTERS,
 filterOffers,
 sortOffers,
 type RentalFilters,
 type RentalSortBy,
} from '../core/rentalFilters'
import RentalSearchForm from '../components/rentals/RentalSearchForm'
import RentalOfferCard from '../components/rentals/RentalOfferCard'
import { useAppStore } from '../store/useAppStore'
import { useI18n } from '../lib/i18n'

const SORTS: { value: RentalSortBy; label: string }[] = [
 { value: 'priceTotal', label: 'Prix total' },
 { value: 'pricePerDay', label: 'Prix/jour' },
 { value: 'rating', label: 'Note' },
 { value: 'category', label: 'Catégorie' },
]

export default function RentalsPage() {
 const { t } = useI18n()
 const currency = useAppStore((s) => s.currency)
 const [search, setSearch] = useState<RentalSearch | null>(null)
 const [filters, setFilters] = useState<RentalFilters>(DEFAULT_RENTAL_FILTERS)

 const { data, isLoading, isError, error } = useRentals(search)
 const fx = useFxRates(currency)

 const offers = data?.offers ?? []
 const visibleOffers = useMemo(
 () => sortOffers(filterOffers(offers, filters, currency, fx.data ?? null), filters.sortBy, currency, fx.data ?? null),
 [offers, filters, currency, fx.data],
 )

 return (
 <div className="mx-auto flex min-h-full max-w-2xl flex-col px-4 py-6">
 <header className="mb-4">
 <h1 className="font-serif text-2xl text-ink">{t('Location de véhicules')}</h1>
 <p className="mt-1 text-sm text-stone-500">
 {t('Compare auto & moto à travers plusieurs loueurs — réservation sur leur site.')}
 </p>
 </header>

 <RentalSearchForm onSearch={setSearch} />

 {search && (
 <div className="mt-5 space-y-4">
 {isLoading && <p className="text-sm text-stone-500">{t('Recherche des offres…')}</p>}
 {isError && (
 <p className="text-sm text-amber-700">
 {error instanceof Error ? error.message : t('Erreur inconnue.')}
 </p>
 )}

 {/* Offres avec prix (si une API partenaire est branchée) */}
 {offers.length > 0 && (
 <section className="space-y-3">
 <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
 <span>{visibleOffers.length} {t('offres')}</span>
 <select
 value={filters.sortBy}
 onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value as RentalSortBy }))}
 className="rounded-lg border border-line bg-paper px-2 py-1"
 >
 {SORTS.map((s) => (
 <option key={s.value} value={s.value}>{t(s.label)}</option>
 ))}
 </select>
 </div>
 <div className="space-y-2">
 {visibleOffers.map((o) => (
 <RentalOfferCard key={o.id} offer={o} displayCurrency={currency} fx={fx.data ?? null} />
 ))}
 </div>
 </section>
 )}

 {/* Liens loueurs (deep-link, toujours dispo, sans clé) */}
 <RedirectsSection redirects={data?.redirects ?? []} note={data?.note} hasOffers={offers.length > 0} />
 </div>
 )}
 </div>
 )
}

function RedirectsSection({
 redirects,
 note,
 hasOffers,
}: {
 redirects: RentalRedirect[]
 note?: string
 hasOffers: boolean
}) {
 const { t } = useI18n()
 if (redirects.length === 0) return null
 const partial = redirects.some((r) => r.coverage === 'partial')
 return (
 <section className="space-y-2 rounded-2xl border border-line bg-white p-4">
 <h2 className="text-sm font-semibold text-ink">
 {hasOffers ? t('Comparer aussi directement chez les loueurs') : t('Comparer chez les loueurs')}
 </h2>
 {!hasOffers && note && <p className="text-xs text-stone-400">{note}</p>}
 <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
 {redirects.map((r) => (
 <a
 key={r.source}
 href={r.deepLink}
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center justify-between rounded-xl border border-line px-3 py-2.5 text-sm text-ink hover:bg-stone-100"
 >
 <span className="truncate">{r.label}</span>
 <span className="ml-2 flex-shrink-0 text-stone-400">↗</span>
 </a>
 ))}
 </div>
 {partial && (
 <p className="text-[11px] text-amber-700/80">
 {t('Couverture moto partielle selon les destinations.')}
 </p>
 )}
 </section>
 )
}
