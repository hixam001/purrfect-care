import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'

const SUPABASE_URL      = 'https://ycllsxzhpajfaavzlkza.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljbGxzeHpocGFqZmFhdnpsa3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjQxMzMsImV4cCI6MjA5Mzc0MDEzM30.XCjQHKF6DsVUklQXeNPoLeQ-yZO_VrZgGRObAKinyNc'

export const API_URL = 'https://us-central1-purrfect-care-app.cloudfunctions.net/server'

/* ── Storage adapter — SecureStore on native, localStorage on web ── */
async function getStorage() {
  if (Platform.OS === 'web') {
    return {
      getItem:    (key)        => Promise.resolve(localStorage.getItem(key)),
      setItem:    (key, value) => Promise.resolve(localStorage.setItem(key, value)),
      removeItem: (key)        => Promise.resolve(localStorage.removeItem(key)),
    }
  }
  const SecureStore = await import('expo-secure-store')
  return {
    getItem:    (key)        => SecureStore.getItemAsync(key),
    setItem:    (key, value) => SecureStore.setItemAsync(key, value),
    removeItem: (key)        => SecureStore.deleteItemAsync(key),
  }
}

/* Synchronous shim used during client construction — async swap happens at runtime */
const StorageShim = {
  getItem:    (key)        => {
    if (Platform.OS === 'web') return Promise.resolve(localStorage.getItem(key))
    return import('expo-secure-store').then(m => m.getItemAsync(key))
  },
  setItem:    (key, value) => {
    if (Platform.OS === 'web') return Promise.resolve(localStorage.setItem(key, value))
    return import('expo-secure-store').then(m => m.setItemAsync(key, value))
  },
  removeItem: (key)        => {
    if (Platform.OS === 'web') return Promise.resolve(localStorage.removeItem(key))
    return import('expo-secure-store').then(m => m.deleteItemAsync(key))
  },
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage:            StorageShim,
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: Platform.OS === 'web',
  },
})
