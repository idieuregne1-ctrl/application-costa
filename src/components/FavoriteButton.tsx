import type { MergedPlace } from '../core'
import { useFavorites } from '../store/useFavorites'

/**
 * Bouton cœur pour ajouter/retirer un lieu des favoris.
 * Stoppe la propagation pour ne pas déclencher l'ouverture de la fiche quand il
 * est posé sur une carte.
 */
export default function FavoriteButton({
  place,
  className = '',
}: {
  place: MergedPlace
  className?: string
}) {
  // Sélecteur basé sur `favorites` (et non sur la fonction) pour être réactif.
  const isFav = useFavorites((s) => Boolean(s.favorites[place.id]))
  const toggle = useFavorites((s) => s.toggle)

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        toggle(place)
      }}
      aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      aria-pressed={isFav}
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-base backdrop-blur transition-transform hover:scale-110 ${className}`}
    >
      {isFav ? '❤️' : '🤍'}
    </button>
  )
}
