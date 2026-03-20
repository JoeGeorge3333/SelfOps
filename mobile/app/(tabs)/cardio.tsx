import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { supabase } from '../../lib/supabase'
import { Colors } from '../../constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import { Pedometer } from 'expo-sensors'

const C = Colors.dark
const API = process.env.EXPO_PUBLIC_API_URL

export default function CardioScreen() {
  const [steps, setSteps] = useState('')
  const [distance, setDistance] = useState('')
  const [pace, setPace] = useState('')
  const [loading, setLoading] = useState(false)
  const [pedometerAvailable, setPedometerAvailable] = useState(false)
  const [liveSteps, setLiveSteps] = useState(0)
  const [tracking, setTracking] = useState(false)
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    Pedometer.isAvailableAsync().then(available => setPedometerAvailable(available))
    return () => { subscription?.remove() }
  }, [])

  const toggleTracking = async () => {
    if (tracking) {
      subscription?.remove()
      setTracking(false)
      setSteps(String(liveSteps))
    } else {
      const sub = Pedometer.watchStepCount(result => {
        setLiveSteps(result.steps)
      })
      setSubscription(sub)
      setLiveSteps(0)
      setTracking(true)
    }
  }

  const submit = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setLoading(false); return }

    const res = await fetch(`${API}/api/logs/cardio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({
        source: tracking ? 'expo_sensor' : 'manual',
        steps: steps ? +steps : undefined,
        distance_miles: distance ? +distance : undefined,
        pace: pace || undefined,
      }),
    })
    setLoading(false)
    if (res.ok) {
      Alert.alert('✅ Cardio Logged!')
      setSteps(''); setDistance(''); setPace(''); setLiveSteps(0)
    } else {
      Alert.alert('Error', 'Failed to log. Is the backend running?')
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      {pedometerAvailable && (
        <>
          <Text style={styles.sectionTitle}>👟 Step Tracker</Text>
          <View style={styles.card}>
            <View style={styles.stepCounter}>
              <Text style={styles.stepNum}>{liveSteps.toLocaleString()}</Text>
              <Text style={styles.stepLabel}>steps recorded</Text>
            </View>
            <TouchableOpacity
              style={[styles.button, tracking && { backgroundColor: C.danger }]}
              onPress={toggleTracking}
            >
              <Ionicons name={tracking ? 'stop-circle' : 'play-circle'} size={18} color="#fff" />
              <Text style={styles.buttonText}>{tracking ? 'Stop Tracking' : 'Start Tracking'}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>📝 Manual Entry</Text>
      <View style={styles.card}>
        {[
          { label: 'Steps', value: steps, setter: setSteps, placeholder: '8000', numeric: true },
          { label: 'Distance (miles)', value: distance, setter: setDistance, placeholder: '3.2', numeric: true },
          { label: 'Pace (e.g. 9:30/mi)', value: pace, setter: setPace, placeholder: '9:30/mi' },
        ].map(f => (
          <View key={f.label} style={{ marginBottom: 14 }}>
            <Text style={styles.label}>{f.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={f.placeholder}
              placeholderTextColor={C.textMuted}
              value={f.value}
              onChangeText={f.setter}
              keyboardType={f.numeric ? 'decimal-pad' : 'default'}
            />
          </View>
        ))}
        <TouchableOpacity style={styles.button} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> :
            <Text style={styles.buttonText}>✅ Log Cardio</Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 10 },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: C.cardBorder },
  label: { fontSize: 12, fontWeight: '600', color: C.textMuted, marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: C.inputBg, borderRadius: 10, padding: 13, color: C.text, fontSize: 15, borderWidth: 1, borderColor: C.cardBorder },
  button: { backgroundColor: C.primary, borderRadius: 12, padding: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  stepCounter: { alignItems: 'center', paddingVertical: 16, marginBottom: 16 },
  stepNum: { fontSize: 52, fontWeight: '800', color: C.primaryLight },
  stepLabel: { fontSize: 14, color: C.textMuted, marginTop: 4 },
})
