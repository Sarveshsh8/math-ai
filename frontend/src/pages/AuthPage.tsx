import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') await login(email, password)
      else await register(email, password, displayName)
      navigate('/solve')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__brand">math·ai</div>
        <div className="auth-card__tabs">
          <button
            className={`auth-card__tab${mode === 'login' ? ' auth-card__tab--active' : ''}`}
            onClick={() => { setMode('login'); setError('') }}
            type="button"
          >
            Sign in
          </button>
          <button
            className={`auth-card__tab${mode === 'register' ? ' auth-card__tab--active' : ''}`}
            onClick={() => { setMode('register'); setError('') }}
            type="button"
          >
            Create account
          </button>
        </div>

        <form className="auth-card__form" onSubmit={submit}>
          {mode === 'register' && (
            <div className="auth-card__field">
              <label className="auth-card__label">Display name</label>
              <input
                className="auth-card__input"
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
          )}
          <div className="auth-card__field">
            <label className="auth-card__label">Email</label>
            <input
              className="auth-card__input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>
          <div className="auth-card__field">
            <label className="auth-card__label">Password</label>
            <input
              className="auth-card__input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'Min 8 characters' : '••••••••'}
              required
            />
          </div>

          {error && <p className="auth-card__error">{error}</p>}

          <button className="btn btn--primary btn--lg auth-card__submit" type="submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}
