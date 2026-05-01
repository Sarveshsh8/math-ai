import { NavLink } from 'react-router-dom'

export function Navbar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-slate-400 hover:text-white'}`

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-[#1e2d45]">
      <NavLink to="/" className="text-white font-bold text-lg tracking-tight">
        Math<span className="text-violet-500">AI</span>
      </NavLink>
      <div className="flex gap-6">
        <NavLink to="/" end className={linkClass}>Solve</NavLink>
        <NavLink to="/explore" className={linkClass}>Explore</NavLink>
      </div>
    </nav>
  )
}
