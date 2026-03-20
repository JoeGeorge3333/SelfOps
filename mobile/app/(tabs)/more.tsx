import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { supabase } from '../../lib/supabase'
import { Colors } from '../../constants/Colors'
import { Ionicons } from '@expo/vector-icons'

const C = Colors.dark
const API = process.env.EXPO_PUBLIC_API_URL

type Section = 'body' | 'productivity' | 'notes'

export default function MoreScreen() {
  const [activeSection, setActiveSection] = useState<Section>('body')

  // Body metrics
  const [weight, setWeight] = useState('')
  const [water, setWater] = useState('')

  // Productivity
  const [topics, setTopics] = useState('')
  const [tools, setTools] = useState('')
  const [prodNotes, setProdNotes] = useState('')

  // Notes
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [noteTags, setNoteTags] = useState('')

  const [loading, setLoading] = useState(false)

  const postData = async (endpoint: string, body: object) => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setLoading(false); return false }
    const res = await fetch(`${API}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(body),
    })
    setLoading(false)
    return res.ok
  }

  const submitBody = async () => {
    const ok = await postData('/api/logs/body-metrics', { weight_lbs: +weight, water_intake_oz: +water })
    if (ok) { Alert.alert('✅ Body metrics saved!'); setWeight(''); setWater('') }
    else Alert.alert('Error', 'Failed – is the backend running?')
  }

  const submitProductivity = async () => {
    const ok = await postData('/api/logs/productivity', { topics_studied: topics, tools_used: tools, notes: prodNotes })
    if (ok) { Alert.alert('✅ Productivity saved!'); setTopics(''); setTools(''); setProdNotes('') }
    else Alert.alert('Error', 'Failed – is the backend running?')
  }

  const submitNote = async () => {
    const tags = noteTags.split(',').map(t => t.trim()).filter(Boolean)
    const ok = await postData('/api/logs/notes', { title: noteTitle, content: noteContent, tags })
    if (ok) { Alert.alert('✅ Note saved!'); setNoteTitle(''); setNoteContent(''); setNoteTags('') }
    else Alert.alert('Error', 'Failed – is the backend running?')
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const tabs: { key: Section; label: string; icon: string }[] = [
    { key: 'body', label: 'Body', icon: 'body' },
    { key: 'productivity', label: 'Study', icon: 'book' },
    { key: 'notes', label: 'Notes', icon: 'create' },
  ]

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <View style={styles.segmented}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.segment, activeSection === tab.key && styles.segmentActive]}
            onPress={() => setActiveSection(tab.key)}
          >
            <Ionicons name={tab.icon as any} size={14} color={activeSection === tab.key ? '#fff' : C.textMuted} />
            <Text style={[styles.segmentText, activeSection === tab.key && styles.segmentTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeSection === 'body' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚖️ Body Metrics</Text>
          {[
            { label: 'Weight (lbs)', value: weight, setter: setWeight, placeholder: '175.5' },
            { label: 'Water Intake (oz)', value: water, setter: setWater, placeholder: '64' },
          ].map(f => (
            <View key={f.label} style={{ marginBottom: 14 }}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput style={styles.input} placeholder={f.placeholder} placeholderTextColor={C.textMuted}
                value={f.value} onChangeText={f.setter} keyboardType="decimal-pad" />
            </View>
          ))}
          <TouchableOpacity style={styles.button} onPress={submitBody} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Body Metrics</Text>}
          </TouchableOpacity>
        </View>
      )}

      {activeSection === 'productivity' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📚 Study / Work Session</Text>
          {[
            { label: 'Topics Studied', value: topics, setter: setTopics, placeholder: 'e.g. Python, ML basics', multi: false },
            { label: 'Tools Used', value: tools, setter: setTools, placeholder: 'e.g. VS Code, Notion', multi: false },
            { label: 'Notes', value: prodNotes, setter: setProdNotes, placeholder: 'Anything worth remembering...', multi: true },
          ].map(f => (
            <View key={f.label} style={{ marginBottom: 14 }}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput style={[styles.input, f.multi && { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                placeholder={f.placeholder} placeholderTextColor={C.textMuted}
                value={f.value} onChangeText={f.setter} multiline={f.multi} />
            </View>
          ))}
          <TouchableOpacity style={styles.button} onPress={submitProductivity} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log Session</Text>}
          </TouchableOpacity>
        </View>
      )}

      {activeSection === 'notes' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🗒️ Zettelkasten Note</Text>
          <Text style={styles.label}>Title</Text>
          <TextInput style={[styles.input, { marginBottom: 14 }]} placeholder="Note title" placeholderTextColor={C.textMuted}
            value={noteTitle} onChangeText={setNoteTitle} />
          <Text style={styles.label}>Content</Text>
          <TextInput style={[styles.input, { height: 120, textAlignVertical: 'top', paddingTop: 12, marginBottom: 14 }]}
            placeholder="Write your note..." placeholderTextColor={C.textMuted}
            value={noteContent} onChangeText={setNoteContent} multiline />
          <Text style={styles.label}>Tags (comma separated)</Text>
          <TextInput style={[styles.input, { marginBottom: 14 }]} placeholder="health, fitness, idea" placeholderTextColor={C.textMuted}
            value={noteTags} onChangeText={setNoteTags} />
          <TouchableOpacity style={styles.button} onPress={submitNote} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Note</Text>}
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
        <Ionicons name="log-out-outline" size={18} color={C.danger} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  segmented: { flexDirection: 'row', backgroundColor: C.card, borderRadius: 14, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: C.cardBorder },
  segment: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  segmentActive: { backgroundColor: C.primary },
  segmentText: { color: C.textMuted, fontWeight: '600', fontSize: 13 },
  segmentTextActive: { color: '#fff' },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: C.cardBorder },
  cardTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '600', color: C.textMuted, marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: C.inputBg, borderRadius: 10, padding: 13, color: C.text, fontSize: 15, borderWidth: 1, borderColor: C.cardBorder },
  button: { backgroundColor: C.primary, borderRadius: 12, padding: 15, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: C.danger + '44' },
  signOutText: { color: C.danger, fontWeight: '700', fontSize: 15 },
})
