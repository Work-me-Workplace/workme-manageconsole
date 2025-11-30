'use client'

import { Protected } from '@/components/Protected'
import { CompanySelector } from '@/components/CompanySelector'
import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import api from '@/lib/api'

export default function CompanyPage() {
  const { session, refreshSession } = useAuth()
  const [companyId, setCompanyId] = useState<string | null>(session.companyId)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSave = async () => {
    setError(null)
    setSuccess(false)
    setSaving(true)

    try {
      const response = await api.post('/api/user/update', {
        companyId: companyId,
      })

      if (response.data.success) {
        setSuccess(true)
        await refreshSession()
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update company')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Protected>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Company</h1>
              <p className="mt-1 text-sm text-gray-500">
                Select or create your company
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                Company updated successfully!
              </div>
            )}

            <div className="space-y-6">
              <CompanySelector value={companyId} onChange={setCompanyId} />

              <div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Company'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Protected>
  )
}

