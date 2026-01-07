import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'
import { useAuthStore } from '../stores/authStore'
import GameBoard from '../components/GameBoard'
import PlayerHand from '../components/PlayerHand'
import PlayerPanel from '../components/PlayerPanel'
import ActionPanel from '../components/ActionPanel'
import ChatPanel from '../components/ChatPanel'
import GameLog from '../components/GameLog'

export default function Game() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { 
    connect, 
    joinGame, 
    gameState, 
    connected, 
    selectedClearing,
    selectedAction,
    messages,
    error,
    clearError
  } = useGameStore()
  
  const [showChat, setShowChat] = useState(false)

  // Check user on initial mount only
  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }
  }, []) // Empty deps - only run once on mount

  // Connect and join game when code changes
  useEffect(() => {
    if (!user) return
    
    connect()
    
    // Small delay to ensure socket connection is ready
    const timeout = setTimeout(() => {
      joinGame(code)
    }, 100)
    
    return () => clearTimeout(timeout)
  }, [code])

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-forest-300">Loading game...</p>
        </div>
      </div>
    )
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  const myPlayer = gameState.players.find(p => p.username === user?.username)
  const isMyTurn = currentPlayer?.username === user?.username
  const winner = gameState.winnerId ? gameState.players.find(p => p.oderId === gameState.winnerId) : null

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <header className="bg-forest-900/80 backdrop-blur border-b border-forest-700 p-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="text-forest-400 hover:text-gold-400"
          >
            ← Leave
          </button>
          <h1 className="font-display text-xl text-gold-400">Woodland War</h1>
          <span className="font-mono text-forest-400">{code}</span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-forest-300">
            Turn {gameState.turnNumber} • {gameState.currentPhase.toUpperCase()}
          </span>
          <div className={`px-3 py-1 rounded-full text-sm ${connected ? 'bg-faction-alliance/20 text-faction-alliance' : 'bg-red-500/20 text-red-400'}`}>
            {connected ? 'Live' : 'Reconnecting...'}
          </div>
          <button
            onClick={() => setShowChat(!showChat)}
            className="p-2 bg-forest-700 hover:bg-forest-600 rounded-lg relative"
          >
            💬
            {messages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
                {messages.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 flex">
        {/* Left Panel - Other Players */}
        <aside className="w-64 bg-forest-900/50 border-r border-forest-700 p-4 hidden lg:block">
          <h2 className="font-display text-lg text-gold-400 mb-4">Players</h2>
          <div className="space-y-3">
            {gameState.players.map((player, idx) => (
              <PlayerPanel 
                key={idx} 
                player={player} 
                isCurrentTurn={idx === gameState.currentPlayerIndex}
                isMe={player.username === user?.username}
              />
            ))}
          </div>
          
          <div className="mt-6">
            <GameLog actions={gameState.actionLog?.slice(-10) || []} />
          </div>
        </aside>

        {/* Center - Game Board */}
        <div className="flex-1 flex flex-col p-4">
          {/* Current Turn Indicator */}
          <div className="text-center mb-4">
            {isMyTurn ? (
              <motion.div
                className="inline-block px-6 py-2 bg-gold-500/20 border border-gold-500/50 rounded-full"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <span className="text-gold-400 font-semibold">Your Turn!</span>
              </motion.div>
            ) : (
              <div className="inline-block px-6 py-2 bg-forest-700/50 rounded-full">
                <span className="text-forest-300">{currentPlayer?.username}'s Turn</span>
              </div>
            )}
          </div>

          {/* Game Board */}
          <div className="flex-1 flex items-center justify-center">
            <GameBoard 
              clearings={gameState.clearings}
              pieces={gameState.pieces}
              selectedClearing={selectedClearing}
              myFaction={myPlayer?.faction}
            />
          </div>

          {/* Action Panel */}
          {isMyTurn && (
            <ActionPanel 
              phase={gameState.currentPhase}
              faction={myPlayer?.faction}
              factionState={myPlayer?.factionState}
            />
          )}
        </div>

        {/* Right Panel - Hand & Chat */}
        <aside className={`${showChat ? 'w-80' : 'w-64'} bg-forest-900/50 border-l border-forest-700 flex flex-col`}>
          {showChat ? (
            <ChatPanel 
              messages={messages} 
              onClose={() => setShowChat(false)} 
            />
          ) : (
            <>
              {/* My Info */}
              <div className="p-4 border-b border-forest-700">
                <h2 className="font-display text-lg text-gold-400 mb-2">Your Status</h2>
                {myPlayer && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-forest-400">Victory Points</span>
                      <span className="text-gold-400 font-bold">{myPlayer.victoryPoints}/30</span>
                    </div>
                    <div className="w-full bg-forest-800 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-gold-600 to-gold-400 h-2 rounded-full transition-all"
                        style={{ width: `${(myPlayer.victoryPoints / 30) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-forest-400">Cards</span>
                      <span className="text-forest-100">{myPlayer.hand?.length || 0}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Hand */}
              <div className="flex-1 overflow-y-auto p-4">
                <h2 className="font-display text-lg text-gold-400 mb-3">Your Hand</h2>
                <PlayerHand cards={myPlayer?.hand || []} />
              </div>

              {/* Available Items */}
              <div className="p-4 border-t border-forest-700">
                <h3 className="text-sm text-forest-400 mb-2">Items on Map</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(gameState.availableItems || {}).map(([item, count]) => (
                    count > 0 && (
                      <span key={item} className="px-2 py-1 bg-forest-800 rounded text-xs">
                        {item}: {count}
                      </span>
                    )
                  ))}
                </div>
              </div>
            </>
          )}
        </aside>
      </main>

      {/* Victory Modal */}
      <AnimatePresence>
        {winner && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="glass rounded-2xl p-12 text-center max-w-md"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="font-display text-3xl text-gold-400 mb-2">Victory!</h2>
              <p className="text-forest-100 text-xl mb-2">{winner.username}</p>
              <p className="text-forest-400 mb-6">
                Won by {gameState.winCondition === 'victory_points' ? 'reaching 30 Victory Points' : gameState.winCondition}
              </p>
              <button
                onClick={() => navigate('/')}
                className="btn-gold px-8 py-3 rounded-lg font-semibold text-forest-900"
              >
                Return Home
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="fixed bottom-4 right-4 bg-red-500/90 text-white px-6 py-3 rounded-lg shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="flex items-center gap-3">
              <span>{error}</span>
              <button onClick={clearError} className="text-white/80 hover:text-white">×</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
