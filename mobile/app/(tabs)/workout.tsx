import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { supabase } from '../../lib/supabase'
import { Colors } from '../../constants/Colors'
import { Ionicons } from '@expo/vector-icons'

const C = Colors.dark
const API = process.env.EXPO_PUBLIC_API_URL

const WORKOUT_TYPES = ['Strength', 'Hypertrophy', 'Calisthenics', 'Yoga', 'Flexibility', 'Other']

export default function WorkoutScreen() {
  const [workoutType, setWorkoutType] = useState('Strength')
  const [exercise, setExercise] = useState('')
  const [sets, setSets] = useState('')
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<any[]>([])

  const addSet = () => {
    if (!exercise) { Alert.alert('Enter an exercise name'); return }
    setLogs(prev => [...prev, { exercise, sets, reps, weight }])
    setExercise(''); setSets(''); setReps(''); setWeight('')
  }

  const submit = async () => {
    if (logs.length === 0) { Alert.alert('Add at least one exercise'); return }
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setLoading(false); return }

    // Post all exercises
    const promises = logs.map(log =>
      fetch(`${API}/api/logs/workout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ workout_type: workoutType, ...log, sets: +log.sets, reps: +log.reps, weight: +log.weight }),
      })
    )
    await Promise.all(promises)
    setLoading(false)
    Alert.alert('✅ Workout Logged!', `${logs.length} exercise(s) saved.`)
    setLogs([])
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={styles.sectionTitle}>💪 Workout Type</Text>
      <View style={styles.card}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {WORKOUT_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.chip, workoutType === type && styles.chipActive]}
                onPress={() => setWorkoutType(type)}
              >
                <Text style={[styles.chipText, workoutType === type && styles.chipTextActive]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <Text style={styles.sectionTitle}>➕ Add Exercise</Text>
      <View style={styles.card}>
        {[
          { label: 'Exercise Name', value: exercise, setter: setExercise, placeholder: 'e.g. Bench Press' },
          { label: 'Sets', value: sets, setter: setSets, placeholder: '4', numeric: true },
          { label: 'Reps', value: reps, setter: setReps, placeholder: '8', numeric: true },
          { label: 'Weight (lbs)', value: weight, setter: setWeight, placeholder: '185', numeric: true },
        ].map(f => (
          <View key={f.label} style={{ marginBottom: 12 }}>
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
        <TouchableOpacity style={[styles.button, { backgroundColor: C.cardBorder }]} onPress={addSet}>
          <Ionicons name="add-circle" size={18} color={C.primaryLight} />
          <Text style={[styles.buttonText, { color: C.primaryLight }]}>Add to Workout</Text>
        </TouchableOpacity>
      </View>

      {logs.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>📋 Today's Workout ({logs.length} exercises)</Text>
          <View style={styles.card}>
            {logs.map((log, i) => (
              <View key={i} style={styles.logRow}>
                <Text style={styles.logName}>{log.exercise}</Text>
                <Text style={styles.logDetail}>{log.sets}x{log.reps} @ {log.weight}lbs</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.button} onPress={submit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> :
                <Text style={styles.buttonText}>✅ Save Workout</Text>
              }
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 10 },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: C.cardBorder },
  label: { fontSize: 12, fontWeight: '600', color: C.textMuted, marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: C.inputBg, borderRadius: 10, padding: 13, color: C.text, fontSize: 15, borderWidth: 1, borderColor: C.cardBorder },
  button: { backgroundColor: C.primary, borderRadius: 12, padding: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.cardBorder },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { color: C.textMuted, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.cardBorder },
  logName: { color: C.text, fontWeight: '600', fontSize: 14 },
  logDetail: { color: C.textMuted, fontSize: 13 },
})
