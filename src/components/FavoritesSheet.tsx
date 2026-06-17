import { useFavorites } from '../store/useFavorites'
import { useAppStore } from '../store/useAppStore'
import PlaceCard from './PlaceCard'
import { useI18n } from '../lib/i18n'

/**
 * Panneau des favoris (sauvegardés en IndexedDB, sans compte).
 * Cliquer un favori ouvre sa fiche ; les favoris restent dispo hors ligne et
 * alimenteront le planificateur de journée (Phase 10).
 */
export default function FavoritesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
 const { t } = useI18n()
 // Sélectionner l'objet stable, puis dériver le tableau (éviter une nouvelle
 // référence à chaque rendu, qui boucle avec Zustand v5).
 const favoritesMap = useFavorites((s) => s.favorites)
 const favorites = Object.values(favoritesMap)
 const openDetail = useAppStore((s) => s.openDetail)

 if (!open) return null

 return (
 <div className="fixed inset-0 z-40 flex justify-end">
 <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
 <aside
 role="dialog"
 aria-modal="true"
 aria-label="Favoris"
 className="relative flex h-full w-full max-w-md flex-col bg-paper shadow-2xl"
 >
 <header className="flex items-center justify-between border-b border-line p-4">
 <h2 className="font-serif text-lg text-ink">{t('Mes favoris')}</h2>
 <button
 onClick={onClose}
 aria-label={t('Fermer')}
 className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100"
 >
 ✕
 </button>
 </header>

 <div className="flex-1 overflow-y-auto p-4">
 {favorites.length === 0 ? (
 <div className="flex h-full flex-col items-center justify-center text-center">
 <span className="text-3xl"></span>
 <p className="mt-2 text-stone-600">{t('Aucun favori')}</p>
 <p className="mt-1 max-w-xs text-sm text-stone-400">
 {t('Touche le cœur sur un lieu pour le sauvegarder ici.')}
 </p>
 </div>
 ) : (
 <div className="grid grid-cols-1 gap-3">
 {favorites.map((p) => (
 <PlaceCard key={p.id} place={p} onSelect={() => openDetail(p.id)} />
 ))}
 </div>
 )}
 </div>
 </aside>
 </div>
 )
}
