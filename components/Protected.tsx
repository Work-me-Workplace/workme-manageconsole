'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'

export function Protected({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { session, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    if (!session.firebaseId) {
      router.push('/signin')
    }
  }, [loading, session, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session.firebaseId) {
    return null
  }

  return <>{children}</>
}

