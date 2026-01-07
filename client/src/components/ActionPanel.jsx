import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'

const PHASE_ACTIONS = {
  birdsong: {
    ironwood: ['Gather wood from sawmills'],
    eyrie: ['Add cards to decree', 'Choose new leader (if in turmoil)'],
    alliance: ['Revolt', 'Spread sympathy'],
    wanderer: ['Refresh 3 items']
  },
  daylight: {
    ironwood: ['Battle', 'March', 'Build', 'Recruit', 'Overwork'],
    eyrie: ['Resolve decree (Recruit → Move → Battle → Build)'],
    alliance: ['Craft', 'Mobilize', 'Train'],
    wanderer: ['Move', 'Explore', 'Battle', 'Strike', 'Aid', 'Quest', 'Craft', 'Repair']
  },
  evening: {
    ironwood: ['Draw cards (1 + workshops ruled, max 5)'],
    eyrie: ['Score VP based on roosts'],
    alliance: ['Military operations (equal to officers)'],
    wanderer: ['Draw card (or rest if in forest)']
  }
}

export default function ActionPanel({ phase, faction, factionState }) {
  const { 
    selectedClearing, 
    moveWarriors, 
    battle, 
    build, 
    recruit, 
    endPhase, 
    endTurn,
    selectAction,
    selectedAction
  } = useGameStore()
  
  const [moveCount, setMoveCount] = useState(1)
  const [targetClearing, setTargetClearing] = useState('')
  const [buildingType, setBuildingType] = useState('sawmill')

  const phaseActions = PHASE_ACTIONS[phase]?.[faction] || []

  const handleMove = () => {
    if (selectedClearing && targetClearing) {
      moveWarriors(selectedClearing, parseInt(targetClearing), moveCount)
      setTargetClearing('')
    }
  }

  const handleBattle = (defender) => {
    if (selectedClearing) {
      battle(defender, selectedClearing)
    }
  }

  const handleBuild = () => {
    if (selectedClearing) {
      build(buildingType, selectedClearing)
    }
  }

  const handleRecruit = () => {
    if (selectedClearing) {
      recruit(selectedClearing, 1)
    }
  }

  return (
    <motion.div
      className="mt-4 glass rounded-xl p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg text-gold-400 capitalize">
          {phase} Phase
        </h3>
        <div className="flex gap-2">
          <button
            onClick={endPhase}
            className="px-4 py-2 bg-forest-600 hover:bg-forest-500 rounded-lg text-sm transition"
          >
            End Phase
          </button>
          <button
            onClick={endTurn}
            className="px-4 py-2 bg-gold-600 hover:bg-gold-500 rounded-lg text-sm text-forest-900 font-semibold transition"
          >
            End Turn
          </button>
        </div>
      </div>

      {/* Phase actions info */}
      <div className="mb-4 text-sm text-forest-300">
        <p className="mb-1">Available actions this phase:</p>
        <ul className="list-disc list-inside text-forest-400">
          {phaseActions.map((action, idx) => (
            <li key={idx}>{action}</li>
          ))}
        </ul>
      </div>

      {/* Action buttons */}
      {phase === 'daylight' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Move action */}
          <div className="bg-forest-800/50 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-forest-100 mb-2">Move</h4>
            <div className="space-y-2">
              <div className="flex gap-1">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={moveCount}
                  onChange={(e) => setMoveCount(parseInt(e.target.value) || 1)}
                  className="w-12 px-2 py-1 bg-forest-900 rounded text-sm"
                  placeholder="#"
                />
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={targetClearing}
                  onChange={(e) => setTargetClearing(e.target.value)}
                  className="flex-1 px-2 py-1 bg-forest-900 rounded text-sm"
                  placeholder="To #"
                />
              </div>
              <button
                onClick={handleMove}
                disabled={!selectedClearing || !targetClearing}
                className="w-full py-1.5 bg-faction-eyrie hover:bg-faction-eyrie/80 disabled:opacity-50 rounded text-sm transition"
              >
                Move
              </button>
            </div>
            {selectedClearing && (
              <p className="text-xs text-forest-500 mt-1">From clearing {selectedClearing}</p>
            )}
          </div>

          {/* Battle action */}
          <div className="bg-forest-800/50 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-forest-100 mb-2">Battle</h4>
            <div className="space-y-1">
              {['ironwood', 'eyrie', 'alliance', 'wanderer']
                .filter(f => f !== faction)
                .map(enemy => (
                  <button
                    key={enemy}
                    onClick={() => handleBattle(enemy)}
                    disabled={!selectedClearing}
                    className="w-full py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded text-sm capitalize transition"
                  >
                    vs {enemy}
                  </button>
                ))}
            </div>
          </div>

          {/* Build action (Ironwood) */}
          {faction === 'ironwood' && (
            <div className="bg-forest-800/50 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-forest-100 mb-2">Build</h4>
              <select
                value={buildingType}
                onChange={(e) => setBuildingType(e.target.value)}
                className="w-full px-2 py-1 bg-forest-900 rounded text-sm mb-2"
              >
                <option value="sawmill">Sawmill (🪵)</option>
                <option value="workshop">Workshop (🔧)</option>
                <option value="recruiter">Recruiter (🏠)</option>
              </select>
              <button
                onClick={handleBuild}
                disabled={!selectedClearing}
                className="w-full py-1.5 bg-faction-ironwood hover:bg-faction-ironwood/80 disabled:opacity-50 rounded text-sm transition"
              >
                Build
              </button>
            </div>
          )}

          {/* Recruit action */}
          <div className="bg-forest-800/50 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-forest-100 mb-2">Recruit</h4>
            <button
              onClick={handleRecruit}
              disabled={!selectedClearing}
              className="w-full py-1.5 bg-faction-alliance hover:bg-faction-alliance/80 disabled:opacity-50 rounded text-sm transition"
            >
              Add Warrior
            </button>
            {selectedClearing && (
              <p className="text-xs text-forest-500 mt-1">In clearing {selectedClearing}</p>
            )}
          </div>
        </div>
      )}

      {/* Faction state info */}
      {factionState && (
        <div className="mt-4 pt-4 border-t border-forest-700">
          <h4 className="text-sm text-forest-400 mb-2">Faction Resources</h4>
          <div className="flex flex-wrap gap-3 text-sm">
            {faction === 'ironwood' && (
              <>
                <span>🪵 Wood: {factionState.wood || 0}</span>
                <span>⚔️ Warriors: {factionState.warriors || 0}</span>
              </>
            )}
            {faction === 'eyrie' && (
              <>
                <span>🪺 Roosts: {factionState.roosts || 0}</span>
                <span>Leader: {factionState.currentLeader || 'None'}</span>
              </>
            )}
            {faction === 'alliance' && (
              <>
                <span>📜 Supporters: {factionState.supporters?.length || 0}</span>
                <span>👮 Officers: {factionState.officers || 0}</span>
              </>
            )}
            {faction === 'wanderer' && (
              <>
                <span>🎒 Items: {factionState.items?.satchel?.length || 0}</span>
                <span>Character: {factionState.character?.name || 'Unknown'}</span>
              </>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}
