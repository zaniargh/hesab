import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-utils/middleware'
import { prisma } from '@/lib/db/prisma'

// POST /api/receipts/[id]/needs-follow-up - علامت‌گذاری نیاز به پیگیری
export const POST = withAuth(async (request: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
  if (user.type !== 'customer') {
    return NextResponse.json(
      { error: 'فقط مشتریان می‌توانند فیش را علامت‌گذاری کنند' },
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

    // بررسی دسترسی - فقط گیرنده می‌تواند علامت‌گذاری کند
    const transaction = receipt.account.transaction
    if (transaction.toCustomerId !== user.userId) {
      return NextResponse.json(
        { error: 'فقط گیرنده می‌تواند فیش را علامت‌گذاری کند' },
        { status: 403 }
      )
    }

    // علامت‌گذاری فیش
    const updatedReceipt = await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        status: 'needs_follow_up',
      },
    })

    return NextResponse.json({ receipt: updatedReceipt })
  } catch (error) {
    console.error('Mark needs follow up error:', error)
    return NextResponse.json(
      { error: 'خطای سرور رخ داد' },
      { status: 500 }
    )
  }
})
