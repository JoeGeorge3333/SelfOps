import { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { supabase } from '../../lib/supabase'
import { Colors } from '../../constants/Colors'
import { Ionicons } from '@expo/vector-icons'

const C = Colors.dark

type AgentResult = {
  id: string
  result_type: string
  text_summary: string
  created_at: string
}

export default function DashboardScreen() {
  const [agentResults, setAgentResults] = useState<AgentResult[]>([])
  const [userName, setUserName] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserName(user.email?.split('@')[0] ?? 'there')
    })

    supabase
      .from('agent_results')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setAgentResults(data)
      })

    // Realtime subscription
    const channel = supabase
      .channel('agent_results_mobile')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_results' }, (payload) => {
        setAgentResults((prev) => [payload.new as AgentResult, ...prev].slice(0, 5))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const signOut = () => supabase.auth.signOut()

  const typeIcon = (type: string) => {
    if (type.includes('analysis')) return 'analytics'
    if (type.includes('suggest')) return 'bulb'
    return 'bar-chart'
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good day, {userName} 👋</Text>
          <Text style={styles.subtitle}>Here's your life data overview</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
          <Ionicons name="log-out-outline" size={22} color={C.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>⚡ Agent Insights</Text>

      {agentResults.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="hourglass-outline" size={32} color={C.textMuted} />
          <Text style={styles.emptyText}>Log some data to unlock AI insights</Text>
        </View>
      ) : (
        agentResults.map((result) => (
          <View key={result.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name={typeIcon(result.result_type) as any} size={18} color={C.primaryLight} />
              <Text style={styles.cardType}>{result.result_type.replace(/_/g, ' ').toUpperCase()}</Text>
            </View>
            <Text style={styles.cardText}>{result.text_summary}</Text>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>📊 Quick Stats</Text>
      <View style={styles.statsRow}>
        {[
          { label: 'Logs Today', icon: 'today', color: '#6366f1' },
          { label: 'Streak', icon: 'flame', color: '#f59e0b' },
          { label: 'AI Reports', icon: 'sparkles', color: '#22c55e' },
        ].map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Ionicons name={stat.icon as any} size={24} color={stat.color} />
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  greeting: { fontSize: 22, fontWeight: '800', color: C.text },
  subtitle: { fontSize: 13, color: C.textMuted, marginTop: 2 },
  signOutBtn: { padding: 8, backgroundColor: C.card, borderRadius: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 12 },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.cardBorder },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardType: { fontSize: 10, fontWeight: '800', color: C.primaryLight, letterSpacing: 1 },
  cardText: { fontSize: 14, color: C.text, lineHeight: 20 },
  emptyCard: { backgroundColor: C.card, borderRadius: 16, padding: 32, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 24 },
  emptyText: { color: C.textMuted, fontSize: 14, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 16, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: C.cardBorder },
  statLabel: { fontSize: 11, color: C.textMuted, fontWeight: '600', textAlign: 'center' },
})
