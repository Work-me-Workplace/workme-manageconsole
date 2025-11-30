/**
 * Get Firebase ID Token - CLIENT ONLY
 * 
 * Utility to get current user's Firebase ID token
 */

'use client'

import { auth } from './client'

export async function getIdToken(): Promise<string | null> {
  if (!auth?.currentUser) {
    return null
  }

  try {
    return await auth.currentUser.getIdToken()
  } catch (error) {
    console.error('[getIdToken] Error getting token:', error)
    return null
  }
}

