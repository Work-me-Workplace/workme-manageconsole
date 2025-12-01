import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchApolloCompany, mapApolloToCompanyFields } from '@/lib/services/apollo'
import { getAdminAuth } from '@/lib/firebase/server'

/**
 * POST /api/company/enrich
 * 
 * Enriches company data from Apollo.io and upserts to database
 * 
 * Body: { name?, domain?, linkedinUrl? }
 * Returns: { success: true, company: Company }
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verify Auth
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    await getAdminAuth().verifyIdToken(token)

    // 2. Parse query
    const body = await req.json()
    const { name, domain, linkedinUrl } = body

    if (!name && !domain && !linkedinUrl) {
      return NextResponse.json(
        { error: 'Missing search parameter. Provide name, domain, or linkedinUrl' },
        { status: 400 }
      )
    }

    // 3. Call Apollo
    const apolloData = await fetchApolloCompany({ name, domain, linkedinUrl })

    if (!apolloData) {
      return NextResponse.json(
        { error: 'No company found in Apollo.io' },
        { status: 404 }
      )
    }

    // 4. Map fields
    const mapped = mapApolloToCompanyFields(apolloData)

    // 5. Upsert to DB
    // Use name as the unique identifier (since it's @unique in schema)
    // If apolloId exists, try to find by it first, otherwise use name
    let company
    
    // Try to find existing company by apolloId if available
    if (mapped.apolloId) {
      const existingByApollo = await prisma.company.findFirst({
        where: { apolloId: mapped.apolloId },
      })
      
      if (existingByApollo) {
        // Update existing company found by apolloId
        company = await prisma.company.update({
          where: { id: existingByApollo.id },
          data: mapped,
        })
      } else {
        // Try to find by name (unique constraint)
        company = await prisma.company.upsert({
          where: { name: mapped.name },
          create: mapped,
          update: mapped,
        })
      }
    } else {
      // No apolloId, use name as unique identifier
      company = await prisma.company.upsert({
        where: { name: mapped.name },
        create: mapped,
        update: mapped,
      })
    }

    return NextResponse.json({ success: true, company })
  } catch (err: any) {
    console.error('[API /company/enrich] Error:', err)

    // Handle specific error types
    if (err.message?.includes('APOLLO_API_KEY')) {
      return NextResponse.json(
        { error: 'Apollo API key not configured' },
        { status: 500 }
      )
    }

    if (err.message?.includes('Unauthorized') || err.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    )
  }
}

