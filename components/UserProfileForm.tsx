'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import api from '@/lib/api'

export function UserProfileForm() {
  const { session, refreshSession } = useAuth()
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (session.userId) {
      loadUserData()
    }
  }, [session.userId])

  const loadUserData = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/user/get')
      if (response.data.success) {
        const user = response.data.user
        setName(user.name || '')
        setTitle(user.title || '')
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to load user data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSaving(true)

    try {
      const response = await api.post('/api/user/update', {
        name: name || undefined,
        title: title || undefined,
      })

      if (response.data.success) {
        setSuccess(true)
        await refreshSession()
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          Profile updated successfully!
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={session.email || ''}
          disabled
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
        />
        <p className="mt-1 text-sm text-gray-500">Email is managed by Firebase</p>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Software Engineer"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={saving}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  )
}
