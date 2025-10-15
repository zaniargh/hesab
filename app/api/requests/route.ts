import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-utils/middleware'
import { prisma } from '@/lib/db/prisma'
import { createConnectionRequestSchema } from '@/lib/validations/connection'

// GET /api/requests - لیست درخواست‌های ارتباط
export const GET = withAuth(async (request: NextRequest, user) => {
  if (user.type !== 'customer') {
    return NextResponse.json(
      { error: 'فقط مشتریان می‌توانند درخواست‌های خود را ببینند' },
      { status: 403 }
    )
  }

  try {
    // درخواست‌های دریافتی (که برای این مشتری ارسال شده)
    const receivedRequests = await prisma.customerRequest.findMany({
      where: {
        toCustomerId: user.userId,
        status: 'pending',
      },
      orderBy: { createdAt: 'desc' },
    })

    // درخواست‌های ارسالی (که این مشتری ارسال کرده)
    const sentRequests = await prisma.customerRequest.findMany({
      where: {
        fromCustomerId: user.userId,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      receivedRequests,
      sentRequests,
    })
  } catch (error) {
    console.error('Get requests error:', error)
    return NextResponse.json(
      { error: 'خطای سرور رخ داد' },
      { status: 500 }
    )
  }
})

// POST /api/requests - ایجاد درخواست ارتباط جدید
export const POST = withAuth(async (request: NextRequest, user) => {
  if (user.type !== 'customer') {
    return NextResponse.json(
      { error: 'فقط مشتریان می‌توانند درخواست ارتباط ایجاد کنند' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    
    // Validation
    const validationResult = createConnectionRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'داده‌های ورودی نامعتبر است', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { uniqueCode, customName } = validationResult.data

    // پیدا کردن مشتری با کد یکتا
    const toCustomer = await prisma.customer.findUnique({
      where: { uniqueCode },
    })

    if (!toCustomer) {
      return NextResponse.json(
        { error: 'مشتری با این کد یکتا یافت نشد' },
        { status: 404 }
      )
    }

    if (toCustomer.id === user.userId) {
      return NextResponse.json(
        { error: 'نمی‌توانید با خودتان ارتباط برقرار کنید' },
        { status: 400 }
      )
    }

    // بررسی ارتباط موجود
    const existingConnection = await prisma.customerConnection.findFirst({
      where: {
        ownerId: user.userId,
        connectedCustomerId: toCustomer.id,
      },
    })

    if (existingConnection) {
      return NextResponse.json(
        { error: 'این مشتری قبلاً به لیست شما اضافه شده است' },
        { status: 400 }
      )
    }

    // بررسی درخواست تکراری
    const existingRequest = await prisma.customerRequest.findFirst({
      where: {
        fromCustomerId: user.userId,
        toCustomerId: toCustomer.id,
        status: 'pending',
      },
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: 'درخواست قبلاً ارسال شده است' },
        { status: 400 }
      )
    }

    // دریافت اطلاعات کاربر فعلی
    const fromCustomer = await prisma.customer.findUnique({
      where: { id: user.userId },
    })

    if (!fromCustomer) {
      return NextResponse.json(
        { error: 'خطا در یافتن اطلاعات شما' },
        { status: 500 }
      )
    }

    // ایجاد درخواست
    const newRequest = await prisma.customerRequest.create({
      data: {
        fromCustomerId: user.userId,
        fromCustomerName: fromCustomer.name,
        toCustomerId: toCustomer.id,
        toCustomerName: toCustomer.name,
        customName,
        status: 'pending',
      },
    })

    return NextResponse.json({ request: newRequest }, { status: 201 })
  } catch (error) {
    console.error('Create request error:', error)
    return NextResponse.json(
      { error: 'خطای سرور رخ داد' },
      { status: 500 }
    )
  }
})
