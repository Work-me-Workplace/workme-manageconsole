'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { auth } from '@/lib/firebase/client'

export default function SplashPage() {
  const router = useRouter()
  const { session, loading } = useAuth()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (loading) return

    // Check if user is authenticated
    if (auth?.currentUser || session.firebaseId) {
      router.push('/welcome')
    } else {
      router.push('/signin')
    }
    setChecking(false)
  }, [loading, session, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">WorkMe</h1>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

