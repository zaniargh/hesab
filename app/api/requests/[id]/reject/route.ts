import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-utils/middleware'
import { prisma } from '@/lib/db/prisma'

// POST /api/requests/[id]/reject - رد کردن درخواست
export const POST = withAuth(async (request: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
  if (user.type !== 'customer') {
    return NextResponse.json(
      { error: 'فقط مشتریان می‌توانند درخواست‌ها را رد کنند' },
      { status: 403 }
    )
  }

  try {
    const { id } = await params

    // پیدا کردن درخواست
    const customerRequest = await prisma.customerRequest.findUnique({
      where: { id },
    })

    if (!customerRequest) {
      return NextResponse.json(
        { error: 'درخواست یافت نشد' },
        { status: 404 }
      )
    }

    // بررسی اینکه درخواست برای کاربر فعلی است
    if (customerRequest.toCustomerId !== user.userId) {
      return NextResponse.json(
        { error: 'شما مجاز به رد این درخواست نیستید' },
        { status: 403 }
      )
    }

    if (customerRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'این درخواست قبلاً پردازش شده است' },
        { status: 400 }
      )
    }

    // آپدیت وضعیت درخواست
    await prisma.customerRequest.update({
      where: { id },
      data: { status: 'rejected' },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reject request error:', error)
    return NextResponse.json(
      { error: 'خطای سرور رخ داد' },
      { status: 500 }
    )
  }
})
