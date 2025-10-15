import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-utils/middleware'
import { prisma } from '@/lib/db/prisma'

// POST /api/receipts/[id]/approve - تایید فیش
export const POST = withAuth(async (request: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
  if (user.type !== 'customer') {
    return NextResponse.json(
      { error: 'فقط مشتریان می‌توانند فیش تایید کنند' },
      { status: 403 }
    )
  }

  try {
    const { id: receiptId } = await params

    // پیدا کردن فیش
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      include: {
        account: {
          include: {
            transaction: true,
          },
        },
      },
    })

    if (!receipt) {
      return NextResponse.json(
        { error: 'فیش یافت نشد' },
        { status: 404 }
      )
    }

    // بررسی دسترسی - فقط گیرنده می‌تواند تایید کند
    const transaction = receipt.account.transaction
    if (transaction.toCustomerId !== user.userId) {
      return NextResponse.json(
        { error: 'فقط گیرنده می‌تواند فیش را تایید کند' },
        { status: 403 }
      )
    }

    // دریافت اطلاعات کاربر فعلی
    const currentUser = await prisma.customer.findUnique({
      where: { id: user.userId },
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'خطا در یافتن اطلاعات شما' },
        { status: 500 }
      )
    }

    // تایید فیش
    const updatedReceipt = await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        status: 'approved',
        approvedBy: {
          push: user.userId,
        },
      },
    })

    return NextResponse.json({ receipt: updatedReceipt })
  } catch (error) {
    console.error('Approve receipt error:', error)
    return NextResponse.json(
      { error: 'خطای سرور رخ داد' },
      { status: 500 }
    )
  }
})
