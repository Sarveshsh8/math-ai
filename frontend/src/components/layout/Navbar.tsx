import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'

export function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const path = location.pathname

  const link = (to: string, label: string) => (
    <a
      className={`nav__link ${path === to ? 'nav__link--active' : ''}`}
      onClick={() => navigate(to)}
      style={{ cursor: 'pointer' }}
    >
      {label}
    </a>
  )

  return (
    <nav className="nav">
      <div className="nav__brand" onClick={() => navigate('/')}>
        <span className="nav__brand-mark">m</span>
        <span>math<em style={{ fontStyle: 'italic' }}>·</em>ai</span>
      </div>
      <div className="nav__links">
        {link('/', 'Home')}
        {link('/solve', 'Solve')}
        {link('/explore', 'Explore')}
      </div>
      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="nav__link" style={{ cursor: 'default', color: 'var(--ink-3)' }}>
            {user.email}
          </span>
          <a className="nav__cta" onClick={logout} style={{ cursor: 'pointer' }}>
            Sign out
          </a>
        </div>
      ) : (
        <a className="nav__cta" onClick={() => navigate('/auth')} style={{ cursor: 'pointer' }}>
          Sign in <span aria-hidden>→</span>
        </a>
      )}
    </nav>
  )
}
