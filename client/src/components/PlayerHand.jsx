import { motion } from 'framer-motion'

const SUIT_COLORS = {
  fox: 'from-orange-500 to-orange-700',
  rabbit: 'from-purple-500 to-purple-700',
  mouse: 'from-green-500 to-green-700',
  bird: 'from-cyan-500 to-cyan-700'
}

const SUIT_ICONS = {
  fox: '🦊',
  rabbit: '🐰',
  mouse: '🐭',
  bird: '🐦'
}

export default function PlayerHand({ cards }) {
  if (!cards || cards.length === 0) {
    return (
      <div className="text-center text-forest-500 py-8">
        <p>No cards in hand</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {cards.map((card, idx) => {
        // Handle hidden cards (other players' hands)
        if (card.hidden) {
          return (
            <div
              key={idx}
              className="h-16 bg-forest-700 rounded-lg flex items-center justify-center"
            >
              <span className="text-forest-500">Hidden</span>
            </div>
          )
        }

        return (
          <motion.div
            key={card.id || idx}
            className={`
              game-card relative bg-gradient-to-br ${SUIT_COLORS[card.suit] || 'from-gray-600 to-gray-800'}
              rounded-lg p-3 cursor-pointer overflow-hidden
            `}
            whileHover={{ x: 8 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            {/* Card pattern overlay */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)`
              }} />
            </div>

            <div className="relative flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-display text-sm text-white font-semibold truncate">
                  {card.name}
                </h4>
                <p className="text-xs text-white/70 mt-0.5 capitalize">
                  {card.type}
                </p>
              </div>
              
              <div className="ml-2 text-xl">
                {SUIT_ICONS[card.suit]}
              </div>
            </div>

            {/* Craft cost */}
            {card.craftCost && card.craftCost.length > 0 && (
              <div className="mt-2 flex gap-1">
                {card.craftCost.map((suit, i) => (
                  <span 
                    key={i}
                    className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-xs"
                  >
                    {SUIT_ICONS[suit]}
                  </span>
                ))}
              </div>
            )}

            {/* Effect preview */}
            {card.effect && (
              <p className="text-xs text-white/60 mt-1 line-clamp-1">
                {card.effect}
              </p>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
