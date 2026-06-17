import { useAppStore } from '../store/useAppStore'
import { useI18n, LANGUAGES, CURRENCIES, type Lang } from '../lib/i18n'
import Icon from './Icon'

/**
 * Panneau Préférences : langue de l'interface et devise d'affichage.
 * Les deux sont persistés (store) et appliqués immédiatement.
 */
export default function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n()
  const lang = useAppStore((s) => s.lang)
  const setLang = useAppStore((s) => s.setLang)
  const currency = useAppStore((s) => s.currency)
  const setCurrency = useAppStore((s) => s.setCurrency)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t('Préférences')}
        className="relative flex h-full w-full max-w-sm flex-col bg-paper shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-line p-4">
          <h2 className="font-serif text-lg text-ink">{t('Préférences')}</h2>
          <button
            onClick={onClose}
            aria-label={t('Fermer')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100"
          >
            <Icon name="x" size={18} />
          </button>
        </header>

        <div className="space-y-6 p-5">
          {/* Langue */}
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400">
              <Icon name="globe" size={14} />
              {t('Langue')}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setLang(l.value as Lang)}
                  className={[
                    'rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
                    lang === l.value
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-line text-stone-600 hover:bg-stone-100',
                  ].join(' ')}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Devise */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
              {t('Devise')}
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {CURRENCIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={[
                    'rounded-lg border px-2 py-2 text-sm font-medium transition-colors',
                    currency === c
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-line text-stone-600 hover:bg-stone-100',
                  ].join(' ')}
                >
                  {c}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-stone-400">
              {t('La devise est utilisée pour comparer les offres de location.')}
            </p>
          </div>
        </div>
      </aside>
    </div>
  )
}
