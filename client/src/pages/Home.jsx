import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../stores/authStore'

const FACTIONS = [
  {
    id: 'ironwood',
    name: 'Ironwood Collective',
    icon: '⚙️',
    color: 'bg-faction-ironwood',
    description: 'Industrial empire. Build and expand.',
    difficulty: 'Easy'
  },
  {
    id: 'eyrie',
    name: 'Eyrie Dynasty',
    icon: '🦅',
    color: 'bg-faction-eyrie',
    description: 'Noble birds. Follow your decree.',
    difficulty: 'Medium'
  },
  {
    id: 'alliance',
    name: 'Forest Alliance',
    icon: '🐿️',
    color: 'bg-faction-alliance',
    description: 'Rebel force. Spread sympathy.',
    difficulty: 'Hard'
  },
  {
    id: 'wanderer',
    name: 'Lone Wanderer',
    icon: '🦊',
    color: 'bg-faction-wanderer',
    description: 'Solo adventurer. Complete quests.',
    difficulty: 'Medium'
  }
]

export default function Home() {
  const navigate = useNavigate()
  const { user, guestLogin, logout, isLoading } = useAuthStore()
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [joinCode, setJoinCode] = useState('')
  const [lobbies, setLobbies] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [gameName, setGameName] = useState('')
  
  // Auth form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const { login, register } = useAuthStore()

  useEffect(() => {
    fetchLobbies()
  }, [])

  const fetchLobbies = async () => {
    try {
      const res = await fetch('/api/lobby')
      const data = await res.json()
      setLobbies(data.lobbies || [])
    } catch (e) {
      console.error('Failed to fetch lobbies')
    }
  }

  const handleGuestPlay = async () => {
    try {
      await guestLogin()
    } catch (e) {
      console.error('Guest login failed')
    }
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    try {
      if (authMode === 'login') {
        await login(email, password)
      } else {
        await register(username, email, password)
      }
      setShowAuth(false)
    } catch (e) {
      // Error handled in store
    }
  }

  const handleCreateGame = async () => {
    try {
      const res = await fetch('/api/game/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: gameName || `${user.username}'s Game` }),
        credentials: 'include'
      })
      const data = await res.json()
      if (data.game?.code) {
        navigate(`/lobby/${data.game.code}`)
      }
    } catch (e) {
      console.error('Failed to create game')
    }
  }

  const handleJoinGame = () => {
    if (joinCode.trim()) {
      navigate(`/lobby/${joinCode.trim().toUpperCase()}`)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-6 flex justify-between items-center border-b border-gold-500/20">
        <motion.h1 
          className="font-display text-4xl md:text-5xl text-gradient"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          🌲 Woodland War
        </motion.h1>
        
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-forest-100">{user.username}</span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm text-forest-200 hover:text-gold-400 transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleGuestPlay}
                disabled={isLoading}
                className="px-4 py-2 text-sm text-forest-200 hover:text-gold-400 transition"
              >
                Play as Guest
              </button>
              <button
                onClick={() => setShowAuth(true)}
                className="px-4 py-2 bg-gold-500/20 hover:bg-gold-500/30 text-gold-400 rounded-lg transition"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        {/* Hero Section */}
        <motion.section 
          className="text-center mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-display text-3xl md:text-4xl text-forest-100 mb-4">
            Strategic Woodland Conquest
          </h2>
          <p className="text-forest-300 text-lg max-w-2xl mx-auto">
            Command your faction in an asymmetric battle for control of the woodland. 
            Build, battle, and outmaneuver your opponents in this strategic board game for 2-4 players.
          </p>
        </motion.section>

        {/* Game Actions */}
        {user && (
          <motion.section 
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="glass rounded-2xl p-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Create Game */}
                <div className="text-center">
                  <h3 className="font-display text-2xl text-gold-400 mb-4">Create Game</h3>
                  <p className="text-forest-300 mb-6">Start a new game and invite your friends</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-gold px-8 py-3 rounded-lg font-semibold text-forest-900"
                  >
                    Create New Game
                  </button>
                </div>
                
                {/* Join Game */}
                <div className="text-center">
                  <h3 className="font-display text-2xl text-gold-400 mb-4">Join Game</h3>
                  <p className="text-forest-300 mb-4">Enter a game code to join</p>
                  <div className="flex gap-2 justify-center">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="ABCDEF"
                      maxLength={6}
                      className="px-4 py-3 bg-forest-900/50 border border-forest-600 rounded-lg text-center text-xl tracking-widest uppercase w-40 focus:outline-none focus:border-gold-500"
                    />
                    <button
                      onClick={handleJoinGame}
                      disabled={joinCode.length !== 6}
                      className="px-6 py-3 bg-forest-600 hover:bg-forest-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
                    >
                      Join
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Factions */}
        <motion.section 
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="font-display text-2xl text-gold-400 mb-6 text-center">Choose Your Faction</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {FACTIONS.map((faction, idx) => (
              <motion.div
                key={faction.id}
                className="glass rounded-xl p-6 text-center hover:border-gold-500/50 transition cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className={`w-16 h-16 ${faction.color} rounded-full flex items-center justify-center text-3xl mx-auto mb-4`}>
                  {faction.icon}
                </div>
                <h4 className="font-display text-lg text-forest-100 mb-2">{faction.name}</h4>
                <p className="text-forest-400 text-sm mb-3">{faction.description}</p>
                <span className="inline-block px-3 py-1 bg-forest-700/50 rounded-full text-xs text-forest-300">
                  {faction.difficulty}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Open Lobbies */}
        {lobbies.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="font-display text-2xl text-gold-400 mb-6 text-center">Open Games</h3>
            <div className="glass rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-forest-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm text-forest-300">Name</th>
                    <th className="px-6 py-3 text-left text-sm text-forest-300">Players</th>
                    <th className="px-6 py-3 text-left text-sm text-forest-300">Code</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {lobbies.map((lobby) => (
                    <tr key={lobby.code} className="border-t border-forest-700/50 hover:bg-forest-700/30">
                      <td className="px-6 py-4 text-forest-100">{lobby.name}</td>
                      <td className="px-6 py-4 text-forest-300">{lobby.playerCount}/{lobby.maxPlayers}</td>
                      <td className="px-6 py-4 font-mono text-gold-400">{lobby.code}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate(`/lobby/${lobby.code}`)}
                          disabled={!user}
                          className="px-4 py-2 bg-faction-alliance hover:bg-faction-alliance/80 rounded-lg text-sm disabled:opacity-50"
                        >
                          Join
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>
        )}
      </main>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuth && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAuth(false)}
          >
            <motion.div
              className="glass rounded-2xl p-8 max-w-md w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-2xl text-gold-400 mb-6 text-center">
                {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h3>
              
              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === 'register' && (
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-forest-900/50 border border-forest-600 rounded-lg focus:outline-none focus:border-gold-500"
                    required
                  />
                )}
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-forest-900/50 border border-forest-600 rounded-lg focus:outline-none focus:border-gold-500"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-forest-900/50 border border-forest-600 rounded-lg focus:outline-none focus:border-gold-500"
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-gold py-3 rounded-lg font-semibold text-forest-900 disabled:opacity-50"
                >
                  {isLoading ? 'Loading...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>
              
              <p className="text-center text-forest-400 mt-4">
                {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="text-gold-400 hover:underline"
                >
                  {authMode === 'login' ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Game Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              className="glass rounded-2xl p-8 max-w-md w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-2xl text-gold-400 mb-6 text-center">Create New Game</h3>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Game Name (optional)"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  className="w-full px-4 py-3 bg-forest-900/50 border border-forest-600 rounded-lg focus:outline-none focus:border-gold-500"
                />
                <button
                  onClick={handleCreateGame}
                  className="w-full btn-gold py-3 rounded-lg font-semibold text-forest-900"
                >
                  Create Game
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Footer */}
      <footer className="p-6 text-center text-forest-500 border-t border-forest-700/50">
        <a href="/rules" className="hover:text-gold-400 mx-3">Rules</a>
        <a href="/about" className="hover:text-gold-400 mx-3">About</a>
      </footer>
    </div>
  )
}
