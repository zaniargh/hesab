import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-utils/middleware'
import { prisma } from '@/lib/db/prisma'

// POST /api/requests/[id]/accept - پذیرش درخواست
export const POST = withAuth(async (request: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
  if (user.type !== 'customer') {
    return NextResponse.json(
      { error: 'فقط مشتریان می‌توانند درخواست‌ها را پذیرش کنند' },
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
        { error: 'شما مجاز به پذیرش این درخواست نیستید' },
        { status: 403 }
      )
    }

    if (customerRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'این درخواست قبلاً پردازش شده است' },
        { status: 400 }
      )
    }

    // استفاده از transaction برای اطمینان از ایجاد صحیح ارتباطات
    await prisma.$transaction(async (tx) => {
      // آپدیت وضعیت درخواست
      await tx.customerRequest.update({
        where: { id },
        data: { status: 'accepted' },
      })

      // ایجاد ارتباط دو طرفه
      // ارتباط برای گیرنده درخواست (کاربر فعلی)
      await tx.customerConnection.create({
        data: {
          ownerId: customerRequest.toCustomerId,
          connectedCustomerId: customerRequest.fromCustomerId,
          customName: customerRequest.customName,
        },
      })

      // ارتباط برای فرستنده درخواست
      await tx.customerConnection.create({
        data: {
          ownerId: customerRequest.fromCustomerId,
          connectedCustomerId: customerRequest.toCustomerId,
          customName: customerRequest.toCustomerName,
        },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Accept request error:', error)
    return NextResponse.json(
      { error: 'خطای سرور رخ داد' },
      { status: 500 }
    )
  }
})
