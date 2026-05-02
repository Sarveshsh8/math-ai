import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TweaksProvider } from './contexts/TweaksContext'
import { AuthProvider } from './contexts/AuthContext'
import { Navbar } from './components/layout/Navbar'
import { ProtectedRoute } from './components/shared/ProtectedRoute'
import { LandingPage } from './pages/LandingPage'
import { SolvePage } from './pages/SolvePage'
import { ExplorePage } from './pages/ExplorePage'
import { AuthPage } from './pages/AuthPage'
import { BillingPage } from './pages/BillingPage'

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
  return (
    <div className="shell">
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/solve" element={<ProtectedRoute><SolvePage /></ProtectedRoute>} />
        <Route path="/explore" element={<ProtectedRoute><ExplorePage /></ProtectedRoute>} />
      </Routes>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <TweaksProvider>
      <AuthProvider>
        <BrowserRouter>
          <Shell />
        </BrowserRouter>
      </AuthProvider>
    </TweaksProvider>
  )
}
