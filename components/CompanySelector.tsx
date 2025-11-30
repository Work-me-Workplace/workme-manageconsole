'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'

interface Company {
  id: string
  name: string
  domain?: string | null
  industry?: string | null
  size?: string | null
  logoUrl?: string | null
}

interface CompanySelectorProps {
  value?: string | null
  onChange: (companyId: string | null) => void
  onCreateNew?: (name: string, domain?: string) => Promise<string>
}

export function CompanySelector({ value, onChange, onCreateNew }: CompanySelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState('')
  const [newCompanyDomain, setNewCompanyDomain] = useState('')
  const [creating, setCreating] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  const loadCompany = useCallback(async (companyId: string) => {
    try {
      const response = await api.post('/api/company/get', { companyId })
      if (response.data.success) {
        const company = response.data.company
        setSelectedCompany(company)
        setSearchQuery(company.name)
      }
    } catch (error) {
      console.error('Error loading company:', error)
    }
  }, [])

  // Load selected company when value changes
  useEffect(() => {
    if (value) {
      loadCompany(value)
    } else {
      setSelectedCompany(null)
      setSearchQuery('')
    }
  }, [value, loadCompany])

  const searchCompanies = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.post('/api/company/search', {
        query: searchQuery,
      })
      if (response.data.success) {
        setCompanies(response.data.companies)
      }
    } catch (error) {
      console.error('Error searching companies:', error)
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  useEffect(() => {
    if (searchQuery.length >= 2 && searchQuery !== selectedCompany?.name) {
      searchCompanies()
    } else if (searchQuery.length < 2) {
      setCompanies([])
    }
  }, [searchQuery, selectedCompany, searchCompanies])

  const searchCompanies = async () => {
    setLoading(true)
    try {
      const response = await api.post('/api/company/search', {
        query: searchQuery,
      })
      if (response.data.success) {
        setCompanies(response.data.companies)
      }
    } catch (error) {
      console.error('Error searching companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) return

    setCreating(true)
    try {
      const response = await api.post('/api/company/create', {
        name: newCompanyName,
        domain: newCompanyDomain || undefined,
      })

      if (response.data.success) {
        const companyId = response.data.company.id
        onChange(companyId)

        // Trigger enrichment
        try {
          await api.post('/api/company/enrich', {
            companyId,
          })
        } catch (error) {
          console.error('Error enriching company:', error)
          // Don't fail the whole flow if enrichment fails
        }

        setShowCreate(false)
        setNewCompanyName('')
        setNewCompanyDomain('')
      }
    } catch (error: any) {
      console.error('Error creating company:', error)
      alert(error.response?.data?.error || 'Failed to create company')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Company
      </label>
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for company..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        {loading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
          </div>
        )}
      </div>

      {selectedCompany && searchQuery === selectedCompany.name && (
        <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
          <div className="font-medium">{selectedCompany.name}</div>
          {selectedCompany.domain && (
            <div className="text-sm text-gray-500">{selectedCompany.domain}</div>
          )}
        </div>
      )}

      {companies.length > 0 && (
        <div className="border border-gray-200 rounded-md max-h-48 overflow-y-auto">
          {companies.map((company) => (
            <button
              key={company.id}
              type="button"
              onClick={() => {
                onChange(company.id)
                setSelectedCompany(company)
                setSearchQuery(company.name)
                setCompanies([])
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
            >
              <div className="font-medium">{company.name}</div>
              {company.domain && (
                <div className="text-sm text-gray-500">{company.domain}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {searchQuery.length >= 2 && companies.length === 0 && !loading && (
        <div className="text-sm text-gray-500">
          No companies found.{' '}
          <button
            type="button"
            onClick={() => {
              setShowCreate(true)
              setNewCompanyName(searchQuery)
            }}
            className="text-indigo-600 hover:text-indigo-500"
          >
            Create new company
          </button>
        </div>
      )}

      {showCreate && (
        <div className="border border-gray-200 rounded-md p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name
            </label>
            <input
              type="text"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Company name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Domain (optional)
            </label>
            <input
              type="text"
              value={newCompanyDomain}
              onChange={(e) => setNewCompanyDomain(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="example.com"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreateCompany}
              disabled={creating || !newCompanyName.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreate(false)
                setNewCompanyName('')
                setNewCompanyDomain('')
              }}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

