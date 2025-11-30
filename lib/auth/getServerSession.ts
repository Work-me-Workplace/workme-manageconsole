/**
 * Server-side session verification
 * 
 * Verifies Firebase token from request headers and returns user session
 */

import { headers } from 'next/headers'
import { getAdminAuth } from '@/lib/firebase/server'
import { prisma } from '@/lib/prisma'

export interface ServerSession {
  userId: string
  firebaseId: string
  email: string
  name: string | null
  photoUrl: string | null
  companyId: string | null
}

/**
 * Verify Firebase token and return user session
 * Returns null if token is invalid or missing
 */
export async function getServerSession(): Promise<ServerSession | null> {
  try {
    const headersList = await headers()
    const authHeader = headersList.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.replace('Bearer ', '')
    const decodedToken = await getAdminAuth().verifyIdToken(token)

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { firebaseId: decodedToken.uid },
      include: { company: true },
    })

    if (!user) {
      return null
    }

    return {
      userId: user.id,
      firebaseId: user.firebaseId,
      email: user.email,
      name: user.name,
      photoUrl: user.photoUrl,
      companyId: user.companyId,
    }
  } catch (error) {
    console.error('[getServerSession] Error:', error)
    return null
  }
}

/**
 * Verify Firebase token and throw if invalid
 * Use this for protected routes that require authentication
 */
export async function requireAuth(): Promise<ServerSession> {
  const session = await getServerSession()
  if (!session) {
    throw new Error('Unauthorized: Authentication required')
  }
  return session
}

