'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { onAuthStateChanged, onIdTokenChanged, User } from 'firebase/auth'
import { auth } from '@/lib/firebase/client'
import api from '@/lib/api'

/**
 * Unified Session Object
 * Single source of truth for user authentication state
 */
export interface Session {
  userId: string | null
  firebaseId: string | null
  email: string | null
  name: string | null
  photoUrl: string | null
  firebaseToken: string | null
  hydratedAt: number | null
}

interface AuthContextType {
  session: Session
  loading: boolean
  error: string | null
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: {
    userId: null,
    firebaseId: null,
    email: null,
    name: null,
    photoUrl: null,
    firebaseToken: null,
    hydratedAt: null,
  },
  loading: true,
  error: null,
  refreshSession: async () => {},
})

/**
 * AuthProvider Component
 * 
 * - Listens to Firebase auth state changes
 * - Hydrates User data from database
 * - Manages unified session object
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>({
    userId: null,
    firebaseId: null,
    email: null,
    name: null,
    photoUrl: null,
    firebaseToken: null,
    hydratedAt: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Hydrate User from server
   */
  const hydrateSession = useCallback(async (firebaseUser: User) => {
    try {
      setLoading(true)
      setError(null)

      // Get token for session storage
      const token = await firebaseUser.getIdToken()

      // Call hydration endpoint (upsert user)
      const response = await api.post('/api/user/upsert', {
        firebaseId: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoUrl: firebaseUser.photoURL,
      })

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to hydrate session')
      }

      const { user } = response.data

      // Build unified session object
      const newSession: Session = {
        userId: user.id,
        firebaseId: firebaseUser.uid,
        email: firebaseUser.email || user.email,
        name: user.name || firebaseUser.displayName,
        photoUrl: user.photoUrl || firebaseUser.photoURL,
        firebaseToken: token,
        hydratedAt: Date.now(),
      }

      setSession(newSession)

      console.log('[AuthProvider] Session hydrated:', {
        userId: newSession.userId,
        email: newSession.email,
      })
    } catch (err: any) {
      console.error('[AuthProvider] Hydration error:', err)
      setError(err.message || 'Failed to hydrate session')
      
      // Clear session on error
      setSession({
        userId: null,
        firebaseId: null,
        email: null,
        name: null,
        photoUrl: null,
        firebaseToken: null,
        hydratedAt: null,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Clear session
   */
  const clearSession = useCallback(() => {
    setSession({
      userId: null,
      firebaseId: null,
      email: null,
      name: null,
      photoUrl: null,
      firebaseToken: null,
      hydratedAt: null,
    })
    setError(null)
  }, [])

  /**
   * Refresh session (re-hydrate)
   */
  const refreshSession = useCallback(async () => {
    if (!auth?.currentUser) {
      clearSession()
      return
    }
    await hydrateSession(auth.currentUser)
  }, [hydrateSession, clearSession])

  useEffect(() => {
    if (!auth) {
      console.warn('[AuthProvider] Firebase auth not initialized')
      setLoading(false)
      return
    }

    // Listen for auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        console.log('[AuthProvider] User signed out')
        clearSession()
        setLoading(false)
        return
      }

      console.log('[AuthProvider] Auth state changed, hydrating session:', firebaseUser.uid)
      await hydrateSession(firebaseUser)
    })

    // Listen for token refresh
    const unsubscribeToken = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('[AuthProvider] Token refreshed')
        // Get fresh token and update session
        const token = await firebaseUser.getIdToken()
        setSession((prev) => ({
          ...prev,
          firebaseToken: token,
        }))
      }
    })

    return () => {
      unsubscribeAuth()
      unsubscribeToken()
    }
  }, [auth, hydrateSession, clearSession])

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        error,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to access auth context
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

