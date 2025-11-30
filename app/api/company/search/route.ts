import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminAuth } from '@/lib/firebase/server'
import { prisma } from '@/lib/prisma'

const searchSchema = z.object({
  query: z.string().min(1),
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
    const validated = searchSchema.parse(body)

    // Search companies by name (case-insensitive)
    const companies = await prisma.company.findMany({
      where: {
        name: {
          contains: validated.query,
          mode: 'insensitive',
        },
      },
      take: 20,
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        domain: true,
        industry: true,
        size: true,
        logoUrl: true,
      },
    })

    return NextResponse.json({
      success: true,
      companies,
    })
  } catch (error: any) {
    console.error('[API /company/search] Error:', error)

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

