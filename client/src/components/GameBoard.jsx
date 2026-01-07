import { motion } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'

// Clearing positions matching Root's autumn map layout (percentage-based)
// Corners: 1 (top-left), 3 (top-right), 10 (bottom-left), 12 (bottom-right)
const CLEARING_POSITIONS = {
  1: { x: 12, y: 12 },   // Top-left corner (Fox, starting Marquise)
  2: { x: 50, y: 8 },    // Top center (Rabbit)
  3: { x: 88, y: 12 },   // Top-right corner (Mouse, starting Eyrie)
  4: { x: 20, y: 35 },   // Left upper-mid (Mouse)
  5: { x: 45, y: 32 },   // Center upper (Rabbit)
  6: { x: 75, y: 30 },   // Right upper-mid (Fox)
  7: { x: 25, y: 58 },   // Left lower-mid (Rabbit)
  8: { x: 55, y: 55 },   // Center (Fox)
  9: { x: 80, y: 60 },   // Right lower-mid (Mouse)
  10: { x: 12, y: 85 },  // Bottom-left corner (Mouse)
  11: { x: 50, y: 88 },  // Bottom center (Fox)
  12: { x: 88, y: 85 }   // Bottom-right corner (Rabbit)
}

// Connections matching Root's actual autumn map paths
const CONNECTIONS = [
  // Top row connections
  [1, 2], [2, 3],
  // Top to middle connections
  [1, 4], [2, 5], [3, 6],
  // Middle row horizontal
  [4, 5], [5, 6],
  // Middle vertical connections
  [4, 7], [5, 8], [6, 9],
  // Lower middle horizontal
  [7, 8], [8, 9],
  // Bottom connections
  [7, 10], [8, 11], [9, 12],
  // Bottom row
  [10, 11], [11, 12],
  // Diagonal paths (the forest paths)
  [1, 5], [3, 5], [5, 7], [5, 9]
]

const SUIT_COLORS = {
  fox: '#f97316',
  rabbit: '#a855f7',
  mouse: '#22c55e'
}

const FACTION_COLORS = {
  ironwood: '#d97706',
  eyrie: '#3b82f6',
  alliance: '#10b981',
  wanderer: '#6b7280'
}

export default function GameBoard({ clearings, pieces, selectedClearing, myFaction }) {
  const { selectClearing, gameState } = useGameStore()

  const getPiecesInClearing = (clearingId) => {
    return pieces?.filter(p => p.clearingId === clearingId) || []
  }

  const getWarriorCount = (clearingId, faction) => {
    return pieces?.filter(p => 
      p.clearingId === clearingId && 
      p.faction === faction && 
      p.type === 'warrior'
    ).length || 0
  }

  const getBuildings = (clearingId) => {
    return pieces?.filter(p => 
      p.clearingId === clearingId && 
      p.type !== 'warrior'
    ) || []
  }

  const getRuler = (clearingId) => {
    const factionCounts = {}
    const clearingPieces = getPiecesInClearing(clearingId)
    
    clearingPieces.forEach(p => {
      if (!factionCounts[p.faction]) {
        factionCounts[p.faction] = 0
      }
      factionCounts[p.faction]++
    })
    
    let ruler = null
    let maxCount = 0
    
    for (const [faction, count] of Object.entries(factionCounts)) {
      if (count > maxCount) {
        maxCount = count
        ruler = faction
      } else if (count === maxCount) {
        ruler = null
      }
    }
    
    return ruler
  }

  return (
    <div className="relative w-full max-w-4xl aspect-[4/3] bg-forest-800/50 rounded-2xl border border-forest-600 overflow-hidden">
      {/* Background forest texture */}
      <div className="absolute inset-0 opacity-20 tree-pattern" />
      
      {/* SVG for connections */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {CONNECTIONS.map(([from, to], idx) => {
          const fromPos = CLEARING_POSITIONS[from]
          const toPos = CLEARING_POSITIONS[to]
          return (
            <line
              key={idx}
              x1={`${fromPos.x}%`}
              y1={`${fromPos.y}%`}
              x2={`${toPos.x}%`}
              y2={`${toPos.y}%`}
              stroke="#4a7c5f"
              strokeWidth="3"
              strokeDasharray="8,4"
              opacity="0.6"
            />
          )
        })}
      </svg>

      {/* Clearings */}
      {clearings?.map((clearing) => {
        const pos = CLEARING_POSITIONS[clearing.id]
        const ruler = getRuler(clearing.id)
        const isSelected = selectedClearing === clearing.id
        const buildings = getBuildings(clearing.id)
        
        // Get warrior counts per faction
        const warriorCounts = ['ironwood', 'eyrie', 'alliance', 'wanderer']
          .map(f => ({ faction: f, count: getWarriorCount(clearing.id, f) }))
          .filter(w => w.count > 0)

        return (
          <div
            key={clearing.id}
            className="absolute"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <motion.div
              className={`
                w-24 h-24 cursor-pointer rounded-full border-4 transition-colors
                ${isSelected ? 'border-gold-400 shadow-lg shadow-gold-500/30' : 'border-forest-500'}
                hover:border-gold-300
              `}
              style={{
                backgroundColor: ruler ? `${FACTION_COLORS[ruler]}20` : 'rgba(45, 74, 62, 0.8)'
              }}
              onClick={() => selectClearing(clearing.id)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
            >
            {/* Suit indicator */}
            <div 
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full border-2 border-forest-800 flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: SUIT_COLORS[clearing.suit] }}
            >
              {clearing.suit[0].toUpperCase()}
            </div>

            {/* Clearing ID */}
            <div className="absolute top-1 left-1 text-xs text-forest-400 font-mono">
              {clearing.id}
            </div>

            {/* Building slots indicator */}
            <div className="absolute bottom-1 left-1 flex gap-0.5">
              {[...Array(clearing.slots)].map((_, i) => (
                <div 
                  key={i}
                  className={`w-2 h-2 rounded-sm ${i < buildings.length ? 'bg-gold-500' : 'bg-forest-600'}`}
                />
              ))}
            </div>

            {/* Warriors display */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-wrap gap-1 max-w-[60px] justify-center">
                {warriorCounts.map(({ faction, count }) => (
                  <div 
                    key={faction}
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: FACTION_COLORS[faction] }}
                  >
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Buildings */}
            {buildings.length > 0 && (
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-1">
                {buildings.slice(0, 3).map((building, idx) => (
                  <div
                    key={idx}
                    className="w-5 h-5 rounded text-xs flex items-center justify-center border border-white/30"
                    style={{ backgroundColor: FACTION_COLORS[building.faction] }}
                    title={`${building.type} (${building.faction})`}
                  >
                    {building.type === 'sawmill' && '🪵'}
                    {building.type === 'workshop' && '🔧'}
                    {building.type === 'recruiter' && '🏠'}
                    {building.type === 'roost' && '🪺'}
                    {building.type === 'base' && '⛺'}
                    {building.type === 'sympathy' && '✊'}
                  </div>
                ))}
                {buildings.length > 3 && (
                  <div className="w-5 h-5 bg-forest-700 rounded text-xs flex items-center justify-center">
                    +{buildings.length - 3}
                  </div>
                )}
              </div>
            )}
            </motion.div>
          </div>
        )
      })}

      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex gap-3 text-xs text-forest-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SUIT_COLORS.fox }} /> Fox
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SUIT_COLORS.rabbit }} /> Rabbit
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SUIT_COLORS.mouse }} /> Mouse
        </div>
      </div>

      {/* Selected clearing info */}
      {selectedClearing && (
        <motion.div
          className="absolute top-2 right-2 bg-forest-900/90 rounded-lg p-3 min-w-[160px]"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {(() => {
            const clearing = clearings.find(c => c.id === selectedClearing)
            const ruler = getRuler(selectedClearing)
            return (
              <>
                <h3 className="font-display text-gold-400 mb-1">Clearing {selectedClearing}</h3>
                <p className="text-sm text-forest-300">
                  Suit: <span className="capitalize">{clearing?.suit}</span>
                </p>
                <p className="text-sm text-forest-300">
                  Slots: {getBuildings(selectedClearing).length}/{clearing?.slots}
                </p>
                <p className="text-sm text-forest-300">
                  Ruler: <span className="capitalize">{ruler || 'None'}</span>
                </p>
              </>
            )
          })()}
        </motion.div>
      )}
    </div>
  )
}
