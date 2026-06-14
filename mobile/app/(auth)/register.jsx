import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native'
import { Link, useRouter } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { Colors, FontFamily, FontSize, Spacing, Radius, Shadow } from '../../theme/tokens'

export default function RegisterScreen() {
  const { register, loading } = useAuth()
  const router = useRouter()

  const [step,     setStep]     = useState(1)
  const [fullName, setFullName] = useState('')
  const [email,    setEmail]    = useState('')
  const [phone,    setPhone]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [err,      setErr]      = useState('')

  async function handleSubmit() {
    setErr('')
    if (password !== confirm) { setErr('Passwords do not match.'); return }
    if (password.length < 8)  { setErr('Password must be at least 8 characters.'); return }
    const result = await register({
      name: fullName, email: email.trim().toLowerCase(),
      phone: phone || undefined, password, role: 'cat_owner',
    })
    if (result.ok) router.replace('/(tabs)/dashboard')
    else setErr(result.error)
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
          <Text style={s.title}>Join the sanctuary</Text>
          <Text style={s.subtitle}>Create your free Purrfect Care account</Text>
        </View>

        {/* Progress */}
        <View style={s.progressRow}>
          {[1, 2].map(n => (
            <View key={n} style={[s.progressDot, step >= n && s.progressDotActive]} />
          ))}
          <Text style={s.progressLabel}>Step {step} of 2</Text>
        </View>

        <View style={s.card}>

          {/* Step 1 — Role info */}
          {step === 1 && (
            <View style={{ gap: Spacing.lg }}>
              <View style={s.roleCard}>
                <Text style={s.roleIcon}>🐱</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.roleTitle}>Cat Owner</Text>
                  <Text style={s.roleDesc}>Book vets, track health & shop for your cat</Text>
                </View>
              </View>
              <View style={s.infoBox}>
                <Text style={s.infoText}>🏥 Running a clinic? Register at purrfectcare.pk/hospital/register</Text>
              </View>
              <TouchableOpacity style={s.btn} onPress={() => setStep(2)} activeOpacity={0.85}>
                <Text style={s.btnText}>Continue →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2 — Details */}
          {step === 2 && (
            <View style={{ gap: Spacing.lg }}>
              <TouchableOpacity onPress={() => setStep(1)} style={s.backBtn}>
                <Text style={s.backBtnText}>← Back</Text>
              </TouchableOpacity>

              {[
                { label: 'Full name', value: fullName, set: setFullName, placeholder: 'Laiba Khan', type: 'default' },
                { label: 'Email address', value: email, set: setEmail, placeholder: 'you@example.com', type: 'email-address' },
                { label: 'Phone (optional)', value: phone, set: setPhone, placeholder: '+92 300 0000000', type: 'phone-pad' },
                { label: 'Password', value: password, set: setPassword, placeholder: 'Min. 8 characters', secure: true },
                { label: 'Confirm password', value: confirm, set: setConfirm, placeholder: 'Repeat password', secure: true },
              ].map(f => (
                <View key={f.label} style={s.field}>
                  <Text style={s.label}>{f.label}</Text>
                  <TextInput
                    style={s.input}
                    placeholder={f.placeholder}
                    placeholderTextColor={Colors.textMuted}
                    keyboardType={f.type ?? 'default'}
                    autoCapitalize={f.type === 'email-address' ? 'none' : 'words'}
                    secureTextEntry={!!f.secure}
                    value={f.value}
                    onChangeText={f.set}
                  />
                </View>
              ))}

              {err ? (
                <View style={s.errorBox}>
                  <Text style={s.errorText}>⚠ {err}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[s.btn, loading && s.btnDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={s.btnText}>{loading ? 'Creating account…' : '🐾 Create Account'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={s.footerLink}>Sign in →</Text>
            </TouchableOpacity>
          </Link>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: Spacing['2xl'], paddingBottom: Spacing['4xl'] },
  hero:      { alignItems: 'center', marginBottom: Spacing.xl },
  logoBox:   { width: 72, height: 72, borderRadius: Radius.xl, backgroundColor: Colors.olive, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg, ...Shadow.md },
  logoEmoji: { fontSize: 36 },
  title:     { fontFamily: FontFamily.displayBlack, fontSize: FontSize['3xl'], color: Colors.text, marginBottom: Spacing.xs, textAlign: 'center' },
  subtitle:  { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.md, color: Colors.textMuted, textAlign: 'center' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg, justifyContent: 'center' },
  progressDot: { width: 24, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  progressDotActive: { width: 48, backgroundColor: Colors.olive },
  progressLabel: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.xs, color: Colors.textMuted, marginLeft: Spacing.sm },
  card:      { backgroundColor: Colors.surface, borderRadius: Radius['2xl'], padding: Spacing['2xl'], borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  roleCard:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderRadius: Radius.lg, borderWidth: 2, borderColor: Colors.olive, backgroundColor: Colors.oliveBg },
  roleIcon:  { fontSize: 28 },
  roleTitle: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.md, color: Colors.text },
  roleDesc:  { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  infoBox:   { padding: Spacing.md, borderRadius: Radius.md, backgroundColor: Colors.oliveBg, borderWidth: 1, borderColor: Colors.oliveBorder },
  infoText:  { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, color: Colors.textSoft },
  backBtn:   { alignSelf: 'flex-start' },
  backBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.base, color: Colors.textMuted },
  field:     { gap: Spacing.xs },
  label:     { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, color: Colors.textSoft },
  input:     { backgroundColor: Colors.bgSoft, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontFamily: FontFamily.bodyRegular, fontSize: FontSize.md, color: Colors.text },
  errorBox:  { backgroundColor: Colors.dangerBg, borderWidth: 1, borderColor: Colors.dangerBorder, borderRadius: Radius.md, padding: Spacing.md },
  errorText: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.sm, color: Colors.dangerText },
  btn:       { backgroundColor: Colors.olive, borderRadius: Radius.lg, paddingVertical: Spacing.lg, alignItems: 'center', ...Shadow.sm },
  btnDisabled: { opacity: 0.55 },
  btnText:   { fontFamily: FontFamily.bodyBold, fontSize: FontSize.md, color: Colors.white },
  footer:    { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.xl },
  footerText:{ fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base, color: Colors.textMuted },
  footerLink:{ fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.base, color: Colors.olive },
})
