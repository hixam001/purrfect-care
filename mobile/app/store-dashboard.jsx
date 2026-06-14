import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, TextInput, Switch, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Colors, FontFamily, FontSize, Spacing, Radius, Shadow } from '../theme/tokens'

// ─────────────────────────────────────────────
// Add / Edit product modal
// ─────────────────────────────────────────────
const EMPTY_FORM = {
  name: '', description: '', price: '', discount_price: '',
  brand: '', stock_quantity: '0', category_name: '',
  image_url: '', is_active: true,
}

function ProductForm({ visible, initial, onSave, onClose, saving }) {
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    setForm(initial ? {
      name:           initial.name ?? '',
      description:    initial.description ?? '',
      price:          String(initial.price ?? ''),
      discount_price: initial.discount_price ? String(initial.discount_price) : '',
      brand:          initial.brand ?? '',
      stock_quantity: String(initial.stock_quantity ?? '0'),
      category_name:  initial.product_categories?.name ?? '',
      image_url:      initial.images?.[0] ?? '',
      is_active:      initial.is_active ?? true,
    } : EMPTY_FORM)
  }, [visible, initial])

  function field(label, key, opts = {}) {
    return (
      <View style={f.field}>
        <Text style={f.label}>{label}{opts.required && <Text style={{ color: Colors.terracotta }}> *</Text>}</Text>
        <TextInput
          style={[f.input, opts.multiline && { height: 72, textAlignVertical: 'top' }]}
          value={form[key]}
          onChangeText={v => setForm(p => ({ ...p, [key]: v }))}
          placeholder={opts.placeholder ?? ''}
          placeholderTextColor={Colors.textMuted}
          keyboardType={opts.numeric ? 'decimal-pad' : 'default'}
          multiline={opts.multiline}
          autoCapitalize={opts.noCapitalize ? 'none' : 'sentences'}
        />
      </View>
    )
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={f.overlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
          <View style={f.sheet}>
            <View style={f.handle} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg }}>
              <Text style={f.title}>{initial ? 'Edit Product' : 'Add Product'}</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
              {field('Product Name', 'name', { required: true, placeholder: 'e.g. Royal Canin Indoor' })}
              {field('Description', 'description', { multiline: true, placeholder: 'Briefly describe the product…' })}
              {field('Price (Rs)', 'price', { required: true, numeric: true, placeholder: '0.00' })}
              {field('Sale Price (Rs)', 'discount_price', { numeric: true, placeholder: 'Leave blank for no discount' })}
              {field('Brand', 'brand', { placeholder: 'e.g. Whiskas' })}
              {field('Category', 'category_name', { placeholder: 'e.g. Food, Toys, Grooming' })}
              {field('Stock Quantity', 'stock_quantity', { required: true, numeric: true, placeholder: '0' })}
              {field('Image URL', 'image_url', { noCapitalize: true, placeholder: 'https://…' })}

              {/* Active toggle */}
              <View style={[f.field, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                <Text style={f.label}>Listed / Active</Text>
                <Switch
                  value={form.is_active}
                  onValueChange={v => setForm(p => ({ ...p, is_active: v }))}
                  trackColor={{ false: Colors.border, true: Colors.olive }}
                  thumbColor={Colors.white}
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[f.saveBtn, saving && { opacity: 0.6 }]}
              onPress={() => onSave(form)}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator color={Colors.white} size="small" />
                : <Text style={f.saveBtnText}>{initial ? 'Save Changes' : 'Add Product'}</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─────────────────────────────────────────────
// Product row
// ─────────────────────────────────────────────
function ProductRow({ item: p, onEdit, onToggleActive, onEditStock }) {
  return (
    <View style={s.row}>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={s.rowName} numberOfLines={1}>{p.name}</Text>
        <Text style={s.rowMeta}>
          Rs {parseFloat(p.price).toLocaleString()}
          {p.discount_price ? ` → Rs ${parseFloat(p.discount_price).toLocaleString()}` : ''}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
          {/* Stock badge */}
          <TouchableOpacity onPress={() => onEditStock(p)} style={[s.stockBadge, p.stock_quantity <= 0 && s.stockBadgeDanger]}>
            <Ionicons name="cube-outline" size={11} color={p.stock_quantity > 0 ? Colors.olive : Colors.dangerText} />
            <Text style={[s.stockText, p.stock_quantity <= 0 && { color: Colors.dangerText }]}>
              {p.stock_quantity} in stock
            </Text>
            <Ionicons name="pencil" size={10} color={p.stock_quantity > 0 ? Colors.olive : Colors.dangerText} />
          </TouchableOpacity>
          {/* Active indicator */}
          <View style={[s.activeDot, !p.is_active && s.activeDotOff]}>
            <Text style={[s.activeText, !p.is_active && { color: Colors.textMuted }]}>
              {p.is_active ? 'Active' : 'Hidden'}
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
        <TouchableOpacity onPress={() => onToggleActive(p)} style={s.iconBtn}>
          <Ionicons
            name={p.is_active ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color={Colors.textMuted}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onEdit(p)} style={s.iconBtn}>
          <Ionicons name="create-outline" size={18} color={Colors.olive} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ─────────────────────────────────────────────
// Stock editor modal
// ─────────────────────────────────────────────
function StockModal({ visible, product, onClose, onSave, saving }) {
  const [qty, setQty] = useState('0')
  useEffect(() => { if (product) setQty(String(product.stock_quantity ?? 0)) }, [product])

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)' }}>
        <View style={sm.box}>
          <Text style={sm.title}>Update Stock</Text>
          <Text style={sm.sub} numberOfLines={1}>{product?.name}</Text>
          <View style={sm.qtyRow}>
            <TouchableOpacity onPress={() => setQty(q => String(Math.max(0, parseInt(q || '0') - 1)))} style={sm.btn}>
              <Ionicons name="remove" size={22} color={Colors.olive} />
            </TouchableOpacity>
            <TextInput
              style={sm.input}
              value={qty}
              onChangeText={v => setQty(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              textAlign="center"
            />
            <TouchableOpacity onPress={() => setQty(q => String(parseInt(q || '0') + 1))} style={sm.btn}>
              <Ionicons name="add" size={22} color={Colors.olive} />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg }}>
            <TouchableOpacity style={sm.cancelBtn} onPress={onClose}>
              <Text style={sm.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[sm.saveBtn, saving && { opacity: 0.6 }]}
              onPress={() => onSave(parseInt(qty || '0'))}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color={Colors.white} size="small" />
                : <Text style={sm.saveBtnText}>Save</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

// ─────────────────────────────────────────────
// Main dashboard
// ─────────────────────────────────────────────
export default function StoreDashboardScreen() {
  const { user }   = useAuth()
  const router     = useRouter()

  const [myStore,   setMyStore]   = useState(null)
  const [products,  setProducts]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [formOpen,  setFormOpen]  = useState(false)
  const [editing,   setEditing]   = useState(null)   // product being edited
  const [saving,    setSaving]    = useState(false)
  const [stockProd, setStockProd] = useState(null)   // product for stock modal
  const [stockSave, setStockSave] = useState(false)

  // Guard — only store_owner
  const isStoreOwner = user?.role === 'store_owner'

  const loadData = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    // 1. Find their store
    const { data: store } = await supabase
      .from('cat_stores')
      .select('id, name, city, is_approved, is_active')
      .eq('owner_user_id', user.id)
      .single()

    if (!store) { setLoading(false); return }
    setMyStore(store)

    // 2. Load their products
    const { data: prods } = await supabase
      .from('products')
      .select('id, name, description, price, discount_price, brand, images, stock_quantity, is_active, product_categories(name)')
      .eq('store_id', store.id)
      .order('name')

    setProducts(prods ?? [])
    setLoading(false)
  }, [user?.id])

  useEffect(() => { loadData() }, [loadData])

  // ── Save product (add or edit)
  async function handleSave(form) {
    if (!form.name.trim() || !form.price) {
      Alert.alert('Required fields', 'Product name and price are required.')
      return
    }
    setSaving(true)
    try {
      // Resolve or create category
      let categoryId = null
      if (form.category_name.trim()) {
        const { data: cat } = await supabase
          .from('product_categories')
          .select('id')
          .ilike('name', form.category_name.trim())
          .maybeSingle()

        if (cat) {
          categoryId = cat.id
        } else {
          const { data: newCat } = await supabase
            .from('product_categories')
            .insert({ name: form.category_name.trim() })
            .select('id')
            .single()
          categoryId = newCat?.id ?? null
        }
      }

      const payload = {
        store_id:       myStore.id,
        name:           form.name.trim(),
        description:    form.description.trim() || null,
        price:          parseFloat(form.price),
        discount_price: form.discount_price ? parseFloat(form.discount_price) : null,
        brand:          form.brand.trim() || null,
        stock_quantity: parseInt(form.stock_quantity || '0'),
        is_active:      form.is_active,
        images:         form.image_url.trim() ? [form.image_url.trim()] : [],
        category_id:    categoryId,
      }

      if (editing) {
        await supabase.from('products').update(payload).eq('id', editing.id)
      } else {
        await supabase.from('products').insert(payload)
      }

      setFormOpen(false)
      setEditing(null)
      await loadData()
    } catch (err) {
      Alert.alert('Error', err.message ?? 'Failed to save product.')
    } finally {
      setSaving(false)
    }
  }

  // ── Toggle active
  async function handleToggleActive(p) {
    await supabase.from('products').update({ is_active: !p.is_active }).eq('id', p.id)
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !x.is_active } : x))
  }

  // ── Save stock
  async function handleStockSave(qty) {
    setStockSave(true)
    await supabase.from('products').update({ stock_quantity: qty }).eq('id', stockProd.id)
    setProducts(prev => prev.map(x => x.id === stockProd.id ? { ...x, stock_quantity: qty } : x))
    setStockSave(false)
    setStockProd(null)
  }

  if (!isStoreOwner) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl }}>
        <Text style={{ fontSize: 48, marginBottom: Spacing.md }}>🔒</Text>
        <Text style={[s.heading, { textAlign: 'center', marginBottom: Spacing.sm }]}>
          Store Owners Only
        </Text>
        <Text style={[s.meta, { textAlign: 'center', marginBottom: Spacing.xl }]}>
          This area is for registered store owners.
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={s.backLink}>
          <Ionicons name="arrow-back" size={16} color={Colors.olive} />
          <Text style={s.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.olive} size="large" />
      </View>
    )
  }

  if (!myStore) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl }}>
        <Text style={{ fontSize: 48, marginBottom: Spacing.md }}>🏪</Text>
        <Text style={[s.heading, { textAlign: 'center' }]}>No store found</Text>
        <Text style={[s.meta, { textAlign: 'center', marginTop: 4 }]}>
          Register your store first to manage products.
        </Text>
      </View>
    )
  }

  const active   = products.filter(p => p.is_active).length
  const outStock = products.filter(p => p.stock_quantity <= 0).length

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.heading}>{myStore.name}</Text>
          <Text style={s.meta}>Store Dashboard</Text>
        </View>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => { setEditing(null); setFormOpen(true) }}
        >
          <Ionicons name="add" size={18} color={Colors.white} />
          <Text style={s.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Stats strip */}
      <View style={s.statsStrip}>
        <View style={s.stat}>
          <Text style={s.statNum}>{products.length}</Text>
          <Text style={s.statLabel}>Products</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.stat}>
          <Text style={s.statNum}>{active}</Text>
          <Text style={s.statLabel}>Active</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.stat}>
          <Text style={[s.statNum, outStock > 0 && { color: Colors.terracotta }]}>{outStock}</Text>
          <Text style={s.statLabel}>Out of Stock</Text>
        </View>
        {!myStore.is_approved && (
          <>
            <View style={s.statDivider} />
            <View style={s.stat}>
              <Ionicons name="time-outline" size={18} color={Colors.amber} />
              <Text style={[s.statLabel, { color: Colors.amber }]}>Pending Approval</Text>
            </View>
          </>
        )}
      </View>

      {/* Product list */}
      <FlatList
        data={products}
        keyExtractor={it => it.id}
        contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing['4xl'] }}
        renderItem={({ item }) => (
          <ProductRow
            item={item}
            onEdit={p => { setEditing(p); setFormOpen(true) }}
            onToggleActive={handleToggleActive}
            onEditStock={p => setStockProd(p)}
          />
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 60, gap: Spacing.md }}>
            <Text style={{ fontSize: 48 }}>📦</Text>
            <Text style={s.meta}>No products yet — tap Add to get started</Text>
          </View>
        }
      />

      {/* Add/Edit form modal */}
      <ProductForm
        visible={formOpen}
        initial={editing}
        onSave={handleSave}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        saving={saving}
      />

      {/* Stock editor modal */}
      <StockModal
        visible={!!stockProd}
        product={stockProd}
        onClose={() => setStockProd(null)}
        onSave={handleStockSave}
        saving={stockSave}
      />
    </View>
  )
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const s = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingTop: Spacing['3xl'] + Spacing.md, paddingBottom: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  heading:     { fontFamily: FontFamily.displayBold, fontSize: FontSize.lg, color: Colors.text },
  meta:        { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, color: Colors.textMuted },
  addBtn:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.olive, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  addBtnText:  { fontFamily: FontFamily.bodyBold, fontSize: FontSize.sm, color: Colors.white },
  statsStrip:  { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: Spacing.md },
  stat:        { flex: 1, alignItems: 'center', gap: 2 },
  statNum:     { fontFamily: FontFamily.displayBold, fontSize: FontSize.lg, color: Colors.text },
  statLabel:   { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, color: Colors.textMuted },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.border },
  row:         { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  rowName:     { fontFamily: FontFamily.bodyBold, fontSize: FontSize.base, color: Colors.text },
  rowMeta:     { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, color: Colors.textMuted },
  stockBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.oliveBg, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderWidth: 1, borderColor: Colors.oliveBorder },
  stockBadgeDanger:{ backgroundColor: Colors.dangerBg, borderColor: Colors.dangerBorder },
  stockText:   { fontFamily: FontFamily.bodySemiBold, fontSize: 10, color: Colors.olive },
  activeDot:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.oliveBg, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  activeDotOff:{ backgroundColor: Colors.bgSoft },
  activeText:  { fontFamily: FontFamily.bodySemiBold, fontSize: 10, color: Colors.olive },
  iconBtn:     { width: 36, height: 36, borderRadius: Radius.md, backgroundColor: Colors.bgSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  backLink:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  backLinkText:{ fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.base, color: Colors.olive },
})

// Add/Edit form styles
const f = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:    { backgroundColor: Colors.surface, borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], padding: Spacing.xl, paddingBottom: Spacing['3xl'] },
  handle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.lg },
  title:    { fontFamily: FontFamily.displayBold, fontSize: FontSize.lg, color: Colors.text },
  field:    { marginBottom: Spacing.md },
  label:    { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, color: Colors.textSoft, marginBottom: Spacing.xs },
  input:    { backgroundColor: Colors.bgSoft, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base, color: Colors.text },
  saveBtn:  { backgroundColor: Colors.olive, borderRadius: Radius.xl, paddingVertical: Spacing.lg, alignItems: 'center', marginTop: Spacing.md },
  saveBtnText: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.md, color: Colors.white },
})

// Stock modal styles
const sm = StyleSheet.create({
  box:       { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, margin: Spacing.xl, alignItems: 'center', ...Shadow.md },
  title:     { fontFamily: FontFamily.displayBold, fontSize: FontSize.lg, color: Colors.text, marginBottom: 4 },
  sub:       { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.xl, textAlign: 'center' },
  qtyRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  btn:       { width: 44, height: 44, borderRadius: Radius.lg, backgroundColor: Colors.oliveBg, alignItems: 'center', justifyContent: 'center' },
  input:     { width: 80, backgroundColor: Colors.bgSoft, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.lg, paddingVertical: Spacing.sm, fontFamily: FontFamily.displayBold, fontSize: FontSize.xl, color: Colors.text },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.xl, paddingVertical: Spacing.md, alignItems: 'center' },
  cancelText:{ fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.base, color: Colors.textMuted },
  saveBtn:   { flex: 1, backgroundColor: Colors.olive, borderRadius: Radius.xl, paddingVertical: Spacing.md, alignItems: 'center' },
  saveBtnText:{ fontFamily: FontFamily.bodyBold, fontSize: FontSize.base, color: Colors.white },
})
