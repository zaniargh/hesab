import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-utils/middleware'
import { prisma } from '@/lib/db/prisma'
import { createTransactionSchema } from '@/lib/validations/transaction'

// GET /api/transactions - لیست تراکنش‌ها
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    let transactions

    if (user.type === 'admin') {
      // Admin همه تراکنش‌ها را می‌بیند
      transactions = await prisma.customerTransaction.findMany({
        include: {
          fromCustomer: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          toCustomer: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          accounts: {
            include: {
              receipts: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    } else {
      // مشتری فقط تراکنش‌های خودش را می‌بیند
      transactions = await prisma.customerTransaction.findMany({
        where: {
          OR: [
            { fromCustomerId: user.userId },
            { toCustomerId: user.userId },
          ],
        },
        include: {
          fromCustomer: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          toCustomer: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          accounts: {
            include: {
              receipts: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    }

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('Get transactions error:', error)
    return NextResponse.json(
      { error: 'خطای سرور رخ داد' },
      { status: 500 }
    )
  }
})

// POST /api/transactions - ایجاد تراکنش جدید
export const POST = withAuth(async (request: NextRequest, user) => {
  if (user.type !== 'customer') {
    return NextResponse.json(
      { error: 'فقط مشتریان می‌توانند تراکنش ایجاد کنند' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    
    // Validation
    const validationResult = createTransactionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'داده‌های ورودی نامعتبر است', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { toCustomerId, description, type, declaredTotalAmount, accounts } = validationResult.data

    // بررسی وجود مشتری مقصد
    const toCustomer = await prisma.customer.findUnique({
      where: { id: toCustomerId },
    })

    if (!toCustomer) {
      return NextResponse.json(
        { error: 'مشتری مقصد یافت نشد' },
        { status: 404 }
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

    // ایجاد تراکنش با حساب‌های بانکی
    const transaction = await prisma.customerTransaction.create({
      data: {
        fromCustomerId: user.userId,
        fromCustomerName: fromCustomer.name,
        toCustomerId,
        toCustomerName: toCustomer.name,
        description,
        type,
        declaredTotalAmount,
        status: 'pending',
        accounts: {
          create: accounts.map(account => ({
            accountHolderName: account.accountHolderName,
            accountNumber: account.accountNumber,
            sheba: account.sheba,
            cardNumber: account.cardNumber,
            bankName: account.bankName,
            declaredAmount: account.declaredAmount,
          })),
        },
      },
      include: {
        accounts: {
          include: {
            receipts: true,
          },
        },
      },
    })

    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error) {
    console.error('Create transaction error:', error)
    return NextResponse.json(
      { error: 'خطای سرور رخ داد' },
      { status: 500 }
    )
  }
})
