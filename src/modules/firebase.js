// Lazy Firebase bootstrap. Everything degrades gracefully to demo mode when
// firebaseConfig is null (see src/config.js).
import { firebaseConfig } from '../config.js'

let appPromise = null

export function isConfigured() {
  return !!(firebaseConfig && firebaseConfig.apiKey)
}

async function getApp() {
  if (!isConfigured()) return null
  if (!appPromise) {
    appPromise = import('firebase/app').then(({ initializeApp }) =>
      initializeApp(firebaseConfig)
    )
  }
  return appPromise
}

export async function getDb() {
  const app = await getApp()
  if (!app) return null
  const fs = await import('firebase/firestore')
  return { db: fs.getFirestore(app), fs }
}

export async function getStorageApi() {
  const app = await getApp()
  if (!app) return null
  const st = await import('firebase/storage')
  return { storage: st.getStorage(app), st }
}
