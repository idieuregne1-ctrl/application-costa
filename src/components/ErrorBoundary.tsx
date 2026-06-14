import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * Garde-fou : capture les erreurs de rendu pour éviter l'écran blanc, et propose
 * de recharger. Affiche le message en dev pour le diagnostic.
 */
interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erreur de rendu capturée :', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-full flex-col items-center justify-center p-6 text-center">
          <span className="text-4xl">😕</span>
          <h1 className="mt-3 text-lg font-semibold text-white">Une erreur est survenue</h1>
          <p className="mt-1 max-w-sm text-sm text-slate-400">
            L'application a rencontré un souci d'affichage. Recharge pour réessayer.
          </p>
          {import.meta.env.DEV && (
            <pre className="mt-3 max-w-full overflow-auto rounded-lg bg-slate-800 p-3 text-left text-xs text-amber-300">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-creme-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-creme-400"
          >
            Recharger
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
