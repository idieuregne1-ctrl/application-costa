/**
 * Mini wrapper IndexedDB clé→valeur (sans dépendance).
 * Sert de stockage persistant pour les filtres (Phase 5) et, plus tard, le cache
 * hors ligne (Phase 12). On garde un seul object store « kv ».
 */

const DB_NAME = 'creme-de-la-creme'
const DB_VERSION = 1
const STORE = 'kv'

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode)
        const req = fn(transaction.objectStore(STORE))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      }),
  )
}

export function idbGet<T = unknown>(key: string): Promise<T | undefined> {
  return tx('readonly', (s) => s.get(key) as IDBRequest<T>)
}

export function idbSet(key: string, value: unknown): Promise<IDBValidKey> {
  return tx('readwrite', (s) => s.put(value, key))
}

export function idbDel(key: string): Promise<undefined> {
  return tx('readwrite', (s) => s.delete(key) as IDBRequest<undefined>)
}
