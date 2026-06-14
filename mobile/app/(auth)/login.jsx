import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { Link, useRouter } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { Colors, FontFamily, FontSize, Spacing, Radius, Shadow } from '../../theme/tokens'

export default function LoginScreen() {
  const { login, loading } = useAuth()
  const router = useRouter()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [err,      setErr]      = useState('')

  async function handleLogin() {
    if (!email || !password) { setErr('Please enter your email and password.'); return }
    setErr('')
    const result = await login({ email: email.trim().toLowerCase(), password })
    if (result.ok) {
      router.replace('/(tabs)/dashboard')
    } else {
      setErr(result.error)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

        {/* Hero */}
        <View style={s.hero}>
          <View style={s.logoBox}>
            <Text style={s.logoEmoji}>🐱</Text>
          </View>
          <Text style={s.title}>Welcome back</Text>
          <Text style={s.subtitle}>Sign in to your Purrfect Care account</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          <View style={s.field}>
            <Text style={s.label}>Email address</Text>
            <TextInput
              style={s.input}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Password</Text>
            <TextInput
              style={s.input}
              placeholder="Your password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {err ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>⚠ {err}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={s.btnText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>Don't have an account? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={s.footerLink}>Create one →</Text>
            </TouchableOpacity>
          </Link>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
  },
  hero: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: Radius.xl,
    backgroundColor: Colors.olive,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  logoEmoji: { fontSize: 36 },
  title: {
    fontFamily: FontFamily.displayBlack,
    fontSize: FontSize['3xl'],
    color: Colors.text,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius['2xl'],
    padding: Spacing['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
    gap: Spacing.lg,
  },
  field: { gap: Spacing.xs },
  label: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.textSoft,
  },
  input: {
    backgroundColor: Colors.bgSoft,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  errorBox: {
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  errorText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.dangerText,
  },
  btn: {
    backgroundColor: Colors.olive,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    ...Shadow.sm,
  },
  btnDisabled: { opacity: 0.55 },
  btnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.md,
    color: Colors.white,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  footerText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.base,
    color: Colors.textMuted,
  },
  footerLink: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: Colors.olive,
  },
})
