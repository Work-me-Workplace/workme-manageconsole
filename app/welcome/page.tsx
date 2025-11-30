'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

export default function WelcomePage() {
  const router = useRouter()
  const { session, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    // If no session, redirect to signin
    if (!session.firebaseId) {
      router.push('/signin')
      return
    }

    // Check if profile is complete (has name and company)
    const isProfileComplete = session.name && session.companyId

    if (isProfileComplete) {
      // TODO: Redirect to /home when it's created
      router.push('/profile')
    } else {
      // Redirect to profile to complete setup
      router.push('/profile')
    }
  }, [loading, session, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to WorkMe</h1>
        <p className="text-gray-600">Setting up your account...</p>
      </div>
    </div>
  )
}

