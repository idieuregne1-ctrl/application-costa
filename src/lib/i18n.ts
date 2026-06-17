import { useAppStore } from '../store/useAppStore'

/**
 * i18n léger : la CLÉ de traduction est directement le texte français (qui sert
 * aussi de repli). Le dictionnaire `EN` mappe FR → EN. Une chaîne absente du
 * dictionnaire retombe sur le français — donc rien ne casse si une traduction
 * manque.
 */
export type Lang = 'fr' | 'en'

export const LANGUAGES: { value: Lang; label: string }[] = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
]

export const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'JPY', 'AUD']

const EN: Record<string, string> = {
  // Navigation / sections
  Découverte: 'Discover',
  Location: 'Rentals',
  'Application de voyage': 'Travel app',
  'Le meilleur autour de vous, soigneusement sélectionné.': 'The best around you, carefully curated.',

  // Localisation
  'Ma position': 'My location',
  'Localisation…': 'Locating…',
  'Chercher une ville, une adresse…': 'Search a city or address…',
  'Recherche…': 'Searching…',
  'La recherche a échoué. Réessaie.': 'Search failed. Please try again.',
  'Aucun lieu trouvé pour cette recherche.': 'No place found for this search.',

  // Catégories
  Restaurants: 'Restaurants',
  Activités: 'Activities',
  Plages: 'Beaches',
  Randonnée: 'Hiking',
  Pêche: 'Fishing',
  'Culture locale': 'Local culture',

  // Presets
  'Souper ce soir': 'Dinner tonight',
  'Sur le pouce': 'Quick bite',
  'Rando du matin': 'Morning hike',
  'Sortie pêche': 'Fishing trip',
  'Journée culture': 'Culture day',

  // Filtres / résultats
  Filtres: 'Filters',
  Télécharger: 'Download',
  Téléchargé: 'Downloaded',
  'Surprends-moi': 'Surprise me',
  lieux: 'places',
  'Source(s) en échec :': 'Failed source(s):',
  'Voir plus de résultats': 'Show more results',
  Réduire: 'Show less',
  'valeurs sûres': 'safe bets',
  'peu connues, très bien notées': 'lesser known, top rated',
  'Crème de la crème': 'The very best',
  'Excellents choix': 'Excellent picks',
  Pépites: 'Hidden gems',
  'Pas de note': 'No rating',
  Ouvert: 'Open',
  Fermé: 'Closed',
  sources: 'sources',

  // États vides
  'Choisissez un point de départ': 'Choose a starting point',
  'Activez votre position ou cherchez une ville pour découvrir le meilleur autour.':
    'Enable your location or search a city to discover the best around you.',
  'Bientôt disponible': 'Coming soon',
  'Cette catégorie arrive prochainement.': 'This category is coming soon.',
  'Échec du chargement': 'Loading failed',
  'Erreur inconnue.': 'Unknown error.',
  Réessayer: 'Retry',
  'Aucun résultat': 'No results',
  'Rien ne correspond ici. Élargissez le rayon, assouplissez les filtres, ou changez de zone.':
    'Nothing matches here. Widen the radius, relax the filters, or change area.',

  // Fiche détail
  'Pas encore de note': 'No rating yet',
  'Ouvert maintenant': 'Open now',
  avis: 'reviews',
  'Recommandé sur': 'Recommended on',
  Source: 'Source',
  'Y aller': 'Directions',
  Distance: 'Distance',
  Dénivelé: 'Elevation',
  Difficulté: 'Difficulty',
  Durée: 'Duration',
  "Vérifiez le permis et la réglementation de pêche locaux avant de partir. Les informations sur ces spots peuvent être incomplètes.":
    'Check the local fishing permit and regulations before heading out. Information on these spots may be incomplete.',

  // Résumé IA
  "Résumé d'avis": 'Review summary',
  "Pas assez d'avis pour générer un résumé fiable.": 'Not enough reviews to generate a reliable summary.',
  'Lecture des avis…': 'Reading reviews…',
  "Le verdict en un coup d'œil — sans lire 30 commentaires.": 'The verdict at a glance — without reading 30 comments.',
  'Résumer les avis': 'Summarize reviews',
  'On aime': 'Loved',
  Bémols: 'Caveats',
  'Idéal pour': 'Great for',

  // Météo
  Météo: 'Weather',
  'Auj.': 'Today',
  Lever: 'Sunrise',
  Coucher: 'Sunset',
  Vagues: 'Waves',
  Mer: 'Sea',
  'Bonne journée pour sortir': 'Good day to go out',
  'Risque de pluie aujourd’hui': 'Chance of rain today',
  'Météo indisponible pour le moment.': 'Weather unavailable right now.',

  // Favoris / planificateur / zones / surprise
  'Mes favoris': 'My favorites',
  'Aucun favori': 'No favorites',
  'Touche le cœur sur un lieu pour le sauvegarder ici.': 'Tap the heart on a place to save it here.',
  'Planificateur de journée': 'Day planner',
  'Ajouter mes favoris': 'Add my favorites',
  'Itinéraire vide': 'Empty itinerary',
  'Ajoute des favoris pour composer ta journée et voir les temps de trajet.':
    'Add favorites to build your day and see travel times.',
  arrêts: 'stops',
  trajet: 'travel',
  Total: 'Total',
  'Google Maps': 'Google Maps',
  Partager: 'Share',
  'Copié !': 'Copied!',
  "Vider l'itinéraire": 'Clear itinerary',
  min: 'min',
  'Mes zones téléchargées': 'My downloaded areas',
  'Aucune zone téléchargée': 'No downloaded areas',
  'Connecté, télécharge une zone pour la consulter hors ligne en voyage.':
    'While online, download an area to browse it offline when traveling.',
  Rafraîchir: 'Refresh',
  'Rafraîchissement…': 'Refreshing…',
  Supprimer: 'Delete',
  'à rafraîchir': 'refresh needed',
  'Mode hors ligne': 'Offline mode',
  'données du': 'data from',
  'téléchargez une zone quand vous êtes connecté': 'download an area while online',
  'Régénère': 'Regenerate',
  "Pas assez de lieux ici pour proposer une sélection.": 'Not enough places here to suggest a selection.',

  // Préférences
  Rayon: 'Radius',
  Type: 'Type',
  Prix: 'Price',
  'Note minimale': 'Minimum rating',
  'Trier par': 'Sort by',
  'Sources actives': 'Active sources',
  'Catégorie active': 'Active category',
  Toutes: 'All',
  Qualité: 'Quality',
  "Nb d'avis": 'Review count',
  Facile: 'Easy',
  Modéré: 'Moderate',
  Difficile: 'Hard',
  places: 'seats',

  Préférences: 'Preferences',
  Langue: 'Language',
  Devise: 'Currency',
  'La devise est utilisée pour comparer les offres de location.':
    'The currency is used to compare rental offers.',
  'Réinitialiser': 'Reset',
  Appliquer: 'Apply',
  Fermer: 'Close',

  // Location de véhicules
  'Location de véhicules': 'Vehicle rentals',
  'Compare auto & moto à travers plusieurs loueurs — réservation sur leur site.':
    'Compare cars & motorcycles across providers — book on their site.',
  Voiture: 'Car',
  Moto: 'Motorcycle',
  'Ville / aéroport': 'City / airport',
  Pays: 'Country',
  'Prise en charge': 'Pick-up',
  Retour: 'Drop-off',
  'Âge du conducteur': 'Driver age',
  'Comparer les offres': 'Compare offers',
  'Recherche des offres…': 'Searching offers…',
  'Comparer chez les loueurs': 'Compare with rental providers',
  'Comparer aussi directement chez les loueurs': 'Also compare directly with providers',
  'Couverture moto partielle selon les destinations.': 'Partial motorcycle coverage depending on destination.',
  Réserver: 'Book',
  'assurance incluse': 'insurance included',
  'assurance en option': 'insurance optional',
  offres: 'offers',
  'Prix total': 'Total price',
  'Prix/jour': 'Price/day',
  Note: 'Rating',
  Catégorie: 'Category',
}

const DICTS: Record<Lang, Record<string, string>> = { fr: {}, en: EN }

export function translate(lang: Lang, s: string): string {
  if (lang === 'fr') return s
  return DICTS[lang][s] ?? s
}

/** Hook de traduction. `t(texteFrançais)` renvoie la version dans la langue active. */
export function useI18n() {
  const lang = useAppStore((s) => s.lang)
  return {
    lang,
    t: (s: string) => translate(lang as Lang, s),
  }
}
