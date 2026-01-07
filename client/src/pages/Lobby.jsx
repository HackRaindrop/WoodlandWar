import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'
import { useAuthStore } from '../stores/authStore'

const FACTIONS = [
  { id: 'ironwood', name: 'Ironwood Collective', icon: '⚙️', color: 'bg-faction-ironwood' },
  { id: 'eyrie', name: 'Eyrie Dynasty', icon: '🦅', color: 'bg-faction-eyrie' },
  { id: 'alliance', name: 'Forest Alliance', icon: '🐿️', color: 'bg-faction-alliance' },
  { id: 'wanderer', name: 'Lone Wanderer', icon: '🦊', color: 'bg-faction-wanderer' }
]

export default function Lobby() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { connect, joinGame, gameState, connected } = useGameStore()
  
  const [lobby, setLobby] = useState(null)
  const [selectedFaction, setSelectedFaction] = useState(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(300) // 5 minutes in seconds

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }
    
    fetchLobby()
    connect()
    joinGame(code)
    
    // Poll for updates
    const interval = setInterval(fetchLobby, 3000)
    return () => clearInterval(interval)
  }, [code, user])

  useEffect(() => {
    if (gameState?.status === 'playing') {
      navigate(`/game/${code}`)
    }
  }, [gameState])

  // Countdown timer - updates every second based on server expiration time
  useEffect(() => {
    if (!lobby) return
    
    const updateTimer = () => {
      const expiresAt = new Date(lobby.expiresAt || Date.now() + 5 * 60 * 1000)
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
      setTimeRemaining(remaining)
      
      if (remaining === 0) {
        setError('Lobby expired due to inactivity')
        setTimeout(() => navigate('/'), 2000)
      }
    }
    
    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [lobby])

  const fetchLobby = async () => {
    try {
      const res = await fetch(`/api/lobby/${code}`)
      if (!res.ok) {
        setError('Game not found')
        return
      }
      const data = await res.json()
      
      // If game has started, redirect to game page
      if (data.status === 'playing' || data.redirectTo) {
        navigate(`/game/${code}`)
        return
      }
      
      if (!data.lobby) {
        setError('Game not found')
        return
      }
      
      setLobby(data.lobby)
      
      // Find current player's faction
      const me = data.lobby.players.find(p => p.username === user?.username)
      if (me?.faction) {
        setSelectedFaction(me.faction)
        setIsReady(me.isReady)
      }
    } catch (e) {
      setError('Failed to load lobby')
    }
  }

  const handleJoin = async () => {
    try {
      const res = await fetch(`/api/game/${code}/join`, {
        method: 'POST',
        credentials: 'include'
      })
      if (res.ok) {
        fetchLobby()
      }
    } catch (e) {
      setError('Failed to join game')
    }
  }

  const handleSelectFaction = async (factionId) => {
    try {
      const res = await fetch(`/api/game/${code}/faction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faction: factionId }),
        credentials: 'include'
      })
      if (res.ok) {
        setSelectedFaction(factionId)
        fetchLobby()
      }
    } catch (e) {
      setError('Failed to select faction')
    }
  }

  const handleReady = async () => {
    try {
      const res = await fetch(`/api/game/${code}/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ready: !isReady }),
        credentials: 'include'
      })
      if (res.ok) {
        setIsReady(!isReady)
        fetchLobby()
      }
    } catch (e) {
      setError('Failed to update ready status')
    }
  }

  const handleStartGame = async () => {
    try {
      const res = await fetch(`/api/game/${code}/start`, {
        method: 'POST',
        credentials: 'include'
      })
      if (res.ok) {
        navigate(`/game/${code}`)
      } else {
        const data = await res.json()
        setError(data.error)
      }
    } catch (e) {
      setError('Failed to start game')
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isInLobby = lobby?.players.some(p => p.username === user?.username)
  const isHost = lobby?.hostId === user?.id
  const allReady = lobby?.players.length >= 2 && lobby?.players.every(p => p.isReady && p.faction)
  const takenFactions = lobby?.players.map(p => p.faction).filter(Boolean) || []

  if (error === 'Game not found') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-3xl text-red-400 mb-4">Game Not Found</h1>
          <p className="text-forest-300 mb-6">The game code "{code}" doesn't exist or has expired.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-forest-600 hover:bg-forest-500 rounded-lg"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <header className="max-w-4xl mx-auto mb-8">
        <button
          onClick={() => navigate('/')}
          className="text-forest-400 hover:text-gold-400 mb-4 flex items-center gap-2"
        >
          ← Back to Home
        </button>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-display text-3xl text-gold-400">{lobby?.name || 'Loading...'}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="font-mono text-2xl tracking-widest text-forest-100">{code}</span>
              <button
                onClick={copyCode}
                className="px-3 py-1 text-sm bg-forest-700 hover:bg-forest-600 rounded transition"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          
          <div className="text-right flex items-center gap-4">
            {/* Lobby Timer */}
            <div className={`px-3 py-1 rounded-full text-sm ${timeRemaining < 60 ? 'bg-red-500/20 text-red-400' : 'bg-forest-700 text-forest-300'}`}>
              ⏱️ {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </div>
            
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${connected ? 'bg-faction-alliance/20 text-faction-alliance' : 'bg-red-500/20 text-red-400'}`}>
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-faction-alliance' : 'bg-red-500'}`} />
              {connected ? 'Connected' : 'Connecting...'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        {!isInLobby && (
          <motion.div
            className="glass rounded-xl p-8 text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="font-display text-2xl text-forest-100 mb-4">Join this game?</h2>
            <button
              onClick={handleJoin}
              className="btn-gold px-8 py-3 rounded-lg font-semibold text-forest-900"
            >
              Join Game
            </button>
          </motion.div>
        )}

        {/* Players */}
        <motion.section 
          className="glass rounded-xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="font-display text-xl text-gold-400 mb-4">
            Players ({lobby?.players.length || 0}/{lobby?.settings?.maxPlayers || 4})
          </h2>
          
          <div className="space-y-3">
            {lobby?.players.map((player, idx) => {
              const faction = FACTIONS.find(f => f.id === player.faction)
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-forest-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    {faction ? (
                      <div className={`w-10 h-10 ${faction.color} rounded-full flex items-center justify-center text-xl`}>
                        {faction.icon}
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-forest-700 rounded-full flex items-center justify-center text-forest-400">
                        ?
                      </div>
                    )}
                    <div>
                      <span className="text-forest-100">{player.username}</span>
                      {player.username === user?.username && (
                        <span className="ml-2 text-xs text-gold-400">(You)</span>
                      )}
                      {idx === 0 && (
                        <span className="ml-2 text-xs text-faction-ironwood">Host</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {faction && (
                      <span className="text-sm text-forest-400">{faction.name}</span>
                    )}
                    {player.isReady ? (
                      <span className="px-3 py-1 bg-faction-alliance/20 text-faction-alliance text-sm rounded-full">
                        Ready
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-forest-700/50 text-forest-400 text-sm rounded-full">
                        Not Ready
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
            
            {/* Empty slots */}
            {[...Array(Math.max(0, (lobby?.settings?.maxPlayers || 4) - (lobby?.players.length || 0)))].map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="flex items-center p-4 bg-forest-800/30 rounded-lg border border-dashed border-forest-700"
              >
                <div className="w-10 h-10 bg-forest-800 rounded-full flex items-center justify-center text-forest-600">
                  +
                </div>
                <span className="ml-4 text-forest-600">Waiting for player...</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Faction Selection */}
        {isInLobby && (
          <motion.section 
            className="glass rounded-xl p-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="font-display text-xl text-gold-400 mb-4">Select Your Faction</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {FACTIONS.map((faction) => {
                const isTaken = takenFactions.includes(faction.id) && selectedFaction !== faction.id
                const isSelected = selectedFaction === faction.id
                
                return (
                  <button
                    key={faction.id}
                    onClick={() => !isTaken && handleSelectFaction(faction.id)}
                    disabled={isTaken}
                    className={`
                      p-4 rounded-xl border-2 transition-all
                      ${isSelected 
                        ? 'border-gold-400 bg-gold-500/10' 
                        : isTaken 
                          ? 'border-forest-700 bg-forest-800/50 opacity-50 cursor-not-allowed'
                          : 'border-forest-600 hover:border-forest-400 bg-forest-800/30'
                      }
                    `}
                  >
                    <div className={`w-12 h-12 ${faction.color} rounded-full flex items-center justify-center text-2xl mx-auto mb-2 ${isTaken ? 'grayscale' : ''}`}>
                      {faction.icon}
                    </div>
                    <h3 className="text-sm font-semibold text-forest-100">{faction.name}</h3>
                    {isTaken && <span className="text-xs text-forest-500">Taken</span>}
                  </button>
                )
              })}
            </div>
          </motion.section>
        )}

        {/* Actions */}
        {isInLobby && (
          <motion.div 
            className="flex justify-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={handleReady}
              disabled={!selectedFaction}
              className={`
                px-8 py-3 rounded-lg font-semibold transition
                ${isReady 
                  ? 'bg-faction-alliance text-white hover:bg-faction-alliance/80' 
                  : 'bg-forest-600 text-forest-100 hover:bg-forest-500'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {isReady ? '✓ Ready' : 'Ready Up'}
            </button>
            
            {isHost && (
              <button
                onClick={handleStartGame}
                disabled={!allReady}
                className="btn-gold px-8 py-3 rounded-lg font-semibold text-forest-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Game
              </button>
            )}
          </motion.div>
        )}

        {error && error !== 'Game not found' && (
          <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-center">
            {error}
          </div>
        )}
      </main>
    </div>
  )
}
