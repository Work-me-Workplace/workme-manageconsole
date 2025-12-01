'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { auth } from '@/lib/firebase/client'

export default function SplashPage() {
  const router = useRouter()
  const { session, loading } = useAuth()

  useEffect(() => {
    // Small delay for splash effect (2000ms like workme-nextapp)
    const timer = setTimeout(() => {
      if (loading) return

      // Check if user is authenticated
      if (auth?.currentUser || session.firebaseId) {
        router.push('/welcome')
      } else {
        router.push('/signin')
      }
    }, 2000)

    return () => {
      clearTimeout(timer)
    }
  }, [loading, session, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">WorkMe Management Portal</h1>
      </div>
    </div>
  )
}

