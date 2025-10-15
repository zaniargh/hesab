import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyPassword } from '@/lib/auth-utils/password'
import { signJWT } from '@/lib/auth-utils/jwt'
import { setAuthCookie } from '@/lib/auth-utils/cookies'
import { loginSchema } from '@/lib/validations/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation
    const validationResult = loginSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'داده‌های ورودی نامعتبر است', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { username, password } = validationResult.data

    // بررسی Admin
    const admin = await prisma.admin.findUnique({
      where: { username },
    })

    if (admin && await verifyPassword(password, admin.password)) {
      const token = await signJWT({
        userId: admin.id,
        type: 'admin',
        username: admin.username,
      })

      await setAuthCookie(token)

      return NextResponse.json({
        success: true,
        user: {
          id: admin.id,
          username: admin.username,
          type: 'admin',
        },
      })
    }

    // بررسی Customer
    const customer = await prisma.customer.findUnique({
      where: { username },
    })

    if (customer && await verifyPassword(password, customer.password)) {
      const token = await signJWT({
        userId: customer.id,
        type: 'customer',
        username: customer.username,
      })

      await setAuthCookie(token)

      return NextResponse.json({
        success: true,
        user: {
          id: customer.id,
          username: customer.username,
          name: customer.name,
          uniqueCode: customer.uniqueCode,
          type: 'customer',
        },
      })
    }

    return NextResponse.json(
      { error: 'نام کاربری یا رمز عبور اشتباه است' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'خطای سرور رخ داد' },
      { status: 500 }
    )
  }
}
