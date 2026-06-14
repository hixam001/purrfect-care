import { useEffect, useState, useRef } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, TextInput, Switch, ScrollView, Alert,
  KeyboardAvoidingView, Platform, Image, ActivityIndicator,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Colors, FontFamily, FontSize, Spacing, Radius, Shadow } from '../../theme/tokens'

const GENDERS = ['male', 'female']
const EMPTY   = { name:'', breed:'', age_months:'', weight_kg:'', color:'', gender:'male', is_neutered:false, microchip_id:'', photo_url:'' }

function fmtAge(m) {
  if (!m && m !== 0) return null
  if (m < 12) return `${m} mo`
  const y = Math.floor(m / 12); const r = m % 12
  return r ? `${y}y ${r}mo` : `${y} yr`
}

/* ─── Add/Edit modal ─────────────────────────────── */
function CatModal({ visible, onClose, onSaved, editing }) {
  const { user } = useAuth()
  const [form,    setForm]    = useState(EMPTY)
  const [saving,  setSaving]  = useState(false)
  const [preview, setPreview] = useState(null)
  const [err,     setErr]     = useState('')

  useEffect(() => {
    if (editing) {
      setForm({ name:editing.name??'', breed:editing.breed??'', age_months:editing.age_months??'',
                weight_kg:editing.weight_kg??'', color:editing.color??'', gender:editing.gender??'male',
                is_neutered:editing.is_neutered??false, microchip_id:editing.microchip_id??'', photo_url:editing.photo_url??'' })
      setPreview(editing.photo_url ?? null)
    } else {
      setForm(EMPTY); setPreview(null)
    }
    setErr('')
  }, [editing, visible])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function pickPhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7, allowsEditing: true, aspect: [1,1],
    })
    if (res.canceled) return
    const uri  = res.assets[0].uri
    setPreview(uri)
    const file = { uri, name: `cat_${Date.now()}.jpg`, type: 'image/jpeg' }
    const path = `cats/${user.id}/${Date.now()}.jpg`
    const { data, error } = await supabase.storage.from('cat-photos').upload(path, file, { upsert: true })
    if (error) { setErr('Photo upload failed'); return }
    const { data: { publicUrl } } = supabase.storage.from('cat-photos').getPublicUrl(data.path)
    set('photo_url', publicUrl)
  }

  async function submit() {
    if (!form.name.trim()) { setErr('Cat name is required'); return }
    setSaving(true); setErr('')
    const payload = {
      owner_id: user.id, name: form.name.trim(),
      breed: form.breed.trim()||null, gender: form.gender,
      age_months:  form.age_months  !== '' ? parseInt(form.age_months)   : null,
      weight_kg:   form.weight_kg   !== '' ? parseFloat(form.weight_kg)  : null,
      color:       form.color.trim()||null,
      is_neutered: form.is_neutered,
      microchip_id:form.microchip_id.trim()||null,
      photo_url:   form.photo_url||null,
    }
    const { error } = editing
      ? await supabase.from('cats').update(payload).eq('id', editing.id)
      : await supabase.from('cats').insert([payload])
    setSaving(false)
    if (error) { setErr(error.message); return }
    onSaved(); onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex:1, backgroundColor: Colors.bg }} behavior={Platform.OS==='ios'?'padding':'height'}>
        {/* Modal header */}
        <View style={m.header}>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={Colors.textMuted} /></TouchableOpacity>
          <Text style={m.headerTitle}>{editing ? 'Edit Cat' : 'Add a Cat'}</Text>
          <TouchableOpacity onPress={submit} disabled={saving}>
            <Text style={[m.saveBtn, saving && { opacity:.5 }]}>{saving ? 'Saving…' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.lg }} keyboardShouldPersistTaps="handled">

          {/* Photo */}
          <TouchableOpacity onPress={pickPhoto} style={m.photoBox}>
            {preview
              ? <Image source={{ uri: preview }} style={m.photoImg} />
              : <View style={m.photoPlaceholder}><Ionicons name="camera-outline" size={32} color={Colors.olive} /><Text style={m.photoLabel}>Add photo</Text></View>
            }
          </TouchableOpacity>

          {/* Fields */}
          {[
            { label:'Cat name *', key:'name', placeholder:'e.g. Luna, Mochi' },
            { label:'Breed',      key:'breed', placeholder:'e.g. Persian, Siamese' },
          ].map(f => (
            <View key={f.key}>
              <Text style={m.label}>{f.label}</Text>
              <TextInput style={m.input} placeholder={f.placeholder} placeholderTextColor={Colors.textMuted}
                value={String(form[f.key])} onChangeText={v => set(f.key, v)} />
            </View>
          ))}

          <View style={{ flexDirection:'row', gap: Spacing.md }}>
            {[{label:'Age (months)', key:'age_months', placeholder:'24'}, {label:'Weight (kg)', key:'weight_kg', placeholder:'4.2'}].map(f => (
              <View key={f.key} style={{ flex:1 }}>
                <Text style={m.label}>{f.label}</Text>
                <TextInput style={m.input} placeholder={f.placeholder} placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad" value={String(form[f.key])} onChangeText={v => set(f.key, v)} />
              </View>
            ))}
          </View>

          <View>
            <Text style={m.label}>Color / Markings</Text>
            <TextInput style={m.input} placeholder="e.g. White & grey" placeholderTextColor={Colors.textMuted}
              value={form.color} onChangeText={v => set('color', v)} />
          </View>

          {/* Gender toggle */}
          <View>
            <Text style={m.label}>Gender</Text>
            <View style={{ flexDirection:'row', gap: Spacing.sm }}>
              {GENDERS.map(g => (
                <TouchableOpacity key={g} onPress={() => set('gender', g)}
                  style={[m.genderBtn, form.gender===g && m.genderBtnActive]}>
                  <Text style={[m.genderText, form.gender===g && { color: Colors.white }]}>
                    {g === 'male' ? '♂ Male' : '♀ Female'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Neutered */}
          <View style={m.switchRow}>
            <View>
              <Text style={m.switchLabel}>Spayed / Neutered</Text>
              <Text style={m.switchSub}>Has your cat been spayed or neutered?</Text>
            </View>
            <Switch value={form.is_neutered} onValueChange={v => set('is_neutered', v)}
              trackColor={{ false: Colors.border, true: Colors.olive }}
              thumbColor={Colors.white} />
          </View>

          {/* Microchip */}
          <View>
            <Text style={m.label}>Microchip ID</Text>
            <TextInput style={m.input} placeholder="Optional — 15-digit ISO number" placeholderTextColor={Colors.textMuted}
              value={form.microchip_id} onChangeText={v => set('microchip_id', v)} />
          </View>

          {err ? <View style={m.err}><Text style={{ color: Colors.dangerText, fontFamily: FontFamily.bodyMedium }}>{err}</Text></View> : null}

        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

/* ─── Cat card ─────────────────────────────────── */
function CatCard({ cat, onEdit, onDelete }) {
  return (
    <View style={c.card}>
      <View style={c.photoBox}>
        {cat.photo_url
          ? <Image source={{ uri: cat.photo_url }} style={c.photo} />
          : <Text style={{ fontSize: 40 }}>🐱</Text>
        }
      </View>
      <View style={c.info}>
        <View style={{ flexDirection:'row', alignItems:'center', gap: Spacing.xs }}>
          <Text style={c.name}>{cat.name}</Text>
          <Text style={{ color: cat.gender==='female'?'#B85C38':Colors.olive, fontSize: 16, fontWeight:'bold' }}>
            {cat.gender==='female'?'♀':'♂'}
          </Text>
        </View>
        {cat.breed ? <Text style={c.breed}>{cat.breed}</Text> : null}
        <View style={c.pills}>
          {cat.age_months != null && <View style={c.pill}><Text style={c.pillText}>⏱ {fmtAge(cat.age_months)}</Text></View>}
          {cat.weight_kg  != null && <View style={c.pill}><Text style={c.pillText}>⚖ {cat.weight_kg} kg</Text></View>}
          {cat.is_neutered && <View style={c.pill}><Text style={c.pillText}>✂ Neutered</Text></View>}
        </View>
      </View>
      <View style={c.actions}>
        <TouchableOpacity onPress={() => onEdit(cat)} style={c.editBtn}>
          <Ionicons name="pencil-outline" size={16} color={Colors.olive} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(cat)} style={c.deleteBtn}>
          <Ionicons name="trash-outline" size={16} color={Colors.dangerText} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

/* ─── Main screen ───────────────────────────────── */
export default function MyCatsScreen() {
  const { user } = useAuth()
  const [cats,    setCats]    = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState(null)

  async function load() {
    if (!user?.id) { setLoading(false); return }
    const { data } = await supabase.from('cats').select('*').eq('owner_id', user.id).order('registered_at', { ascending: false })
    if (data) setCats(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [user?.id])

  async function handleDelete(cat) {
    Alert.alert('Remove cat', `Remove ${cat.name} from your profile?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await supabase.from('cats').delete().eq('id', cat.id)
        setCats(p => p.filter(c => c.id !== cat.id))
      }},
    ])
  }

  return (
    <View style={{ flex:1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View style={h.header}>
        <View>
          <Text style={h.title}>My Cats</Text>
          <Text style={h.sub}>{loading ? 'Loading…' : `${cats.length} cat${cats.length!==1?'s':''} in your family`}</Text>
        </View>
        <TouchableOpacity style={h.addBtn} onPress={() => { setEditing(null); setModal(true) }}>
          <Ionicons name="add" size={20} color={Colors.white} />
          <Text style={h.addBtnText}>Add Cat</Text>
        </TouchableOpacity>
      </View>

      {loading
        ? <ActivityIndicator style={{ marginTop: 60 }} color={Colors.olive} size="large" />
        : cats.length === 0
          ? (
            <View style={h.empty}>
              <Text style={{ fontSize: 64, marginBottom: Spacing.lg }}>🐱</Text>
              <Text style={h.emptyTitle}>No cats yet</Text>
              <Text style={h.emptySub}>Add your cat's profile to book vet appointments and get AI health advice.</Text>
              <TouchableOpacity style={h.emptyBtn} onPress={() => { setEditing(null); setModal(true) }}>
                <Text style={h.emptyBtnText}>🐾 Add your first cat</Text>
              </TouchableOpacity>
            </View>
          )
          : (
            <FlatList
              data={cats}
              keyExtractor={it => it.id}
              contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing['4xl'] }}
              renderItem={({ item }) => (
                <CatCard cat={item}
                  onEdit={cat => { setEditing(cat); setModal(true) }}
                  onDelete={handleDelete}
                />
              )}
            />
          )
      }

      <CatModal
        visible={modal}
        onClose={() => setModal(false)}
        onSaved={load}
        editing={editing}
      />
    </View>
  )
}

/* StyleSheets */
const h = StyleSheet.create({
  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing['3xl']+Spacing.md, paddingBottom: Spacing.lg, backgroundColor: Colors.surface, borderBottomWidth:1, borderBottomColor: Colors.border },
  title:  { fontFamily: FontFamily.displayBold, fontSize: FontSize.xl, color: Colors.text },
  sub:    { fontFamily: FontFamily.bodyRegular,  fontSize: FontSize.sm, color: Colors.textMuted, marginTop:2 },
  addBtn: { flexDirection:'row', alignItems:'center', gap: Spacing.xs, backgroundColor: Colors.olive, borderRadius: Radius.lg, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, ...Shadow.sm },
  addBtnText: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.sm, color: Colors.white },
  empty:  { flex:1, alignItems:'center', justifyContent:'center', padding: Spacing['2xl'] },
  emptyTitle: { fontFamily: FontFamily.displayBold, fontSize: FontSize.xl, color: Colors.text, marginBottom: Spacing.sm },
  emptySub:   { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.md, color: Colors.textMuted, textAlign:'center', lineHeight:22, marginBottom: Spacing.xl },
  emptyBtn:   { backgroundColor: Colors.olive, borderRadius: Radius.lg, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, ...Shadow.sm },
  emptyBtnText: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.md, color: Colors.white },
})
const c = StyleSheet.create({
  card:    { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, flexDirection:'row', gap: Spacing.md, borderWidth:1, borderColor: Colors.border, ...Shadow.sm },
  photoBox:{ width:72, height:72, borderRadius: Radius.lg, backgroundColor: Colors.oliveBg, alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 },
  photo:   { width:72, height:72 },
  info:    { flex:1, gap:4 },
  name:    { fontFamily: FontFamily.bodyBold, fontSize: FontSize.md, color: Colors.text },
  breed:   { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.sm, color: Colors.olive },
  pills:   { flexDirection:'row', flexWrap:'wrap', gap: Spacing.xs, marginTop: Spacing.xs },
  pill:    { backgroundColor: Colors.oliveBg, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical:2 },
  pillText:{ fontFamily: FontFamily.bodyMedium, fontSize: FontSize.xs, color: Colors.olive },
  actions: { gap: Spacing.sm, justifyContent:'center' },
  editBtn: { width:34, height:34, borderRadius: Radius.md, backgroundColor: Colors.oliveBg, alignItems:'center', justifyContent:'center' },
  deleteBtn:{ width:34, height:34, borderRadius: Radius.md, backgroundColor: Colors.dangerBg, alignItems:'center', justifyContent:'center' },
})
const m = StyleSheet.create({
  header:  { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding: Spacing.lg, borderBottomWidth:1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  headerTitle: { fontFamily: FontFamily.displayBold, fontSize: FontSize.lg, color: Colors.text },
  saveBtn: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.md, color: Colors.olive },
  photoBox:{ width:100, height:100, borderRadius: Radius.xl, alignSelf:'center', overflow:'hidden', borderWidth:2, borderStyle:'dashed', borderColor: Colors.olive },
  photoImg:{ width:100, height:100 },
  photoPlaceholder: { flex:1, alignItems:'center', justifyContent:'center', gap:4, backgroundColor: Colors.oliveBg },
  photoLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.xs, color: Colors.olive },
  label:   { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, color: Colors.textSoft, marginBottom: Spacing.xs },
  input:   { backgroundColor: Colors.bgSoft, borderWidth:1.5, borderColor: Colors.border, borderRadius: Radius.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontFamily: FontFamily.bodyRegular, fontSize: FontSize.md, color: Colors.text },
  genderBtn:      { flex:1, paddingVertical: Spacing.md, borderRadius: Radius.lg, borderWidth:1.5, borderColor: Colors.border, alignItems:'center', backgroundColor: Colors.surface },
  genderBtnActive:{ borderColor: Colors.olive, backgroundColor: Colors.olive },
  genderText:     { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, color: Colors.textMuted },
  switchRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor: Colors.oliveBg, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth:1, borderColor: Colors.oliveBorder },
  switchLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.base, color: Colors.text },
  switchSub:   { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, color: Colors.textMuted, marginTop:2 },
  err: { backgroundColor: Colors.dangerBg, borderRadius: Radius.md, padding: Spacing.md, borderWidth:1, borderColor: Colors.dangerBorder },
})
