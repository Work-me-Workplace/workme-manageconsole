import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/firebase/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
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

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { firebaseId: decodedToken.uid },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        firebaseId: user.firebaseId,
        email: user.email,
        name: user.name,
        photoUrl: user.photoUrl,
        title: user.title,
        companyUnit: user.companyUnit,
        companyDivision: user.companyDivision,
      },
    })
  } catch (error: any) {
    console.error('[API /user/get] Error:', error)

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

