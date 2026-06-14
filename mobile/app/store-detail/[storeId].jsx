import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, TextInput, Modal, ScrollView,
  Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Colors, FontFamily, FontSize, Spacing, Radius, Shadow } from '../../theme/tokens'

// ─────────────────────────────────────────────
// Product card
// ─────────────────────────────────────────────
function ProductCard({ item: p, qty, onAdd, onRemove }) {
  const img      = p.images?.[0]
  const price    = parseFloat(p.discount_price ?? p.price)
  const original = p.discount_price ? parseFloat(p.price) : null
  const inStock  = p.stock_quantity > 0

  return (
    <View style={s.card}>
      <View style={s.imageBox}>
        {img
          ? <Image source={{ uri: img }} style={s.image} resizeMode="cover" />
          : <Text style={{ fontSize: 40 }}>🐾</Text>
        }
        {p.discount_price && (
          <View style={s.saleBadge}>
            <Text style={s.saleBadgeText}>SALE</Text>
          </View>
        )}
      </View>

      <View style={{ padding: Spacing.sm, gap: 3 }}>
        <Text style={s.prodName} numberOfLines={2}>{p.name}</Text>
        {p.brand && <Text style={s.brand}>{p.brand}</Text>}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <Text style={s.price}>Rs {price.toLocaleString()}</Text>
          {original && (
            <Text style={s.originalPrice}>Rs {original.toLocaleString()}</Text>
          )}
        </View>

        {!inStock ? (
          <View style={s.outStock}><Text style={s.outStockText}>Out of stock</Text></View>
        ) : qty > 0 ? (
          <View style={s.qtyRow}>
            <TouchableOpacity onPress={onRemove} style={s.qtyBtn}>
              <Ionicons name="remove" size={16} color={Colors.olive} />
            </TouchableOpacity>
            <Text style={s.qtyText}>{qty}</Text>
            <TouchableOpacity
              onPress={onAdd}
              style={s.qtyBtn}
              disabled={qty >= p.stock_quantity}
            >
              <Ionicons name="add" size={16} color={Colors.olive} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={s.addBtn} onPress={onAdd} activeOpacity={0.85}>
            <Ionicons name="add" size={14} color={Colors.white} />
            <Text style={s.addBtnText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

// ─────────────────────────────────────────────
// Cart bottom sheet
// ─────────────────────────────────────────────
function CartSheet({ visible, cart, store, onClose, onRemove, onAdd, onPlaceOrder, placing }) {
  const total = cart.reduce((sum, x) => sum + (parseFloat(x.discount_price ?? x.price)) * x.qty, 0)
  const fee   = parseFloat(store?.delivery_fee ?? 0)

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={cs.overlay}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
        <View style={cs.sheet}>
          {/* Handle */}
          <View style={cs.handle} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg }}>
            <Text style={cs.sheetTitle}>Your Cart</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 280 }}>
            {cart.map(item => {
              const linePrice = parseFloat(item.discount_price ?? item.price) * item.qty
              return (
                <View key={item.id} style={cs.cartRow}>
                  <Text style={cs.cartName} numberOfLines={1}>{item.name}</Text>
                  <View style={cs.qtyRowSmall}>
                    <TouchableOpacity onPress={() => onRemove(item)} style={cs.qtyBtnSm}>
                      <Ionicons name="remove" size={14} color={Colors.olive} />
                    </TouchableOpacity>
                    <Text style={cs.qtyNumSm}>{item.qty}</Text>
                    <TouchableOpacity onPress={() => onAdd(item)} style={cs.qtyBtnSm}>
                      <Ionicons name="add" size={14} color={Colors.olive} />
                    </TouchableOpacity>
                  </View>
                  <Text style={cs.cartPrice}>Rs {linePrice.toLocaleString()}</Text>
                </View>
              )
            })}
          </ScrollView>

          <View style={cs.divider} />

          <View style={cs.summaryRow}>
            <Text style={cs.summaryLabel}>Subtotal</Text>
            <Text style={cs.summaryVal}>Rs {total.toLocaleString()}</Text>
          </View>
          <View style={cs.summaryRow}>
            <Text style={cs.summaryLabel}>Delivery</Text>
            <Text style={[cs.summaryVal, fee === 0 && { color: Colors.olive }]}>
              {fee === 0 ? 'Free' : `Rs ${fee.toFixed(0)}`}
            </Text>
          </View>
          <View style={[cs.summaryRow, { marginTop: Spacing.xs }]}>
            <Text style={[cs.summaryLabel, { fontFamily: FontFamily.bodyBold, fontSize: FontSize.md }]}>Total</Text>
            <Text style={[cs.summaryVal, { fontFamily: FontFamily.bodyBold, fontSize: FontSize.md, color: Colors.text }]}>
              Rs {(total + fee).toLocaleString()}
            </Text>
          </View>

          <TouchableOpacity
            style={[cs.placeBtn, placing && { opacity: 0.6 }]}
            onPress={onPlaceOrder}
            disabled={placing}
            activeOpacity={0.85}
          >
            {placing
              ? <ActivityIndicator color={Colors.white} size="small" />
              : <>
                  <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
                  <Text style={cs.placeBtnText}>Place Order</Text>
                </>
            }
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

// ─────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────
export default function StoreDetailScreen() {
  const { storeId } = useLocalSearchParams()
  const router      = useRouter()
  const { user }    = useAuth()

  const [store,     setStore]     = useState(null)
  const [products,  setProducts]  = useState([])
  const [categories,setCategories]= useState(['All'])
  const [catFilter, setCatFilter] = useState('All')
  const [query,     setQuery]     = useState('')
  const [loading,   setLoading]   = useState(true)
  const [cart,      setCart]      = useState([])   // [{...product, qty}]
  const [cartOpen,  setCartOpen]  = useState(false)
  const [placing,   setPlacing]   = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: s }, { data: p }] = await Promise.all([
        supabase.from('cat_stores').select('*').eq('id', storeId).single(),
        supabase.from('products')
          .select('id, name, description, price, discount_price, images, stock_quantity, brand, unit, rating, total_reviews, is_active, product_categories(name)')
          .eq('store_id', storeId)
          .eq('is_active', true),
      ])
      setStore(s)
      const prods = p ?? []
      setProducts(prods)
      const cats = ['All', ...new Set(prods.map(x => x.product_categories?.name).filter(Boolean))]
      setCategories(cats)
      setLoading(false)
    }
    load()
  }, [storeId])

  // ── Cart helpers
  const addToCart = useCallback((p) => {
    setCart(c => {
      const ex = c.find(x => x.id === p.id)
      if (ex) return c.map(x => x.id === p.id ? { ...x, qty: x.qty + 1 } : x)
      return [...c, { ...p, qty: 1 }]
    })
  }, [])

  const removeFromCart = useCallback((p) => {
    setCart(c => {
      const ex = c.find(x => x.id === p.id)
      if (!ex) return c
      if (ex.qty <= 1) return c.filter(x => x.id !== p.id)
      return c.map(x => x.id === p.id ? { ...x, qty: x.qty - 1 } : x)
    })
  }, [])

  const cartQty = useCallback((id) => cart.find(x => x.id === id)?.qty ?? 0, [cart])
  const totalItems = cart.reduce((s, x) => s + x.qty, 0)

  // ── Place order
  async function handlePlaceOrder() {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in to place an order.')
      return
    }
    if (cart.length === 0) return
    setPlacing(true)
    try {
      const subtotal    = cart.reduce((s, x) => s + parseFloat(x.discount_price ?? x.price) * x.qty, 0)
      const deliveryFee = parseFloat(store?.delivery_fee ?? 0)
      const total       = subtotal + deliveryFee

      // 1. Insert order
      const { data: order, error: oErr } = await supabase
        .from('orders')
        .insert({
          user_id:          user.id,
          store_id:         storeId,
          subtotal:         subtotal.toFixed(2),
          delivery_fee:     deliveryFee.toFixed(2),
          total:            total.toFixed(2),
          status:           'pending',
          delivery_address: user.address ?? user.city ?? 'Address pending',
        })
        .select('id')
        .single()

      if (oErr) throw oErr

      // 2. Insert order items
      const items = cart.map(x => ({
        order_id:   order.id,
        product_id: x.id,
        quantity:   x.qty,
        unit_price: parseFloat(x.discount_price ?? x.price),
        total_price:(parseFloat(x.discount_price ?? x.price) * x.qty),
      }))
      const { error: iErr } = await supabase.from('order_items').insert(items)
      if (iErr) throw iErr

      // 3. Clear cart and show success
      setCart([])
      setCartOpen(false)
      Alert.alert(
        '✅ Order Placed!',
        `Your order from ${store?.name ?? 'the store'} has been placed.\n\nOrder #${order.id.slice(0, 8).toUpperCase()}`,
        [{ text: 'Great!', style: 'default' }],
      )
    } catch (err) {
      Alert.alert('Order failed', err.message ?? 'Something went wrong. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  // ── Filtered products
  const filtered = products.filter(p => {
    const q = query.toLowerCase()
    const matchSearch = p.name?.toLowerCase().includes(q)
    const matchCat    = catFilter === 'All' || p.product_categories?.name === catFilter
    return matchSearch && matchCat
  })

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.olive} size="large" />
      </View>
    )
  }

  if (!store) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg }}>
        <Text style={{ fontSize: 48, marginBottom: Spacing.md }}>🏪</Text>
        <Text style={[s.storeTitle, { textAlign: 'center' }]}>Store not found</Text>
        <TouchableOpacity style={s.cartFab} onPress={() => router.back()}>
          <Text style={{ color: Colors.white, fontFamily: FontFamily.bodyBold }}>← Back</Text>
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
        <Text style={s.topTitle} numberOfLines={1}>{store.name}</Text>
        {/* Cart button */}
        <TouchableOpacity onPress={() => totalItems > 0 && setCartOpen(true)} style={s.cartTopBtn}>
          <Ionicons name="cart-outline" size={24} color={totalItems > 0 ? Colors.olive : Colors.textMuted} />
          {totalItems > 0 && (
            <View style={s.cartBadge}>
              <Text style={s.cartBadgeText}>{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Store info strip */}
      <View style={s.storeStrip}>
        <View style={s.storeIconBox}>
          <Text style={{ fontSize: 26 }}>🏪</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={s.storeTitle}>{store.name}</Text>
          {store.city && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
              <Text style={s.storeMeta} numberOfLines={1}>
                {[store.city, store.address].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}
          {store.delivery_fee != null && (
            <Text style={s.storeMeta}>
              {parseFloat(store.delivery_fee) === 0
                ? '🚴 Free delivery'
                : `🚴 Rs ${parseFloat(store.delivery_fee).toFixed(0)} delivery`}
            </Text>
          )}
        </View>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
        <TextInput
          style={s.search}
          placeholder="Search products…"
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category filter */}
      {categories.length > 1 && (
        <FlatList
          horizontal
          data={categories}
          keyExtractor={it => it}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.sm, paddingVertical: Spacing.xs }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setCatFilter(item)}
              style={[s.catBtn, catFilter === item && s.catBtnActive]}
            >
              <Text style={[s.catText, catFilter === item && s.catTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Products grid */}
      <FlatList
        data={filtered}
        keyExtractor={it => it.id}
        numColumns={2}
        columnWrapperStyle={{ gap: Spacing.md }}
        contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing['4xl'] + 80 }}
        renderItem={({ item }) => (
          <ProductCard
            item={item}
            qty={cartQty(item.id)}
            onAdd={() => addToCart(item)}
            onRemove={() => removeFromCart(item)}
          />
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: Spacing.md }}>🛍</Text>
            <Text style={{ fontFamily: FontFamily.bodyMedium, fontSize: FontSize.md, color: Colors.textMuted }}>
              {query ? `No products match "${query}"` : 'No products in this store yet'}
            </Text>
          </View>
        }
      />

      {/* Floating cart FAB */}
      {totalItems > 0 && (
        <TouchableOpacity style={s.cartFab} onPress={() => setCartOpen(true)} activeOpacity={0.9}>
          <Ionicons name="cart" size={20} color={Colors.white} />
          <Text style={s.cartFabText}>{totalItems} item{totalItems !== 1 ? 's' : ''} · View Cart</Text>
        </TouchableOpacity>
      )}

      {/* Cart sheet */}
      <CartSheet
        visible={cartOpen}
        cart={cart}
        store={store}
        onClose={() => setCartOpen(false)}
        onAdd={addToCart}
        onRemove={removeFromCart}
        onPlaceOrder={handlePlaceOrder}
        placing={placing}
      />
    </View>
  )
}

// ─────────────────────────────────────────────
// Styles — product screen
// ─────────────────────────────────────────────
const s = StyleSheet.create({
  topBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingTop: Spacing['3xl'] + Spacing.md, paddingBottom: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topTitle:     { flex: 1, fontFamily: FontFamily.bodyBold, fontSize: FontSize.md, color: Colors.text, textAlign: 'center' },
  cartTopBtn:   { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cartBadge:    { position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.terracotta, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText:{ fontFamily: FontFamily.bodyBold, fontSize: 9, color: Colors.white },
  storeStrip:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  storeIconBox: { width: 48, height: 48, borderRadius: Radius.lg, backgroundColor: Colors.amberBg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  storeTitle:   { fontFamily: FontFamily.bodyBold, fontSize: FontSize.md, color: Colors.text },
  storeMeta:    { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, color: Colors.textMuted },
  searchWrap:   { flexDirection: 'row', alignItems: 'center', margin: Spacing.lg, marginBottom: Spacing.sm, gap: Spacing.sm, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.xl, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  search:       { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base, color: Colors.text, paddingVertical: Spacing.xs },
  catBtn:       { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  catBtnActive: { backgroundColor: Colors.olive, borderColor: Colors.olive },
  catText:      { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, color: Colors.textMuted },
  catTextActive:{ color: Colors.white },
  card:         { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  imageBox:     { width: '100%', height: 130, backgroundColor: Colors.bgSoft, alignItems: 'center', justifyContent: 'center' },
  image:        { width: '100%', height: 130 },
  saleBadge:    { position: 'absolute', top: Spacing.xs, left: Spacing.xs, backgroundColor: Colors.terracotta, borderRadius: Radius.full, paddingHorizontal: Spacing.xs, paddingVertical: 2 },
  saleBadgeText:{ fontFamily: FontFamily.bodySemiBold, fontSize: 9, color: Colors.white },
  prodName:     { fontFamily: FontFamily.bodyBold, fontSize: FontSize.sm, color: Colors.text, lineHeight: 18 },
  brand:        { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, color: Colors.textMuted },
  price:        { fontFamily: FontFamily.bodyBold, fontSize: FontSize.base, color: Colors.olive },
  originalPrice:{ fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, color: Colors.textMuted, textDecorationLine: 'line-through' },
  qtyRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.oliveBg, borderRadius: Radius.md, paddingVertical: 4, paddingHorizontal: Spacing.xs, marginTop: 4 },
  qtyBtn:       { width: 26, height: 26, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.sm, backgroundColor: Colors.surface },
  qtyText:      { fontFamily: FontFamily.bodyBold, fontSize: FontSize.base, color: Colors.olive },
  outStock:     { backgroundColor: Colors.dangerBg, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2, marginTop: 4 },
  outStockText: { fontFamily: FontFamily.bodySemiBold, fontSize: 9, color: Colors.dangerText },
  addBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: Colors.olive, borderRadius: Radius.md, paddingVertical: 6, marginTop: 4 },
  addBtnText:   { fontFamily: FontFamily.bodyBold, fontSize: FontSize.sm, color: Colors.white },
  cartFab:      { position: 'absolute', bottom: Spacing['2xl'], left: Spacing.xl, right: Spacing.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.olive, borderRadius: Radius.full, paddingVertical: Spacing.md, ...Shadow.md },
  cartFabText:  { fontFamily: FontFamily.bodyBold, fontSize: FontSize.base, color: Colors.white },
})

// ─────────────────────────────────────────────
// Styles — cart sheet
// ─────────────────────────────────────────────
const cs = StyleSheet.create({
  overlay:     { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:       { backgroundColor: Colors.surface, borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], padding: Spacing.xl, paddingBottom: Spacing['3xl'] },
  handle:      { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.lg },
  sheetTitle:  { fontFamily: FontFamily.displayBold, fontSize: FontSize.lg, color: Colors.text },
  cartRow:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  cartName:    { flex: 1, fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, color: Colors.text },
  qtyRowSmall: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  qtyBtnSm:    { width: 24, height: 24, borderRadius: Radius.sm, backgroundColor: Colors.oliveBg, alignItems: 'center', justifyContent: 'center' },
  qtyNumSm:    { fontFamily: FontFamily.bodyBold, fontSize: FontSize.sm, color: Colors.olive, minWidth: 20, textAlign: 'center' },
  cartPrice:   { fontFamily: FontFamily.bodyBold, fontSize: FontSize.sm, color: Colors.text, minWidth: 70, textAlign: 'right' },
  divider:     { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  summaryRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 3 },
  summaryLabel:{ fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base, color: Colors.textMuted },
  summaryVal:  { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.base, color: Colors.text },
  placeBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.olive, borderRadius: Radius.xl, paddingVertical: Spacing.lg, marginTop: Spacing.lg },
  placeBtnText:{ fontFamily: FontFamily.bodyBold, fontSize: FontSize.md, color: Colors.white },
})
