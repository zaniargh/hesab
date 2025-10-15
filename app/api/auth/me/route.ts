import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-utils/middleware'
import { prisma } from '@/lib/db/prisma'

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    if (user.type === 'admin') {
      const admin = await prisma.admin.findUnique({
        where: { id: user.userId },
        select: { id: true, username: true, createdAt: true },
      })

      if (!admin) {
        return NextResponse.json(
          { error: 'کاربر یافت نشد' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        user: {
          ...admin,
          type: 'admin',
        },
      })
    } else {
      const customer = await prisma.customer.findUnique({
        where: { id: user.userId },
        select: {
          id: true,
          username: true,
          name: true,
          phone: true,
          address: true,
          uniqueCode: true,
          preferredCurrency: true,
          createdAt: true,
        },
      })

      if (!customer) {
        return NextResponse.json(
          { error: 'کاربر یافت نشد' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        user: {
          ...customer,
          type: 'customer',
        },
      })
    }
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'خطای سرور رخ داد' },
      { status: 500 }
    )
  }
})
