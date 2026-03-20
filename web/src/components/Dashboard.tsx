import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const MOCK_BARS = [28, 45, 62, 38, 71, 55, 90]

const NAV_TRACKING = ['dashboard', 'nutrition', 'fitness', 'cardio', 'body', 'productivity']
const NAV_KNOWLEDGE = ['notes', 'insights']

export default function Dashboard({ session }: { session: any }) {
  const [agentResults, setAgentResults] = useState<any[]>([])
  const [activeNav, setActiveNav] = useState('dashboard')

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  }).toLowerCase()

  useEffect(() => {
    supabase
      .from('agent_results')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => { if (data) setAgentResults(data) })

    const channel = supabase
      .channel('agent_results_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'agent_results',
        filter: `user_id=eq.${session.user.id}`,
      }, (payload) => {
        setAgentResults(prev => [payload.new, ...prev].slice(0, 6))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [session.user.id])

  const signOut = () => supabase.auth.signOut()

  return (
    <div className="shell">
      {/* ── Sidebar ─────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          self<span className="slash">//</span>ops
        </div>

        <div className="sidebar-group-label">tracking</div>
        {NAV_TRACKING.map(item => (
          <a
            key={item}
            className={`sidebar-item${activeNav === item ? ' active' : ''}`}
            onClick={() => setActiveNav(item)}
          >
            {item}
          </a>
        ))}

        <div className="sidebar-divider" />

        <div className="sidebar-group-label">knowledge</div>
        {NAV_KNOWLEDGE.map(item => (
          <a
            key={item}
            className={`sidebar-item${activeNav === item ? ' active' : ''}`}
            onClick={() => setActiveNav(item)}
          >
            {item}
          </a>
        ))}

        <div className="sidebar-footer">
          <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase' }}>
            {session.user.email?.split('@')[0]}
          </div>
          <button onClick={signOut}>sign out</button>
        </div>
      </aside>

      {/* ── Main ────────────────────────── */}
      <div className="main">
        {/* Top bar */}
        <div className="topbar">
          <div className="topbar-left">dashboard — overview</div>
          <div className="topbar-right">
            <div className="date-pill">{today}</div>
            <div className="realtime-badge">● live</div>
          </div>
        </div>

        {/* Content */}
        <div className="content">

          {/* ── Stats ─────────────────── */}
          <div className="section" style={{ padding: '0' }}>
            <div className="stat-grid">
              {[
                { label: 'calories today', value: '—', delta: 'no data yet' },
                { label: 'active minutes', value: '—', delta: 'no data yet' },
                { label: 'water (oz)', value: '—', delta: 'no data yet' },
                { label: 'notes', value: '0', delta: 'all time' },
              ].map(s => (
                <div key={s.label} className="stat-cell">
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-delta">{s.delta}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Weekly chart ──────────── */}
          <div className="section">
            <div className="section-header">
              <div className="section-label">activity — last 7 days</div>
            </div>
            <div className="chart-row">
              {MOCK_BARS.map((h, i) => (
                <div key={i} className="chart-col">
                  <div
                    className={`chart-bar${i === 6 ? ' active' : ''}`}
                    style={{ height: `${h}%` }}
                  />
                  <div className="chart-day">{DAYS[i]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Agent insights ─────────── */}
          <div className="section">
            <div className="section-header">
              <div className="section-label">agent insights</div>
              {agentResults.length > 0 && (
                <div className="insights-badge">{agentResults.length}</div>
              )}
            </div>
            <div className="insights-list">
              {agentResults.length === 0 ? (
                <div className="insight-row">
                  <span className="insight-text">
                    waiting for data — log activity to trigger <span className="accent">agent analysis</span>
                  </span>
                </div>
              ) : (
                agentResults.map(result => (
                  <div key={result.id} className="insight-row">
                    <span className="insight-text">{result.text_summary}</span>
                    <span className="insight-type">{result.result_type.replace(/_/g, ' ')}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Recent logs ───────────── */}
          <div className="section">
            <div className="section-header">
              <div className="section-label">recent logs</div>
            </div>
            <div className="data-grid">
              <div className="data-row header" style={{ '--cols': '2fr 1fr 1fr 1fr' } as any}>
                <div className="data-cell">item</div>
                <div className="data-cell">type</div>
                <div className="data-cell">value</div>
                <div className="data-cell">logged</div>
              </div>
              <div className="data-row" style={{ '--cols': '1fr' } as any}>
                <div className="data-cell" style={{ color: 'var(--text-dim)' }}>
                  no logs yet — use the mobile app or api to record data
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
