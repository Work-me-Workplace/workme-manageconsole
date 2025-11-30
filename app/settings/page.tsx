'use client'

import { Protected } from '@/components/Protected'
import { useAuth } from '@/components/AuthProvider'
import { signOutUser } from '@/lib/firebase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SettingsPage() {
  const { session } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOutUser()
      router.push('/signin')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <Protected>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your account settings
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Account Information</h2>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{session.email || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{session.name || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">User ID</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono text-xs">{session.userId || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Firebase ID</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono text-xs">{session.firebaseId || 'N/A'}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Token Status</h2>
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-sm text-gray-600">
                    Token: {session.firebaseToken ? '✅ Active' : '❌ Not available'}
                  </p>
                  {session.hydratedAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Last hydrated: {new Date(session.hydratedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <Link
                  href="/profile"
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  ← Edit Profile
                </Link>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <button
                  onClick={handleSignOut}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Protected>
  )
}

