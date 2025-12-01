/**
 * Apollo.io Company Enrichment Service
 * 
 * Fetches company data from Apollo.io API and maps it to our Company model
 */

export interface ApolloCompany {
  id: string
  name: string
  domain?: string
  website_url?: string
  linkedin_url?: string
  description?: string
  logo_url?: string

  industry?: string
  sub_industry?: string
  type?: string

  estimated_num_employees?: number
  employee_range?: string
  founded_year?: number
  revenue?: string

  location?: {
    city?: string
    state?: string
    country?: string
  }

  phone?: string
  twitter_url?: string
  facebook_url?: string
}

/**
 * Fetch company data from Apollo.io API
 * 
 * @param query - Search parameters (name, domain, or linkedinUrl)
 * @returns ApolloCompany object or null if not found
 */
export async function fetchApolloCompany(query: {
  name?: string
  domain?: string
  linkedinUrl?: string
}): Promise<ApolloCompany | null> {
  const apiKey = process.env.APOLLO_API_KEY

  if (!apiKey) {
    throw new Error('APOLLO_API_KEY environment variable is required')
  }

  // Build search query
  let searchQuery = ''
  if (query.domain) {
    searchQuery = `domain:${query.domain}`
  } else if (query.linkedinUrl) {
    // Extract company name or ID from LinkedIn URL if needed
    searchQuery = `linkedin_url:${query.linkedinUrl}`
  } else if (query.name) {
    searchQuery = `name:"${query.name}"`
  } else {
    throw new Error('At least one search parameter (name, domain, or linkedinUrl) is required')
  }

  try {
    // Apollo.io API endpoint for company search
    const url = `https://api.apollo.io/v1/mixed_companies/search`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify({
        q_keywords: searchQuery,
        page: 1,
        per_page: 1,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Apollo API error:', response.status, errorText)
      throw new Error(`Apollo API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    // Apollo returns companies in data.organizations or data.companies
    const companies = data.organizations || data.companies || []

    if (companies.length === 0) {
      return null
    }

    // Map Apollo response to our ApolloCompany interface
    const company = companies[0]
    
    return {
      id: company.id || company.apollo_id || '',
      name: company.name || '',
      domain: company.primary_domain || company.domain,
      website_url: company.website_url || company.website,
      linkedin_url: company.linkedin_url || company.linkedin_url,
      description: company.description || company.short_description,
      logo_url: company.logo_url || company.logo,
      industry: company.industry || company.industry_tag,
      sub_industry: company.sub_industry,
      type: company.type || company.company_type,
      estimated_num_employees: company.estimated_num_employees || company.num_employees,
      employee_range: company.employee_range,
      founded_year: company.founded_year,
      revenue: company.revenue,
      location: company.organization_raw_address
        ? {
            city: company.organization_raw_address.city,
            state: company.organization_raw_address.state,
            country: company.organization_raw_address.country,
          }
        : company.location
        ? {
            city: company.location.city,
            state: company.location.state,
            country: company.location.country,
          }
        : undefined,
      phone: company.phone || company.phone_number,
      twitter_url: company.twitter_url || company.twitter,
      facebook_url: company.facebook_url || company.facebook,
    }
  } catch (error: any) {
    console.error('Error fetching from Apollo API:', error)
    throw error
  }
}

/**
 * Map Apollo company data to our Company model fields
 * 
 * @param a - ApolloCompany object from Apollo API
 * @returns Object with fields ready for Prisma upsert
 */
export function mapApolloToCompanyFields(a: ApolloCompany) {
  return {
    apolloId: a.id,
    name: a.name,
    domain: a.domain ?? null,
    website: a.website_url ?? null,
    linkedinUrl: a.linkedin_url ?? null,
    description: a.description ?? null,
    logoUrl: a.logo_url ?? null,

    industry: a.industry ?? null,
    subIndustry: a.sub_industry ?? null,
    companyType: a.type ?? null,

    employeeCount: a.estimated_num_employees ?? null,
    employeeRange: a.employee_range ?? null,
    foundedYear: a.founded_year ?? null,
    revenue: a.revenue ?? null,

    hqCity: a.location?.city ?? null,
    hqState: a.location?.state ?? null,
    hqCountry: a.location?.country ?? null,

    phone: a.phone ?? null,
    twitterUrl: a.twitter_url ?? null,
    facebookUrl: a.facebook_url ?? null,

    enrichedAt: new Date(),
  }
}

