import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-utils/middleware'
import { prisma } from '@/lib/db/prisma'

// GET /api/transactions/[id]
export const GET = withAuth(async (request: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params

    const transaction = await prisma.customerTransaction.findUnique({
      where: { id },
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
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'تراکنش یافت نشد' },
        { status: 404 }
      )
    }

    // بررسی دسترسی
    if (user.type === 'customer') {
      if (transaction.fromCustomerId !== user.userId && transaction.toCustomerId !== user.userId) {
        return NextResponse.json(
          { error: 'شما به این تراکنش دسترسی ندارید' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error('Get transaction error:', error)
    return NextResponse.json(
      { error: 'خطای سرور رخ داد' },
      { status: 500 }
    )
  }
})

// PATCH /api/transactions/[id] - آپدیت تراکنش
export const PATCH = withAuth(async (request: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params
    const body = await request.json()

    const transaction = await prisma.customerTransaction.findUnique({
      where: { id },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'تراکنش یافت نشد' },
        { status: 404 }
      )
    }

    // بررسی دسترسی
    if (user.type === 'customer') {
      if (transaction.fromCustomerId !== user.userId && transaction.toCustomerId !== user.userId) {
        return NextResponse.json(
          { error: 'شما به این تراکنش دسترسی ندارید' },
          { status: 403 }
        )
      }
    }

    // آپدیت تراکنش
    const updatedTransaction = await prisma.customerTransaction.update({
      where: { id },
      data: {
        status: body.status,
        declaredTotalAmount: body.declaredTotalAmount,
        description: body.description,
      },
      include: {
        accounts: {
          include: {
            receipts: true,
          },
        },
      },
    })

    return NextResponse.json({ transaction: updatedTransaction })
  } catch (error) {
    console.error('Update transaction error:', error)
    return NextResponse.json(
      { error: 'خطای سرور رخ داد' },
      { status: 500 }
    )
  }
})

// DELETE /api/transactions/[id] - حذف تراکنش
export const DELETE = withAuth(async (request: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params

    const transaction = await prisma.customerTransaction.findUnique({
      where: { id },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'تراکنش یافت نشد' },
        { status: 404 }
      )
    }

    // فقط سازنده تراکنش یا admin می‌تواند حذف کند
    if (user.type === 'customer' && transaction.fromCustomerId !== user.userId) {
      return NextResponse.json(
        { error: 'فقط سازنده تراکنش می‌تواند آن را حذف کند' },
        { status: 403 }
      )
    }

    await prisma.customerTransaction.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete transaction error:', error)
    return NextResponse.json(
      { error: 'خطای سرور رخ داد' },
      { status: 500 }
    )
  }
})
