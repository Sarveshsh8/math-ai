import { useLocation, useNavigate } from 'react-router-dom'

export function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
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
      <a className="nav__cta" onClick={() => navigate('/solve')} style={{ cursor: 'pointer' }}>
        Try it free <span aria-hidden>→</span>
      </a>
    </nav>
  )
}
