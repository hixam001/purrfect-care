import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Colors, FontFamily, FontSize, Spacing, Radius, Shadow } from '../../theme/tokens'

const TILES = [
  { id:'my-cats',    icon:'🐾', label:'My Cats',        desc:'Manage your cat profiles',      route:'/(tabs)/my-cats'    },
  { id:'hospitals',  icon:'🏥', label:'Hospitals',       desc:'Search nearby hospitals',       route:'/(tabs)/hospitals'  },
  { id:'ai-chat',    icon:'🤖', label:'AI Companion',    desc:'Ask about your cat\'s health',  route:'/(tabs)/ai-chat'    },
  { id:'stores',     icon:'🛍', label:'Cat Stores',      desc:'Food, toys & accessories',      route:'/(tabs)/stores'     },
  { id:'settings',   icon:'⚙',  label:'Settings',        desc:'Your account & preferences',    route:'/settings'          },
]

export default function DashboardScreen() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [cats,       setCats]       = useState([])
  const [refreshing, setRefreshing] = useState(false)

  const firstName = user?.name?.split(' ')[0] ?? 'there'

  async function loadCats() {
    if (!user?.id) return
    const { data } = await supabase
      .from('cats').select('id, name, photo_url, breed')
      .eq('owner_id', user.id).limit(3)
    if (data) setCats(data)
  }

  useEffect(() => { loadCats() }, [user?.id])

  async function onRefresh() {
    setRefreshing(true)
    await loadCats()
    setRefreshing(false)
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerGreeting}>Hello, {firstName} 👋</Text>
          <Text style={s.headerSub}>Welcome to Purrfect Care</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/settings')} style={s.avatarBtn}>
          <Ionicons name="person-circle-outline" size={32} color={Colors.olive} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing['4xl'] }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.olive} />}
      >
        {/* Quick Cats Strip */}
        {cats.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Your cats</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.lg }}>
              <View style={{ flexDirection:'row', gap: Spacing.md, paddingHorizontal: Spacing.lg }}>
                {cats.map(c => (
                  <TouchableOpacity key={c.id} style={s.catChip} onPress={() => router.push('/(tabs)/my-cats')}>
                    <Text style={s.catChipEmoji}>{c.photo_url ? '📸' : '🐱'}</Text>
                    <Text style={s.catChipName}>{c.name}</Text>
                    {c.breed ? <Text style={s.catChipBreed}>{c.breed}</Text> : null}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={[s.catChip, s.catChipAdd]} onPress={() => router.push('/(tabs)/my-cats')}>
                  <Ionicons name="add-circle-outline" size={26} color={Colors.olive} />
                  <Text style={[s.catChipName, { color: Colors.olive }]}>Add cat</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Nav tiles */}
        <Text style={s.sectionTitle}>What would you like to do?</Text>
        <View style={s.tilesGrid}>
          {TILES.map(t => (
            <TouchableOpacity
              key={t.id}
              style={s.tile}
              onPress={() => router.push(t.route)}
              activeOpacity={0.8}
            >
              <View style={s.tileIcon}>
                <Text style={{ fontSize: 26 }}>{t.icon}</Text>
              </View>
              <Text style={s.tileLabel}>{t.label}</Text>
              <Text style={s.tileDesc} numberOfLines={2}>{t.desc}</Text>
              <View style={s.tileArrow}>
                <Ionicons name="chevron-forward" size={14} color={Colors.olive} />
              </View>
            </TouchableOpacity>
          ))}

          {/* Store owner management tile */}
          {user?.role === 'store_owner' && (
            <TouchableOpacity
              style={[s.tile, { borderColor: Colors.oliveBorder, backgroundColor: Colors.oliveBg }]}
              onPress={() => router.push('/store-dashboard')}
              activeOpacity={0.8}
            >
              <View style={[s.tileIcon, { backgroundColor: Colors.olive }]}>
                <Text style={{ fontSize: 26 }}>📦</Text>
              </View>
              <Text style={s.tileLabel}>My Store</Text>
              <Text style={s.tileDesc} numberOfLines={2}>Manage products & stock</Text>
              <View style={s.tileArrow}>
                <Ionicons name="chevron-forward" size={14} color={Colors.olive} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick sign out */}
        <TouchableOpacity onPress={logout} style={s.logoutBtn}>
          <Ionicons name="log-out-outline" size={16} color={Colors.textMuted} />
          <Text style={s.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['3xl'] + Spacing.md,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerGreeting: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.xl,
    color: Colors.text,
  },
  headerSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  avatarBtn: { padding: Spacing.xs },
  section:      { marginBottom: Spacing.xl },
  sectionTitle: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.md, color: Colors.text, marginBottom: Spacing.md },
  catChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    minWidth: 90,
    gap: 4,
    ...Shadow.sm,
  },
  catChipAdd: { borderStyle: 'dashed', borderColor: Colors.olive, backgroundColor: Colors.oliveBg },
  catChipEmoji: { fontSize: 28 },
  catChipName:  { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, color: Colors.text },
  catChipBreed: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, color: Colors.textMuted },
  tilesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xl },
  tile: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  tileIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: Colors.oliveBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  tileLabel: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.base, color: Colors.text, marginBottom: 2 },
  tileDesc:  { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 16 },
  tileArrow: { position: 'absolute', top: Spacing.md, right: Spacing.md },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.lg,
  },
  logoutText: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.base, color: Colors.textMuted },
})
