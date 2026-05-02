import { useState } from 'react'
import { useAuth } from '../contexts/useAuth'

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export function BillingPage() {
  const { user, token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const startCheckout = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${BASE}/api/billing/checkout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      const { url } = await res.json()
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const trialEnded = user?.hasAccess === false && !user?.subscribed

  return (
    <div className="billing-page">
      <div className="billing-card">
        <div className="billing-card__icon">∑</div>
        <h1 className="billing-card__title">
          {trialEnded ? 'Your free trial has ended' : 'Upgrade to math·ai Pro'}
        </h1>
        <p className="billing-card__subtitle">
          {trialEnded
            ? 'Subscribe to keep solving problems and exploring math.'
            : 'Unlimited problem solving, step-by-step explanations, and visualizations.'}
        </p>

        <div className="billing-card__price">
          <span className="billing-card__amount">$9.99</span>
          <span className="billing-card__period">/ month</span>
        </div>

        <ul className="billing-card__features">
          <li>Unlimited problem solving</li>
          <li>Step-by-step explanations</li>
          <li>Interactive visualizations</li>
          <li>Practice problem generation</li>
          <li>Cancel anytime</li>
        </ul>

        {error && <p className="auth-card__error">{error}</p>}

        <button
          className="btn btn--primary btn--lg billing-card__cta"
          onClick={startCheckout}
          disabled={loading}
        >
          {loading ? 'Redirecting…' : 'Subscribe now'}
        </button>
      </div>
    </div>
  )
}
