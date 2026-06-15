import { useState } from 'react'
import type { RentalSearch, VehicleType } from '../../adapters/rentals'

/** Date ISO (YYYY-MM-DD) décalée de `days` à partir d'aujourd'hui. */
function isoDate(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function RentalSearchForm({ onSearch }: { onSearch: (s: RentalSearch) => void }) {
  const [vehicleType, setVehicleType] = useState<VehicleType>('car')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [pickupDate, setPickupDate] = useState(isoDate(1))
  const [pickupTime, setPickupTime] = useState('10:00')
  const [dropoffDate, setDropoffDate] = useState(isoDate(4))
  const [dropoffTime, setDropoffTime] = useState('10:00')
  const [driverAge, setDriverAge] = useState('30')
  const [error, setError] = useState<string | null>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!city.trim()) {
      setError('Indique une ville ou un aéroport.')
      return
    }
    if (dropoffDate < pickupDate) {
      setError('La date de retour doit être après la prise en charge.')
      return
    }
    setError(null)
    onSearch({
      vehicleType,
      country: country.trim(),
      city: city.trim(),
      pickupDate,
      pickupTime,
      dropoffDate,
      dropoffTime,
      driverAge: driverAge ? Number(driverAge) : undefined,
    })
  }

  const field = 'rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-creme-500 focus:outline-none'
  const label = 'mb-1 block text-xs font-medium text-slate-400'

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      {/* Bascule Auto / Moto */}
      <div className="flex overflow-hidden rounded-xl border border-slate-700">
        {(['car', 'motorcycle'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setVehicleType(t)}
            className={[
              'flex-1 py-2.5 text-sm font-medium transition-colors',
              vehicleType === t ? 'bg-creme-500 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800',
            ].join(' ')}
          >
            {t === 'car' ? '🚗 Voiture' : '🏍️ Moto'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Ville / aéroport</label>
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Lisbonne, LIS…" className={`${field} w-full`} />
        </div>
        <div>
          <label className={label}>Pays</label>
          <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Portugal" className={`${field} w-full`} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Prise en charge</label>
          <div className="flex gap-2">
            <input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className={`${field} flex-1`} />
            <input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className={field} />
          </div>
        </div>
        <div>
          <label className={label}>Retour</label>
          <div className="flex gap-2">
            <input type="date" value={dropoffDate} onChange={(e) => setDropoffDate(e.target.value)} className={`${field} flex-1`} />
            <input type="time" value={dropoffTime} onChange={(e) => setDropoffTime(e.target.value)} className={field} />
          </div>
        </div>
      </div>

      <div className="w-1/2">
        <label className={label}>Âge du conducteur</label>
        <input type="number" min={18} max={99} value={driverAge} onChange={(e) => setDriverAge(e.target.value)} className={`${field} w-full`} />
      </div>

      {error && <p className="text-sm text-amber-400">{error}</p>}

      <button type="submit" className="w-full rounded-xl bg-creme-500 py-3 font-semibold text-slate-950 hover:bg-creme-400">
        🔍 Comparer les offres
      </button>
    </form>
  )
}
