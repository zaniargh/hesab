import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-utils/middleware'
import { prisma } from '@/lib/db/prisma'

// GET /api/connections - لیست ارتباطات مشتری
export const GET = withAuth(async (request: NextRequest, user) => {
  if (user.type !== 'customer') {
    return NextResponse.json(
      { error: 'فقط مشتریان می‌توانند ارتباطات خود را ببینند' },
      { status: 403 }
    )
  }

  try {
    const connections = await prisma.customerConnection.findMany({
      where: { ownerId: user.userId },
      include: {
        connectedCustomer: {
          select: {
            id: true,
            name: true,
            username: true,
            uniqueCode: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ connections })
  } catch (error) {
    console.error('Get connections error:', error)
    return NextResponse.json(
      { error: 'خطای سرور رخ داد' },
      { status: 500 }
    )
  }
})
