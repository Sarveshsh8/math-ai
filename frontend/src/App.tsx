import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TweaksProvider } from './contexts/TweaksContext'
import { Navbar } from './components/layout/Navbar'
import { TweaksPanel } from './components/shared/TweaksPanel'
import { LandingPage } from './pages/LandingPage'
import { SolvePage } from './pages/SolvePage'
import { ExplorePage } from './pages/ExplorePage'

function Footer() {
  return (
    <footer className="footer">
      <div>© 2026 math·ai — built for thinking, not just answering.</div>
      <div style={{ display: 'flex', gap: 20 }}>
        <a href="#">github</a>
        <a href="#">changelog</a>
        <a href="#">privacy</a>
      </div>
    </footer>
  )
}

function Shell() {
  const [tweaksOpen, setTweaksOpen] = useState(false)

  return (
    <div className="shell">
      <Navbar onOpenTweaks={() => setTweaksOpen(o => !o)} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/solve" element={<SolvePage />} />
        <Route path="/explore" element={<ExplorePage />} />
      </Routes>
      <Footer />
      <TweaksPanel open={tweaksOpen} onClose={() => setTweaksOpen(false)} />
    </div>
  )
}

export default function App() {
  return (
    <TweaksProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </TweaksProvider>
  )
}
