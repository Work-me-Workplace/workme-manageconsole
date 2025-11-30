import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminAuth } from '@/lib/firebase/server'
import { prisma } from '@/lib/prisma'

const updateUserSchema = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  photoUrl: z.string().url().optional().nullable(),
  companyId: z.string().optional().nullable(),
  division: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
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
    const validated = updateUserSchema.parse(body)

    // Build update object (only include defined fields)
    const updateData: any = {}
    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.title !== undefined) updateData.title = validated.title
    if (validated.photoUrl !== undefined) updateData.photoUrl = validated.photoUrl
    if (validated.companyId !== undefined) updateData.companyId = validated.companyId
    if (validated.division !== undefined) updateData.division = validated.division
    if (validated.unit !== undefined) updateData.unit = validated.unit

    // Update user
    const user = await prisma.user.update({
      where: { firebaseId: decodedToken.uid },
      data: updateData,
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
    console.error('[API /user/update] Error:', error)

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

