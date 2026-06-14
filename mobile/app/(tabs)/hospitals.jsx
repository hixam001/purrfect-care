import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { Colors, FontFamily, FontSize, Spacing, Radius, Shadow } from '../../theme/tokens'

function StarRow({ rating, total }) {
  const r = parseFloat(rating) || 0
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <Ionicons name="star" size={11} color={Colors.amber} />
      <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.xs, color: Colors.amber }}>
        {r.toFixed(1)}
      </Text>
      {total > 0 && (
        <Text style={{ fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, color: Colors.textMuted }}>
          ({total})
        </Text>
      )}
    </View>
  )
}

export default function HospitalsScreen() {
  const router = useRouter()
  const [query,     setQuery]     = useState('')
  const [hospitals, setHospitals] = useState([])
  const [loading,   setLoading]   = useState(true)

  const load = useCallback(async (q = '') => {
    setLoading(true)
    let req = supabase
      .from('hospitals')
      .select('id, name, city, address, phone, rating, total_reviews, is_active, is_approved')
      .eq('is_active',   true)
      .eq('is_approved', true)
    if (q) req = req.ilike('name', `%${q}%`)
    const { data } = await req.order('name')
    if (data) setHospitals(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function handleSearch(text) {
    setQuery(text)
    const t = setTimeout(() => load(text.trim()), 350)
    return () => clearTimeout(t)
  }

  function renderItem({ item: h }) {
    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => router.push(`/hospital/${h.id}`)}
        activeOpacity={0.85}
      >
        <View style={s.iconBox}>
          <Text style={{ fontSize: 26 }}>🏥</Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={s.name} numberOfLines={1}>{h.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
            <Text style={s.city} numberOfLines={1}>
              {[h.city, h.address].filter(Boolean).join(', ')}
            </Text>
          </View>
          {h.phone && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="call-outline" size={12} color={Colors.textMuted} />
              <Text style={s.city}>{h.phone}</Text>
            </View>
          )}
          {(h.rating > 0 || h.total_reviews > 0) && (
            <StarRow rating={h.rating} total={h.total_reviews} />
          )}
        </View>
        <View style={s.approvedBadge}>
          <Text style={s.approvedText}>✓ Approved</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.border} />
      </TouchableOpacity>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Hospitals</Text>
        <Text style={s.sub}>Find approved veterinary clinics near you</Text>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={{ flexShrink: 0 }} />
        <TextInput
          style={s.search}
          placeholder="Search clinic name or city…"
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={handleSearch}
          autoCorrect={false}
        />
        {query ? (
          <TouchableOpacity onPress={() => { setQuery(''); load('') }}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={Colors.olive} size="large" />
      ) : (
        <FlatList
          data={hospitals}
          keyExtractor={it => it.id}
          contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing['4xl'] }}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 48, marginBottom: Spacing.md }}>🏥</Text>
              <Text style={s.emptyText}>
                No hospitals found{query ? ` for "${query}"` : ''}
              </Text>
              <Text style={[s.emptyText, { fontSize: FontSize.sm, marginTop: 4 }]}>
                Check back after admin approval
              </Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  header:       { paddingHorizontal: Spacing.lg, paddingTop: Spacing['3xl'] + Spacing.md, paddingBottom: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:        { fontFamily: FontFamily.displayBold, fontSize: FontSize.xl, color: Colors.text },
  sub:          { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  searchWrap:   { flexDirection: 'row', alignItems: 'center', margin: Spacing.lg, gap: Spacing.sm, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.xl, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  search:       { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: FontSize.md, color: Colors.text, paddingVertical: Spacing.sm },
  card:         { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  iconBox:      { width: 48, height: 48, borderRadius: Radius.lg, backgroundColor: 'rgba(59,130,246,.09)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  name:         { fontFamily: FontFamily.bodyBold, fontSize: FontSize.md, color: Colors.text },
  city:         { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, color: Colors.textMuted, flexShrink: 1 },
  approvedBadge:{ backgroundColor: Colors.oliveBg, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderWidth: 1, borderColor: Colors.oliveBorder },
  approvedText: { fontFamily: FontFamily.bodySemiBold, fontSize: 10, color: Colors.olive },
  empty:        { alignItems: 'center', marginTop: 60 },
  emptyText:    { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.md, color: Colors.textMuted },
})
