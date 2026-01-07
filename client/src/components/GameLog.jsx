import { motion } from 'framer-motion'

const ACTION_ICONS = {
  move: '🚶',
  battle: '⚔️',
  build: '🏗️',
  recruit: '👥',
  score: '⭐',
  end_turn: '🔄',
  craft: '🔨',
  draw_cards: '🃏'
}

const ACTION_COLORS = {
  move: 'text-faction-eyrie',
  battle: 'text-red-400',
  build: 'text-faction-ironwood',
  recruit: 'text-faction-alliance',
  score: 'text-gold-400',
  end_turn: 'text-forest-400',
  craft: 'text-purple-400',
  draw_cards: 'text-cyan-400'
}

export default function GameLog({ actions }) {
  if (!actions || actions.length === 0) {
    return (
      <div className="text-sm text-forest-500 text-center py-4">
        No actions yet
      </div>
    )
  }

  const formatAction = (action) => {
    const { action: type, data } = action
    
    switch (type) {
      case 'move':
        return `Moved ${data.count} warrior${data.count > 1 ? 's' : ''} from ${data.from} to ${data.to}`
      case 'battle':
        return `Battle in clearing ${data.clearing}: ${data.attacker} vs ${data.defender}`
      case 'build':
        return `Built ${data.type} in clearing ${data.clearing}`
      case 'recruit':
        return `Recruited ${data.count} warrior${data.count > 1 ? 's' : ''} in clearing ${data.clearing}`
      case 'score':
        return `Scored ${data.points} VP`
      case 'end_turn':
        return `Turn ${data.turn} started`
      case 'craft':
        return `Crafted ${data.item}`
      default:
        return type.replace(/_/g, ' ')
    }
  }

  return (
    <div>
      <h3 className="text-sm text-forest-400 mb-2">Recent Actions</h3>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {actions.slice().reverse().map((action, idx) => (
          <motion.div
            key={idx}
            className="text-xs flex items-start gap-2 p-1.5 bg-forest-800/30 rounded"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <span>{ACTION_ICONS[action.action] || '•'}</span>
            <span className={ACTION_COLORS[action.action] || 'text-forest-300'}>
              {formatAction(action)}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
