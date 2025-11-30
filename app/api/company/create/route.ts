import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminAuth } from '@/lib/firebase/server'
import { prisma } from '@/lib/prisma'

const createCompanySchema = z.object({
  name: z.string().min(1),
  domain: z.string().optional().nullable(),
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
    const validated = createCompanySchema.parse(body)

    // Check if company already exists
    const existing = await prisma.company.findFirst({
      where: {
        OR: [
          { name: { equals: validated.name, mode: 'insensitive' } },
          ...(validated.domain ? [{ domain: validated.domain }] : []),
        ],
      },
    })

    if (existing) {
      return NextResponse.json({
        success: true,
        company: {
          id: existing.id,
          name: existing.name,
          domain: existing.domain,
          industry: existing.industry,
          size: existing.size,
          logoUrl: existing.logoUrl,
        },
        alreadyExists: true,
      })
    }

    // Create new company
    const company = await prisma.company.create({
      data: {
        name: validated.name,
        domain: validated.domain || null,
      },
    })

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        domain: company.domain,
        industry: company.industry,
        size: company.size,
        logoUrl: company.logoUrl,
      },
      alreadyExists: false,
    })
  } catch (error: any) {
    console.error('[API /company/create] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Company with this name or domain already exists' },
        { status: 409 }
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

