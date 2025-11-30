import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminAuth } from '@/lib/firebase/server'
import { prisma } from '@/lib/prisma'

const enrichCompanySchema = z.object({
  companyId: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    // Verify Firebase token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Missing token' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    await getAdminAuth().verifyIdToken(token)

    // Parse and validate request body
    const body = await request.json()
    const validated = enrichCompanySchema.parse(body)

    // Get company
    const company = await prisma.company.findUnique({
      where: { id: validated.companyId },
    })

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      )
    }

    // TODO: Integrate with Apollo API for enrichment
    // For now, just mark as enriched with current timestamp
    const enriched = await prisma.company.update({
      where: { id: validated.companyId },
      data: {
        enrichedAt: new Date(),
        // Apollo enrichment fields would go here:
        // apolloId: apolloData.id,
        // industry: apolloData.industry,
        // size: apolloData.size,
        // logoUrl: apolloData.logoUrl,
      },
    })

    return NextResponse.json({
      success: true,
      company: {
        id: enriched.id,
        name: enriched.name,
        domain: enriched.domain,
        apolloId: enriched.apolloId,
        industry: enriched.industry,
        size: enriched.size,
        logoUrl: enriched.logoUrl,
        enrichedAt: enriched.enrichedAt,
      },
    })
  } catch (error: any) {
    console.error('[API /company/enrich] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { success: false, error: 'Token expired. Please sign in again.' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

