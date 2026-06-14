import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, Image, KeyboardAvoidingView, Platform, Switch,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { API_URL } from '../lib/supabase'
import { Colors, FontFamily, FontSize, Spacing, Radius, Shadow } from '../theme/tokens'

const TABS = ['Profile', 'Security', 'Notifications']

export default function SettingsScreen() {
  const router = useRouter()
  const { user, logout } = useAuth()

  const [tab,          setTab]          = useState('Profile')
  const [name,         setName]         = useState('')
  const [phone,        setPhone]        = useState('')
  const [city,         setCity]         = useState('')
  const [avatarUrl,    setAvatarUrl]    = useState(null)
  const [avatarLocal,  setAvatarLocal]  = useState(null)
  const [saving,       setSaving]       = useState(false)
  const [oldPw,        setOldPw]        = useState('')
  const [newPw,        setNewPw]        = useState('')
  const [confirmPw,    setConfirmPw]    = useState('')
  const [savingPw,     setSavingPw]     = useState(false)
  const [notifAppt,    setNotifAppt]    = useState(true)
  const [notifHealth,  setNotifHealth]  = useState(true)
  const [notifStore,   setNotifStore]   = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name ?? '')
      setPhone(user.phone ?? '')
      setCity(user.city ?? '')
      setAvatarUrl(user.avatar_url ?? null)
    }
  }, [user])

  async function pickAvatar() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6, allowsEditing: true, aspect: [1,1],
    })
    if (res.canceled) return
    const uri  = res.assets[0].uri
    setAvatarLocal(uri)
    const path = `avatars/${user.id}/${Date.now()}.jpg`
    const file = { uri, name: `avatar_${Date.now()}.jpg`, type: 'image/jpeg' }
    const { data, error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(data.path)
      setAvatarUrl(publicUrl)
    }
  }

  async function saveProfile() {
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${session?.access_token}` },
        body: JSON.stringify({ name, phone: phone||null, city: city||null, avatar_url: avatarUrl||null }),
      })
      if (res.ok) Alert.alert('Saved', 'Your profile has been updated.')
      else Alert.alert('Error', 'Could not save profile.')
    } catch { Alert.alert('Error', 'Network error.') }
    finally { setSaving(false) }
  }

  async function changePassword() {
    if (!newPw || newPw !== confirmPw) { Alert.alert('Error', 'Passwords do not match.'); return }
    if (newPw.length < 8) { Alert.alert('Error', 'Password must be at least 8 characters.'); return }
    setSavingPw(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setSavingPw(false)
    if (error) Alert.alert('Error', error.message)
    else { Alert.alert('Done', 'Password changed.'); setOldPw(''); setNewPw(''); setConfirmPw('') }
  }

  async function deleteAccount() {
    Alert.alert('Delete Account', 'This will permanently delete your account. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login') } },
    ])
  }

  return (
    <View style={{ flex:1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.olive} />
        </TouchableOpacity>
        <Text style={s.title}>Settings</Text>
        <View style={{ width:34 }} />
      </View>

      {/* Tab bar */}
      <View style={s.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[s.tabBtn, tab===t && s.tabBtnActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab===t && s.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==='ios'?'padding':'height'}>
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing['4xl'] }} keyboardShouldPersistTaps="handled">

          {/* ── Profile tab ── */}
          {tab === 'Profile' && (
            <View style={{ gap: Spacing.lg }}>
              {/* Avatar */}
              <TouchableOpacity onPress={pickAvatar} style={s.avatarWrap}>
                {(avatarLocal || avatarUrl)
                  ? <Image source={{ uri: avatarLocal ?? avatarUrl }} style={s.avatar} />
                  : <View style={s.avatarPlaceholder}><Ionicons name="person" size={36} color={Colors.olive} /></View>
                }
                <View style={s.cameraTag}>
                  <Ionicons name="camera" size={14} color={Colors.white} />
                </View>
              </TouchableOpacity>

              {/* Read-only email */}
              <View style={s.card}>
                <View style={s.readOnlyField}>
                  <Ionicons name="mail-outline" size={16} color={Colors.textMuted} />
                  <View>
                    <Text style={s.readOnlyLabel}>Email</Text>
                    <Text style={s.readOnlyValue}>{user?.email ?? '—'}</Text>
                  </View>
                </View>
              </View>

              {[
                { label:'Full name', value:name, set:setName, placeholder:'Your full name', icon:'person-outline' },
                { label:'Phone number', value:phone, set:setPhone, placeholder:'+92 300 0000000', icon:'call-outline', type:'phone-pad' },
                { label:'City', value:city, set:setCity, placeholder:'Lahore, Karachi…', icon:'location-outline' },
              ].map(f => (
                <View key={f.label} style={s.card}>
                  <Text style={s.cardLabel}>{f.label}</Text>
                  <View style={s.inputRow}>
                    <Ionicons name={f.icon} size={16} color={Colors.textMuted} />
                    <TextInput style={s.input} placeholder={f.placeholder} placeholderTextColor={Colors.textMuted}
                      value={f.value} onChangeText={f.set} keyboardType={f.type ?? 'default'}
                      autoCapitalize="words" />
                  </View>
                </View>
              ))}

              <TouchableOpacity style={[s.btn, saving && { opacity:.55 }]} onPress={saveProfile} disabled={saving}>
                <Text style={s.btnText}>{saving ? 'Saving…' : 'Save Profile'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Security tab ── */}
          {tab === 'Security' && (
            <View style={{ gap: Spacing.lg }}>
              <View style={s.card}>
                <Text style={s.cardTitle}>Change Password</Text>
                {[
                  { label:'New password', value:newPw, set:setNewPw, placeholder:'Min. 8 characters' },
                  { label:'Confirm password', value:confirmPw, set:setConfirmPw, placeholder:'Repeat password' },
                ].map(f => (
                  <View key={f.label} style={{ gap: Spacing.xs, marginTop: Spacing.md }}>
                    <Text style={s.cardLabel}>{f.label}</Text>
                    <TextInput style={s.inputPlain} placeholder={f.placeholder} placeholderTextColor={Colors.textMuted}
                      secureTextEntry value={f.value} onChangeText={f.set} />
                  </View>
                ))}
                <TouchableOpacity style={[s.btn, { marginTop: Spacing.lg }, savingPw && { opacity:.55 }]}
                  onPress={changePassword} disabled={savingPw}>
                  <Text style={s.btnText}>{savingPw ? 'Updating…' : 'Update Password'}</Text>
                </TouchableOpacity>
              </View>

              {/* Danger zone */}
              <View style={[s.card, { borderColor: Colors.dangerBorder }]}>
                <Text style={[s.cardTitle, { color: Colors.dangerText }]}>⚠ Danger Zone</Text>
                <Text style={s.cardSub}>Once deleted, your account and all data cannot be recovered.</Text>
                <TouchableOpacity style={[s.btn, { backgroundColor: Colors.dangerText, marginTop: Spacing.lg }]} onPress={deleteAccount}>
                  <Text style={s.btnText}>Delete Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── Notifications tab ── */}
          {tab === 'Notifications' && (
            <View style={s.card}>
              <Text style={s.cardTitle}>Push Notifications</Text>
              {[
                { label:'Appointment reminders', sub:'Upcoming vet visits', value:notifAppt,   set:setNotifAppt   },
                { label:'Health alerts',          sub:'Cat health updates',  value:notifHealth, set:setNotifHealth },
                { label:'Store promotions',       sub:'Deals and new products', value:notifStore, set:setNotifStore },
              ].map(n => (
                <View key={n.label} style={s.notifRow}>
                  <View style={{ flex:1 }}>
                    <Text style={s.notifLabel}>{n.label}</Text>
                    <Text style={s.notifSub}>{n.sub}</Text>
                  </View>
                  <Switch value={n.value} onValueChange={n.set}
                    trackColor={{ false: Colors.border, true: Colors.olive }} thumbColor={Colors.white} />
                </View>
              ))}
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const s = StyleSheet.create({
  header:    { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing['3xl']+Spacing.md, paddingBottom: Spacing.lg, backgroundColor: Colors.surface, borderBottomWidth:1, borderBottomColor: Colors.border },
  backBtn:   { width:34, height:34, alignItems:'center', justifyContent:'center' },
  title:     { fontFamily: FontFamily.displayBold, fontSize: FontSize.xl, color: Colors.text },
  tabBar:    { flexDirection:'row', backgroundColor: Colors.surface, borderBottomWidth:1, borderBottomColor: Colors.border, paddingHorizontal: Spacing.lg },
  tabBtn:    { flex:1, paddingVertical: Spacing.md, alignItems:'center', borderBottomWidth:2, borderBottomColor:'transparent' },
  tabBtnActive: { borderBottomColor: Colors.olive },
  tabText:   { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.sm, color: Colors.textMuted },
  tabTextActive: { fontFamily: FontFamily.bodyBold, color: Colors.olive },
  avatarWrap:{ alignSelf:'center', marginBottom: Spacing.sm },
  avatar:    { width:90, height:90, borderRadius:45, borderWidth:3, borderColor: Colors.olive },
  avatarPlaceholder: { width:90, height:90, borderRadius:45, backgroundColor: Colors.oliveBg, alignItems:'center', justifyContent:'center', borderWidth:2, borderColor: Colors.olive, borderStyle:'dashed' },
  cameraTag: { position:'absolute', bottom:0, right:0, width:28, height:28, borderRadius:14, backgroundColor: Colors.olive, alignItems:'center', justifyContent:'center' },
  card:      { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth:1, borderColor: Colors.border, gap: Spacing.sm, ...Shadow.sm },
  cardTitle: { fontFamily: FontFamily.displayBold, fontSize: FontSize.lg, color: Colors.text },
  cardLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, color: Colors.textSoft },
  cardSub:   { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, color: Colors.textMuted, marginTop:2 },
  readOnlyField: { flexDirection:'row', alignItems:'center', gap: Spacing.md },
  readOnlyLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.xs, color: Colors.textMuted },
  readOnlyValue: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.md, color: Colors.textSoft },
  inputRow:  { flexDirection:'row', alignItems:'center', gap: Spacing.sm, borderWidth:1.5, borderColor: Colors.border, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, backgroundColor: Colors.bgSoft },
  input:     { flex:1, fontFamily: FontFamily.bodyRegular, fontSize: FontSize.md, color: Colors.text, paddingVertical: Spacing.md },
  inputPlain:{ borderWidth:1.5, borderColor: Colors.border, borderRadius: Radius.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontFamily: FontFamily.bodyRegular, fontSize: FontSize.md, color: Colors.text, backgroundColor: Colors.bgSoft },
  btn:       { backgroundColor: Colors.olive, borderRadius: Radius.lg, paddingVertical: Spacing.lg, alignItems:'center', ...Shadow.sm },
  btnText:   { fontFamily: FontFamily.bodyBold, fontSize: FontSize.md, color: Colors.white },
  notifRow:  { flexDirection:'row', alignItems:'center', paddingVertical: Spacing.md, borderTopWidth:1, borderTopColor: Colors.borderLight },
  notifLabel:{ fontFamily: FontFamily.bodyBold, fontSize: FontSize.base, color: Colors.text },
  notifSub:  { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, color: Colors.textMuted, marginTop:2 },
})
