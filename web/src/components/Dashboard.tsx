import { useEffect, useState } from 'react'
import { Activity, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Dashboard({ session }: { session: any }) {
  const [agentResults, setAgentResults] = useState<any[]>([])

  useEffect(() => {
    supabase.from('agent_results')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (data) setAgentResults(data)
      })

    const channel = supabase.channel('agent_results_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_results',
          filter: `user_id=eq.${session.user.id}`
        },
        (payload) => {
          setAgentResults(prev => [payload.new, ...prev].slice(0, 3))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session.user.id])

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <header className="flex justify-between items-center mb-12 glass p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-600 rounded-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-purple-400">
            Life Data Agent
          </h1>
        </div>
        <div className="text-slate-400 text-sm">
          User: <span className="text-slate-200">{session?.user?.email}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl hover:bg-slate-800/50 transition-colors">
          <h3 className="text-lg font-semibold mb-2">Health & Fitness</h3>
          <p className="text-4xl font-bold text-brand-400">No Data</p>
          <p className="text-slate-400 mt-2 text-sm">Logs will appear here</p>
        </div>
        
        <div className="glass p-6 rounded-2xl hover:bg-slate-800/50 transition-colors col-span-1 md:col-span-2 lg:col-span-1">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Agent Analysis
          </h3>
          <div className="space-y-4">
            {agentResults.length === 0 ? (
              <p className="text-slate-300 italic text-sm">"Waiting for more data to generate insights..."</p>
            ) : (
              agentResults.map(result => (
                <div key={result.id} className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <span className="text-xs uppercase font-bold text-brand-400 tracking-wider mb-1 block">
                    {result.result_type.replace('_', ' ')}
                  </span>
                  <p className="text-sm text-slate-200">{result.text_summary}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass p-6 rounded-2xl hover:bg-slate-800/50 transition-colors">
          <h3 className="text-lg font-semibold mb-2">Knowledge Base</h3>
          <p className="text-4xl font-bold text-purple-400">0 Notes</p>
        </div>
      </div>
    </div>
  )
}
