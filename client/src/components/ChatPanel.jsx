import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'

export default function ChatPanel({ messages, onClose }) {
  const { sendMessage } = useGameStore()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (e) => {
    e.preventDefault()
    if (input.trim()) {
      sendMessage(input.trim())
      setInput('')
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-forest-700 flex justify-between items-center">
        <h2 className="font-display text-lg text-gold-400">Chat</h2>
        <button
          onClick={onClose}
          className="text-forest-400 hover:text-forest-200"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <p className="text-center text-forest-500 text-sm py-8">
            No messages yet. Say hello!
          </p>
        ) : (
          messages.map((msg, idx) => (
            <motion.div
              key={idx}
              className="bg-forest-800/50 rounded-lg p-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex justify-between items-start">
                <span className="text-sm font-semibold text-forest-100">
                  {msg.username}
                </span>
                <span className="text-xs text-forest-500">
                  {new Date(msg.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              <p className="text-sm text-forest-300 mt-1">{msg.message}</p>
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-forest-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-forest-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-4 py-2 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 rounded-lg text-forest-900 font-semibold transition"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
