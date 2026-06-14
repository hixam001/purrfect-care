import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { Platform } from 'react-native'
import {
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_700Bold,
  Fraunces_900Black,
} from '@expo-google-fonts/fraunces'
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { AuthProvider, useAuth } from '../context/AuthContext'

SplashScreen.preventAutoHideAsync()

/* ── Auth gate — redirect based on login state ── */
function AuthGate() {
  const { isLoggedIn, loading } = useAuth()
  const router   = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (loading) return
    const inAuth = segments[0] === '(auth)'
    if (!isLoggedIn && !inAuth) {
      router.replace('/(auth)/login')
    } else if (isLoggedIn && inAuth) {
      router.replace('/(tabs)/dashboard')
    }
  }, [isLoggedIn, loading, segments])

  return null
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_500Medium,
    Fraunces_700Bold,
    Fraunces_900Black,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  })

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync()
    // Force light mode on web regardless of OS dark-mode setting
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.style.colorScheme = 'light'
      document.documentElement.style.backgroundColor = '#F5EBE6'
      // Inject a style tag to override any prefers-color-scheme media queries
      const style = document.createElement('style')
      style.textContent = `
        :root { color-scheme: light !important; }
        @media (prefers-color-scheme: dark) {
          :root { background-color: #F5EBE6 !important; color: #2D1B0E !important; }
          * { color-scheme: light !important; }
        }
      `
      document.head.appendChild(style)
    }
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <AuthGate />
        <StatusBar style="dark" backgroundColor="#F5EBE6" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)"  options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)"  options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="hospital/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="book/[vetId]"  options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </GestureHandlerRootView>
  )
}
