import { create } from 'zustand'

const API_URL = import.meta.env.PROD ? '/api' : '/api'

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('woodland_token'),
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  
  checkAuth: async () => {
    const token = get().token
    if (!token) return
    
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        set({ user: data.user })
      } else {
        localStorage.removeItem('woodland_token')
        set({ token: null, user: null })
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }
      
      localStorage.setItem('woodland_token', data.token)
      set({ user: data.user, token: data.token, isLoading: false })
      return data
    } catch (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  register: async (username, email, password) => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
        credentials: 'include'
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed')
      }
      
      localStorage.setItem('woodland_token', data.token)
      set({ user: data.user, token: data.token, isLoading: false })
      return data
    } catch (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  guestLogin: async () => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch(`${API_URL}/auth/guest`, {
        method: 'POST',
        credentials: 'include'
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Guest login failed')
      }
      
      localStorage.setItem('woodland_token', data.token)
      set({ user: data.user, token: data.token, isLoading: false })
      return data
    } catch (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  logout: async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      })
    } catch (e) {
      // Ignore logout errors
    }
    
    localStorage.removeItem('woodland_token')
    set({ user: null, token: null })
  }
}))
