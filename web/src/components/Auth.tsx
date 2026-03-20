import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    let error = null
    if (isSignUp) {
      const res = await supabase.auth.signUp({ email, password })
      error = res.error
      if (!error) setMessage('check your email to confirm your account')
    } else {
      const res = await supabase.auth.signInWithPassword({ email, password })
      error = res.error
    }

    if (error) setMessage(error.message)
    setLoading(false)
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            self<span style={{ color: '#2b7fff' }}>//</span>ops
          </div>
          <div className="auth-subtitle">
            {isSignUp ? 'create account' : 'sign in'}
          </div>
        </div>

        <form onSubmit={handleAuth} className="auth-body">
          <div className="auth-field">
            <label>email</label>
            <input
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="auth-field">
            <label>password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'authenticating...' : isSignUp ? 'create account' : 'sign in'}
          </button>
        </form>

        {message && <div className="auth-message">{message}</div>}

        <button className="auth-toggle" onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? 'already have an account — sign in' : 'no account — sign up'}
        </button>
      </div>
    </div>
  )
}
