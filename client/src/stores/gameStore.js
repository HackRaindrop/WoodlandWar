import { create } from 'zustand'
import { io } from 'socket.io-client'

let socket = null

export const useGameStore = create((set, get) => ({
  gameState: null,
  lobbyState: null,
  connected: false,
  messages: [],
  selectedClearing: null,
  selectedAction: null,
  error: null,

  // Socket connection
  connect: () => {
    if (socket?.connected) return

    socket = io({
      withCredentials: true
    })

    socket.on('connect', () => {
      set({ connected: true })
      console.log('Socket connected')
    })

    socket.on('disconnect', () => {
      set({ connected: false })
      console.log('Socket disconnected')
    })

    socket.on('game:state', (state) => {
      set({ gameState: state })
    })

    socket.on('player:joined', (data) => {
      console.log('Player joined:', data.username)
    })

    socket.on('player:connected', (data) => {
      console.log('Player connected:', data.username)
    })

    socket.on('player:disconnected', (data) => {
      console.log('Player disconnected:', data.username)
    })

    socket.on('faction:selected', (data) => {
      console.log('Faction selected:', data)
    })

    socket.on('player:ready', (data) => {
      console.log('Player ready:', data)
    })

    socket.on('game:started', (data) => {
      set({ gameState: data.state })
    })

    socket.on('game:action_result', (result) => {
      console.log('Action result:', result)
    })

    socket.on('game:ended', (data) => {
      console.log('Game ended:', data)
    })

    socket.on('chat:message', (msg) => {
      set((state) => ({
        messages: [...state.messages, msg]
      }))
    })

    socket.on('error', (err) => {
      set({ error: err.message })
      console.error('Socket error:', err)
    })

    socket.on('lobby:expired', (data) => {
      console.log('Lobby expired:', data.message)
      set({ error: 'Lobby closed due to inactivity', gameState: null })
    })
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect()
      socket = null
    }
    set({ connected: false, gameState: null })
  },

  // Join a game room
  joinGame: (code) => {
    const attemptJoin = () => {
      if (socket?.connected) {
        socket.emit('game:join', { code })
      } else {
        // Wait for connection and try again
        socket?.once('connect', () => {
          socket.emit('game:join', { code })
        })
      }
    }

    if (!socket) {
      get().connect()
      // Socket was just created, wait for connection
      setTimeout(attemptJoin, 100)
    } else {
      attemptJoin()
    }
  },

  // Leave game room
  leaveGame: () => {
    socket?.emit('game:leave')
    set({ gameState: null, messages: [] })
  },

  // Game actions
  sendAction: (action, data) => {
    socket?.emit('game:action', { action, data })
  },

  // Specific actions
  moveWarriors: (from, to, count) => {
    get().sendAction('move', { from, to, count })
  },

  battle: (defender, clearing) => {
    get().sendAction('battle', { defender, clearing })
  },

  build: (buildingType, clearing) => {
    get().sendAction('build', { buildingType, clearing })
  },

  recruit: (clearing, count) => {
    get().sendAction('recruit', { clearing, count })
  },

  endPhase: () => {
    get().sendAction('end_phase', {})
  },

  endTurn: () => {
    get().sendAction('end_turn', {})
  },

  // Chat
  sendMessage: (message) => {
    socket?.emit('chat:message', { message })
  },

  // UI state
  selectClearing: (clearingId) => {
    set({ selectedClearing: clearingId })
  },

  selectAction: (action) => {
    set({ selectedAction: action })
  },

  clearError: () => {
    set({ error: null })
  }
}))
