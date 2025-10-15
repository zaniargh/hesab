import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-utils/middleware'
import { prisma } from '@/lib/db/prisma'
import { registerCustomerSchema } from '@/lib/validations/auth'
import { hashPassword } from '@/lib/auth-utils/password'
import { v4 as uuidv4 } from 'uuid'

// GET /api/customers - لیست مشتریان (فقط Admin)
export const GET = withAuth(async (request: NextRequest, user) => {
  if (user.type !== 'admin') {
    return NextResponse.json(
      { error: 'فقط مدیر می‌تواند لیست مشتریان را ببیند' },
      { status: 403 }
    )
  }

  try {
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        phone: true,
        address: true,
        uniqueCode: true,
        preferredCurrency: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ customers })
  } catch (error) {
    console.error('Get customers error:', error)
    return NextResponse.json(
      { error: 'خطای سرور رخ داد' },
      { status: 500 }
    )
  }
})

// POST /api/customers - ایجاد مشتری جدید (فقط Admin)
export const POST = withAuth(async (request: NextRequest, user) => {
  if (user.type !== 'admin') {
    return NextResponse.json(
      { error: 'فقط مدیر می‌تواند مشتری جدید ایجاد کند' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    
    // Validation
    const validationResult = registerCustomerSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'داده‌های ورودی نامعتبر است', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // بررسی یکتا بودن username
    const existingUser = await prisma.customer.findUnique({
      where: { username: data.username },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'این نام کاربری قبلاً استفاده شده است' },
        { status: 400 }
      )
    }

    // تولید کد یکتا
    const uniqueCode = data.uniqueCode || `ZAN-${uuidv4().substring(0, 8).toUpperCase()}`

    // بررسی یکتا بودن uniqueCode
    const existingCode = await prisma.customer.findUnique({
      where: { uniqueCode },
    })

    if (existingCode) {
      return NextResponse.json(
        { error: 'این کد یکتا قبلاً استفاده شده است' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password)

    // ایجاد مشتری
    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        username: data.username,
        password: hashedPassword,
        phone: data.phone,
        address: data.address,
        uniqueCode,
        preferredCurrency: data.preferredCurrency || 'تومان',
      },
      select: {
        id: true,
        name: true,
        username: true,
        phone: true,
        address: true,
        uniqueCode: true,
        preferredCurrency: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ customer }, { status: 201 })
  } catch (error) {
    console.error('Create customer error:', error)
    return NextResponse.json(
      { error: 'خطای سرور رخ داد' },
      { status: 500 }
    )
  }
})
