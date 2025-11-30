import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminAuth } from '@/lib/firebase/server'
import { prisma } from '@/lib/prisma'

const upsertUserSchema = z.object({
  firebaseId: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  photoUrl: z.string().url().optional().nullable(),
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
    const decodedToken = await getAdminAuth().verifyIdToken(token)

    // Parse and validate request body
    const body = await request.json()
    const validated = upsertUserSchema.parse(body)

    // Verify that the firebaseId matches the token
    if (validated.firebaseId !== decodedToken.uid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Token does not match firebaseId' },
        { status: 403 }
      )
    }

    // Upsert user
    const user = await prisma.user.upsert({
      where: { firebaseId: validated.firebaseId },
      update: {
        email: validated.email,
        name: validated.displayName || undefined,
        photoUrl: validated.photoUrl || undefined,
      },
      create: {
        firebaseId: validated.firebaseId,
        email: validated.email,
        name: validated.displayName,
        photoUrl: validated.photoUrl,
      },
      include: {
        company: true,
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        firebaseId: user.firebaseId,
        email: user.email,
        name: user.name,
        photoUrl: user.photoUrl,
        title: user.title,
        companyId: user.companyId,
        division: user.division,
        unit: user.unit,
        company: user.company ? {
          id: user.company.id,
          name: user.company.name,
        } : null,
      },
    })
  } catch (error: any) {
    console.error('[API /user/upsert] Error:', error)

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

