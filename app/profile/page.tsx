'use client'

import { Protected } from '@/components/Protected'
import { UserProfileForm } from '@/components/UserProfileForm'
import Link from 'next/link'

export default function ProfilePage() {
  return (
    <Protected>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
              <p className="mt-1 text-sm text-gray-500">
                Update your profile information
              </p>
            </div>
            <UserProfileForm />
            <div className="mt-6 pt-6 border-t border-gray-200">
              <Link
                href="/settings"
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Go to Settings →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Protected>
  )
}

