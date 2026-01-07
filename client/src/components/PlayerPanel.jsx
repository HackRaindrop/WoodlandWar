import { motion } from 'framer-motion'

const FACTION_DATA = {
  ironwood: { icon: '⚙️', color: 'bg-faction-ironwood', name: 'Ironwood' },
  eyrie: { icon: '🦅', color: 'bg-faction-eyrie', name: 'Eyrie' },
  alliance: { icon: '🐿️', color: 'bg-faction-alliance', name: 'Alliance' },
  wanderer: { icon: '🦊', color: 'bg-faction-wanderer', name: 'Wanderer' }
}

export default function PlayerPanel({ player, isCurrentTurn, isMe }) {
  const faction = FACTION_DATA[player.faction] || { icon: '?', color: 'bg-gray-600', name: 'Unknown' }

  return (
    <motion.div
      className={`
        p-3 rounded-lg transition-all
        ${isCurrentTurn ? 'bg-gold-500/20 border border-gold-500/50' : 'bg-forest-800/50'}
        ${isMe ? 'ring-1 ring-faction-alliance/50' : ''}
      `}
      animate={isCurrentTurn ? { scale: [1, 1.02, 1] } : {}}
      transition={{ repeat: isCurrentTurn ? Infinity : 0, duration: 2 }}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${faction.color} rounded-full flex items-center justify-center text-xl`}>
          {faction.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-forest-100 font-semibold truncate">
              {player.username}
            </span>
            {isMe && (
              <span className="text-xs text-faction-alliance">(You)</span>
            )}
          </div>
          <span className="text-xs text-forest-400">{faction.name}</span>
        </div>
      </div>

      {/* Victory Points */}
      <div className="mt-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-forest-400">VP</span>
          <span className="text-gold-400 font-bold">{player.victoryPoints}/30</span>
        </div>
        <div className="w-full bg-forest-900 rounded-full h-1.5">
          <div 
            className="bg-gradient-to-r from-gold-600 to-gold-400 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min((player.victoryPoints / 30) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mt-2 flex gap-3 text-xs text-forest-400">
        <span>🃏 {player.hand?.length || 0}</span>
        {player.craftedItems?.length > 0 && (
          <span>🔧 {player.craftedItems.length}</span>
        )}
        {!player.connected && (
          <span className="text-red-400">Disconnected</span>
        )}
      </div>

      {/* Current turn indicator */}
      {isCurrentTurn && (
        <div className="mt-2 text-xs text-gold-400 flex items-center gap-1">
          <span className="w-2 h-2 bg-gold-400 rounded-full animate-pulse" />
          Playing...
        </div>
      )}
    </motion.div>
  )
}
