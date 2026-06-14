import { useState, useRef, useEffect } from 'react'
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { API_URL } from '../../lib/supabase'
import { supabase } from '../../lib/supabase'
import { Colors, FontFamily, FontSize, Spacing, Radius, Shadow } from '../../theme/tokens'

const SUGGESTIONS = [
  'My cat is sneezing a lot — should I be worried?',
  'How often should I deworm my cat?',
  'What are signs of kidney disease in cats?',
  'Is it safe to give my cat human painkillers?',
]

function Bubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <View style={[b.wrap, isUser ? b.wrapUser : b.wrapVet]}>
      {!isUser && <View style={b.avatar}><Text style={{ fontSize: 16 }}>🐾</Text></View>}
      <View style={[b.bubble, isUser ? b.bubbleUser : b.bubbleVet]}>
        <Text style={[b.text, isUser ? b.textUser : b.textVet]}>{msg.content}</Text>
      </View>
    </View>
  )
}

export default function AiChatScreen() {
  const { user } = useAuth()
  const flatListRef = useRef(null)
  const [messages, setMessages] = useState([
    { role:'assistant', content:`Hello! I'm your AI cat health companion. Ask me anything about your cat's health, symptoms, nutrition, or behaviour.` },
  ])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [catCtx,  setCatCtx]  = useState(null) // user's cats for context

  useEffect(() => {
    if (!user?.id) return
    supabase.from('cats').select('name, breed, age_months, is_neutered, weight_kg').eq('owner_id', user.id).limit(3)
      .then(({ data }) => { if (data?.length) setCatCtx(data) })
  }, [user?.id])

  async function send(text) {
    const q = (text ?? input).trim()
    if (!q || loading) return
    setInput('')

    const userMsg = { role:'user', content: q }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          messages: updated.map(m => ({ role: m.role, content: m.content })),
          cat_context: catCtx,
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role:'assistant', content: data.response ?? 'Sorry, I couldn\'t get a response. Please try again.' }])
    } catch {
      setMessages(prev => [...prev, { role:'assistant', content:'Network error. Please check your connection and try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex:1, backgroundColor: Colors.bg }}
      behavior={Platform.OS==='ios'?'padding':'height'}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={s.header}>
        <View style={s.aiAvatar}><Text style={{ fontSize: 22 }}>🐾</Text></View>
        <View>
          <Text style={s.title}>AI Companion</Text>
          <Text style={s.sub}>Powered by Gemini · Vet-backed knowledge</Text>
        </View>
      </View>

      {/* Chat */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => <Bubble msg={item} />}
        contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.md }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={loading ? (
          <View style={s.typingWrap}>
            <View style={s.typingBubble}>
              <ActivityIndicator size="small" color={Colors.olive} />
              <Text style={s.typingText}>AI is thinking…</Text>
            </View>
          </View>
        ) : messages.length <= 1 ? (
          <View style={{ gap: Spacing.sm, marginTop: Spacing.lg }}>
            <Text style={s.suggTitle}>Try asking:</Text>
            {SUGGESTIONS.map(sg => (
              <TouchableOpacity key={sg} style={s.suggBtn} onPress={() => send(sg)}>
                <Text style={s.suggText}>{sg}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      />

      {/* Input */}
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          placeholder="Ask about your cat's health…"
          placeholderTextColor={Colors.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={() => send()}
        />
        <TouchableOpacity
          style={[s.sendBtn, (!input.trim() || loading) && s.sendDisabled]}
          onPress={() => send()}
          disabled={!input.trim() || loading}
        >
          <Text style={{ fontSize: 20 }}>🐾</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const b = StyleSheet.create({
  wrap:      { flexDirection:'row', alignItems:'flex-end', gap: Spacing.sm },
  wrapUser:  { justifyContent:'flex-end' },
  wrapVet:   { justifyContent:'flex-start' },
  avatar:    { width:32, height:32, borderRadius:16, backgroundColor: Colors.oliveBg, alignItems:'center', justifyContent:'center', flexShrink:0 },
  bubble:    { maxWidth:'80%', padding: Spacing.md, borderRadius: Radius.lg },
  bubbleVet: { backgroundColor: Colors.surface, borderWidth:1, borderColor: Colors.border, borderBottomLeftRadius:4 },
  bubbleUser:{ backgroundColor: Colors.olive, borderBottomRightRadius:4 },
  text:      { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base, lineHeight:22 },
  textVet:   { color: Colors.text },
  textUser:  { color: Colors.white },
})
const s = StyleSheet.create({
  header:     { flexDirection:'row', alignItems:'center', gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingTop: Spacing['3xl']+Spacing.md, paddingBottom: Spacing.lg, backgroundColor: Colors.surface, borderBottomWidth:1, borderBottomColor: Colors.border },
  aiAvatar:   { width:44, height:44, borderRadius: Radius.xl, backgroundColor: Colors.olive, alignItems:'center', justifyContent:'center' },
  title:      { fontFamily: FontFamily.displayBold, fontSize: FontSize.lg, color: Colors.text },
  sub:        { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, color: Colors.textMuted, marginTop:2 },
  typingWrap: { flexDirection:'row', alignItems:'flex-end', gap: Spacing.sm },
  typingBubble: { flexDirection:'row', alignItems:'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderWidth:1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md },
  typingText: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, color: Colors.textMuted },
  suggTitle:  { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, color: Colors.textMuted },
  suggBtn:    { backgroundColor: Colors.surface, borderWidth:1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.sm },
  suggText:   { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, color: Colors.text },
  inputRow:   { flexDirection:'row', alignItems:'flex-end', gap: Spacing.sm, padding: Spacing.md, paddingBottom: Spacing.xl, backgroundColor: Colors.surface, borderTopWidth:1, borderTopColor: Colors.border },
  input:      { flex:1, backgroundColor: Colors.bgSoft, borderWidth:1.5, borderColor: Colors.border, borderRadius: Radius.xl, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontFamily: FontFamily.bodyRegular, fontSize: FontSize.md, color: Colors.text, maxHeight:100 },
  sendBtn:    { width:46, height:46, borderRadius:23, backgroundColor: Colors.olive, alignItems:'center', justifyContent:'center', ...Shadow.sm },
  sendDisabled: { opacity: 0.4 },
})
