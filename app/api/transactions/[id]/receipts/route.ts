import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-utils/middleware'
import { prisma } from '@/lib/db/prisma'
import { receiptSchema } from '@/lib/validations/transaction'

// POST /api/transactions/[id]/receipts - اضافه کردن فیش واریز
export const POST = withAuth(async (request: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
  if (user.type !== 'customer') {
    return NextResponse.json(
      { error: 'فقط مشتریان می‌توانند فیش اضافه کنند' },
      { status: 403 }
    )
  }

  try {
    const { id: transactionId } = await params
    const body = await request.json()
    const { accountId, ...receiptData } = body

    // Validation
    const validationResult = receiptSchema.safeParse(receiptData)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'داده‌های ورودی نامعتبر است', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    // بررسی وجود تراکنش و دسترسی
    const transaction = await prisma.customerTransaction.findUnique({
      where: { id: transactionId },
      include: {
        accounts: true,
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'تراکنش یافت نشد' },
        { status: 404 }
      )
    }

    if (transaction.fromCustomerId !== user.userId && transaction.toCustomerId !== user.userId) {
      return NextResponse.json(
        { error: 'شما به این تراکنش دسترسی ندارید' },
        { status: 403 }
      )
    }

    // بررسی وجود حساب بانکی
    const account = transaction.accounts.find(acc => acc.id === accountId)
    if (!account) {
      return NextResponse.json(
        { error: 'حساب بانکی یافت نشد' },
        { status: 404 }
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

    // ایجاد فیش
    const receipt = await prisma.receipt.create({
      data: {
        accountId,
        ...validationResult.data,
        submittedBy: user.userId,
        submittedByName: currentUser.name,
        status: 'pending',
      },
    })

    return NextResponse.json({ receipt }, { status: 201 })
  } catch (error) {
    console.error('Create receipt error:', error)
    return NextResponse.json(
      { error: 'خطای سرور رخ داد' },
      { status: 500 }
    )
  }
})
