import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Home from './pages/Home'
import Lobby from './pages/Lobby'
import Game from './pages/Game'
import { useAuthStore } from './stores/authStore'

function App() {
  const { checkAuth } = useAuthStore()
  
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <div className="min-h-screen bg-forest-800 relative">
      {/* Atmospheric background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-forest-900 via-forest-800 to-forest-900" />
        <div className="absolute top-0 left-0 w-full h-full opacity-30 tree-pattern" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-faction-alliance/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl" />
      </div>
      
      {/* Main content */}
      <div className="relative z-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lobby/:code" element={<Lobby />} />
          <Route path="/game/:code" element={<Game />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
