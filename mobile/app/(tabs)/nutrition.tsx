import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { supabase } from '../../lib/supabase'
import { Colors } from '../../constants/Colors'
import { Ionicons } from '@expo/vector-icons'

const C = Colors.dark
const API = process.env.EXPO_PUBLIC_API_URL

export default function NutritionScreen() {
  const [foodItem, setFoodItem] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [loading, setLoading] = useState(false)
  const [nlText, setNlText] = useState('')
  const [nlLoading, setNlLoading] = useState(false)
  const [parsedData, setParsedData] = useState<any>(null)

  const submitManual = async () => {
    if (!foodItem || !calories) {
      Alert.alert('Please enter at least a food item and calories.')
      return
    }
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setLoading(false); return }

    const res = await fetch(`${API}/api/logs/nutrition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ food_item: foodItem, calories: +calories, protein: +protein, carbs: +carbs, fat: +fat }),
    })
    setLoading(false)
    if (res.ok) {
      Alert.alert('✅ Logged!', `${foodItem} has been saved.`)
      setFoodItem(''); setCalories(''); setProtein(''); setCarbs(''); setFat('')
    } else {
      Alert.alert('Error', 'Failed to log. Is the backend running?')
    }
  }

  const parseNL = async () => {
    if (!nlText) return
    setNlLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setNlLoading(false); return }

    const res = await fetch(`${API}/api/logs/quick-add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ text: nlText }),
    })
    setNlLoading(false)
    if (res.ok) {
      const data = await res.json()
      setParsedData(data.parsed_data)
      // Pre-fill the form
      if (data.parsed_data) {
        setFoodItem(data.parsed_data.food_item ?? '')
        setCalories(String(data.parsed_data.calories ?? ''))
        setProtein(String(data.parsed_data.protein ?? ''))
        setCarbs(String(data.parsed_data.carbs ?? ''))
        setFat(String(data.parsed_data.fat ?? ''))
      }
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={styles.sectionTitle}>⚡ Quick Add (AI)</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Describe what you ate...</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
          placeholder="e.g. 'I had a large chicken burrito, 2 tacos, and a coke'"
          placeholderTextColor={C.textMuted}
          value={nlText}
          onChangeText={setNlText}
          multiline
        />
        <TouchableOpacity style={styles.button} onPress={parseNL} disabled={nlLoading}>
          {nlLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>🤖 Parse with AI</Text>}
        </TouchableOpacity>
        {parsedData && (
          <Text style={styles.hint}>✅ AI parsed! Fields filled below — review &amp; confirm.</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>📝 Manual Entry</Text>
      <View style={styles.card}>
        {[
          { label: 'Food Item *', value: foodItem, setter: setFoodItem, placeholder: 'e.g. Chicken & Rice Bowl' },
          { label: 'Calories *', value: calories, setter: setCalories, placeholder: '450', numeric: true },
          { label: 'Protein (g)', value: protein, setter: setProtein, placeholder: '40', numeric: true },
          { label: 'Carbs (g)', value: carbs, setter: setCarbs, placeholder: '50', numeric: true },
          { label: 'Fat (g)', value: fat, setter: setFat, placeholder: '12', numeric: true },
        ].map(field => (
          <View key={field.label} style={{ marginBottom: 14 }}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={field.placeholder}
              placeholderTextColor={C.textMuted}
              value={field.value}
              onChangeText={field.setter}
              keyboardType={field.numeric ? 'decimal-pad' : 'default'}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.button} onPress={submitManual} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> :
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.buttonText}>Log Nutrition</Text>
            </View>
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
  label: { fontSize: 12, fontWeight: '600', color: C.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: C.inputBg, borderRadius: 10, padding: 13, color: C.text, fontSize: 15, borderWidth: 1, borderColor: C.cardBorder },
  button: { backgroundColor: C.primary, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  hint: { marginTop: 12, color: Colors.dark.success, fontSize: 13, textAlign: 'center' },
})
