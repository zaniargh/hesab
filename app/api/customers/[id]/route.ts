import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-utils/middleware'
import { prisma } from '@/lib/db/prisma'
import { updateCustomerSchema } from '@/lib/validations/auth'
import { hashPassword } from '@/lib/auth-utils/password'

// GET /api/customers/[id]
export const GET = withAuth(async (request: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params

    // مشتری فقط می‌تواند اطلاعات خودش را ببیند، admin همه را می‌بیند
    if (user.type === 'customer' && user.userId !== id) {
      return NextResponse.json(
        { error: 'شما فقط می‌توانید اطلاعات خودتان را ببینید' },
        { status: 403 }
      )
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
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

    if (!customer) {
      return NextResponse.json(
        { error: 'مشتری یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Get customer error:', error)
    return NextResponse.json(
      { error: 'خطای سرور رخ داد' },
      { status: 500 }
    )
  }
})

// PATCH /api/customers/[id] - ویرایش مشتری
export const PATCH = withAuth(async (request: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params

    // مشتری فقط می‌تواند اطلاعات خودش را ویرایش کند
    if (user.type === 'customer' && user.userId !== id) {
      return NextResponse.json(
        { error: 'شما فقط می‌توانید اطلاعات خودتان را ویرایش کنید' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validation
    const validationResult = updateCustomerSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'داده‌های ورودی نامعتبر است', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // بررسی یکتا بودن username (اگر تغییر کرده)
    if (data.username) {
      const existingUser = await prisma.customer.findFirst({
        where: {
          username: data.username,
          id: { not: id },
        },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'این نام کاربری قبلاً استفاده شده است' },
          { status: 400 }
        )
      }
    }

    // بررسی یکتا بودن uniqueCode (اگر تغییر کرده)
    if (data.uniqueCode) {
      const existingCode = await prisma.customer.findFirst({
        where: {
          uniqueCode: data.uniqueCode,
          id: { not: id },
        },
      })

      if (existingCode) {
        return NextResponse.json(
          { error: 'این کد یکتا قبلاً استفاده شده است' },
          { status: 400 }
        )
      }
    }

    // آماده‌سازی داده‌ها برای آپدیت
    const updateData: any = {}
    if (data.name) updateData.name = data.name
    if (data.username) updateData.username = data.username
    if (data.phone) updateData.phone = data.phone
    if (data.address) updateData.address = data.address
    if (data.uniqueCode) updateData.uniqueCode = data.uniqueCode
    if (data.preferredCurrency) updateData.preferredCurrency = data.preferredCurrency
    
    // Hash password if changed
    if (data.password) {
      updateData.password = await hashPassword(data.password)
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Update customer error:', error)
    return NextResponse.json(
      { error: 'خطای سرور رخ داد' },
      { status: 500 }
    )
  }
})

// DELETE /api/customers/[id] - حذف مشتری (فقط Admin)
export const DELETE = withAuth(async (request: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
  if (user.type !== 'admin') {
    return NextResponse.json(
      { error: 'فقط مدیر می‌تواند مشتری حذف کند' },
      { status: 403 }
    )
  }

  try {
    const { id } = await params

    await prisma.customer.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete customer error:', error)
    return NextResponse.json(
      { error: 'خطای سرور رخ داد' },
      { status: 500 }
    )
  }
})
