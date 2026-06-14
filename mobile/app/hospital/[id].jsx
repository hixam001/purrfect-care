import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { Colors, FontFamily, FontSize, Spacing, Radius, Shadow } from '../../theme/tokens'

function ServicePill({ svc }) {
  return (
    <View style={s.pill}>
      <Text style={s.pillText}>{svc.name}</Text>
      {svc.price != null && (
        <Text style={s.pillPrice}>Rs {parseFloat(svc.price).toLocaleString()}</Text>
      )}
    </View>
  )
}

function VetCard({ vet }) {
  const name = vet.users?.name ?? vet.user_profiles?.name ?? 'Veterinarian'
  return (
    <View style={s.vetCard}>
      <View style={s.vetAvatar}>
        <Text style={{ fontSize: 22 }}>👨‍⚕️</Text>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={s.vetName}>{name}</Text>
        {vet.specialization && (
          <Text style={s.vetSpec}>{vet.specialization}</Text>
        )}
        {vet.experience_years > 0 && (
          <Text style={s.vetSpec}>{vet.experience_years} yrs experience</Text>
        )}
        {vet.rating > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="star" size={11} color={Colors.amber} />
            <Text style={[s.vetSpec, { color: Colors.amber }]}>
              {parseFloat(vet.rating).toFixed(1)}
            </Text>
            {vet.total_reviews > 0 && (
              <Text style={s.vetSpec}>({vet.total_reviews} reviews)</Text>
            )}
          </View>
        )}
      </View>
      {vet.is_verified && (
        <View style={s.verifiedBadge}>
          <Text style={s.verifiedText}>✓ Verified</Text>
        </View>
      )}
    </View>
  )
}

export default function HospitalDetailScreen() {
  const { id } = useLocalSearchParams()
  const router  = useRouter()
  const [hospital, setHospital] = useState(null)
  const [vets,     setVets]     = useState([])
  const [services, setServices] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: h }, { data: v }, { data: svc }] = await Promise.all([
        supabase.from('hospitals').select('*').eq('id', id).single(),
        supabase.from('vets')
          .select('id, specialization, experience_years, bio, is_verified, rating, total_reviews, users(name)')
          .eq('hospital_id', id)
          .eq('is_verified', true),
        supabase.from('hospital_services')
          .select('id, name, price, duration_minutes, category')
          .eq('hospital_id', id)
          .eq('is_active', true),
      ])
      setHospital(h)
      setVets(v ?? [])
      setServices(svc ?? [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.olive} size="large" />
      </View>
    )
  }

  if (!hospital) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg }}>
        <Text style={{ fontSize: 48, marginBottom: Spacing.md }}>🏥</Text>
        <Text style={[s.heading, { textAlign: 'center' }]}>Hospital not found</Text>
        <TouchableOpacity style={s.bookBtn} onPress={() => router.back()}>
          <Text style={s.bookBtnText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.topTitle} numberOfLines={1}>{hospital.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: Spacing['4xl'] + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hospital hero */}
        <View style={s.hero}>
          <View style={s.heroIcon}>
            <Text style={{ fontSize: 44 }}>🏥</Text>
          </View>
          <Text style={s.heading}>{hospital.name}</Text>
          {hospital.city && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
              <Text style={s.meta}>{[hospital.city, hospital.address].filter(Boolean).join(', ')}</Text>
            </View>
          )}
          {hospital.phone && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Ionicons name="call-outline" size={14} color={Colors.textMuted} />
              <Text style={s.meta}>{hospital.phone}</Text>
            </View>
          )}
          {hospital.rating > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
              <Ionicons name="star" size={14} color={Colors.amber} />
              <Text style={[s.meta, { color: Colors.amber, fontFamily: FontFamily.bodySemiBold }]}>
                {parseFloat(hospital.rating).toFixed(1)}
              </Text>
              {hospital.total_reviews > 0 && (
                <Text style={s.meta}>({hospital.total_reviews} reviews)</Text>
              )}
            </View>
          )}
        </View>

        {/* Description */}
        {hospital.description && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>About</Text>
            <Text style={s.desc}>{hospital.description}</Text>
          </View>
        )}

        {/* Services */}
        {services.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Services</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
              {services.map(svc => <ServicePill key={svc.id} svc={svc} />)}
            </View>
          </View>
        )}

        {/* Vets */}
        {vets.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Our Veterinarians</Text>
            <View style={{ gap: Spacing.sm }}>
              {vets.map(v => <VetCard key={v.id} vet={v} />)}
            </View>
          </View>
        )}

        {/* Book CTA */}
        <View style={{ paddingHorizontal: Spacing.lg, marginTop: Spacing.md }}>
          <TouchableOpacity style={s.bookBtn} activeOpacity={0.85}
            onPress={() => router.push(`/book/${id}`)}>
            <Ionicons name="calendar-outline" size={18} color={Colors.white} />
            <Text style={s.bookBtnText}>Book an Appointment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  topBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingTop: Spacing['3xl'] + Spacing.md, paddingBottom: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topTitle:     { flex: 1, fontFamily: FontFamily.bodyBold, fontSize: FontSize.md, color: Colors.text, textAlign: 'center' },
  hero:         { alignItems: 'center', padding: Spacing.xl, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  heroIcon:     { width: 80, height: 80, borderRadius: Radius.xl, backgroundColor: 'rgba(59,130,246,.08)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  heading:      { fontFamily: FontFamily.displayBold, fontSize: FontSize.xl, color: Colors.text, textAlign: 'center' },
  meta:         { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, color: Colors.textMuted },
  section:      { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl },
  sectionTitle: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.md, color: Colors.text, marginBottom: Spacing.md },
  desc:         { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base, color: Colors.textSoft, lineHeight: 22 },
  pill:         { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, ...Shadow.sm },
  pillText:     { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, color: Colors.text },
  pillPrice:    { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, color: Colors.olive },
  vetCard:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  vetAvatar:    { width: 44, height: 44, borderRadius: Radius.full, backgroundColor: Colors.oliveBg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  vetName:      { fontFamily: FontFamily.bodyBold, fontSize: FontSize.base, color: Colors.text },
  vetSpec:      { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, color: Colors.textMuted },
  verifiedBadge:{ backgroundColor: Colors.oliveBg, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderWidth: 1, borderColor: Colors.oliveBorder },
  verifiedText: { fontFamily: FontFamily.bodySemiBold, fontSize: 10, color: Colors.olive },
  bookBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.olive, borderRadius: Radius.xl, paddingVertical: Spacing.lg },
  bookBtnText:  { fontFamily: FontFamily.bodyBold, fontSize: FontSize.md, color: Colors.white },
})
