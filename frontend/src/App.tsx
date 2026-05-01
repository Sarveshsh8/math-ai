import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navbar } from './components/layout/Navbar'
import { SolvePage } from './pages/SolvePage'
import { ExplorePage } from './pages/ExplorePage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0a0f1e]">
        <Routes>
          {/* Solve page has its own hero — no navbar shown on idle */}
          <Route path="/" element={<SolvePageWithNav />} />
          <Route path="/explore" element={<><Navbar /><ExplorePage /></>} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

function SolvePageWithNav() {
  return (
    <>
      <div className="absolute top-0 right-0 px-6 py-4 flex gap-6 z-10">
        <a href="/explore" className="text-slate-500 hover:text-white text-sm transition-colors">Explore ↗</a>
      </div>
      <SolvePage />
    </>
  )
}
