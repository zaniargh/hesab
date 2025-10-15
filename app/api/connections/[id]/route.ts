import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-utils/middleware'
import { prisma } from '@/lib/db/prisma'

// DELETE /api/connections/[id] - حذف ارتباط
export const DELETE = withAuth(async (request: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
  if (user.type !== 'customer') {
    return NextResponse.json(
      { error: 'فقط مشتریان می‌توانند ارتباطات خود را حذف کنند' },
      { status: 403 }
    )
  }

  try {
    const { id } = await params

    // بررسی اینکه این ارتباط متعلق به کاربر فعلی است
    const connection = await prisma.customerConnection.findUnique({
      where: { id },
    })

    if (!connection || connection.ownerId !== user.userId) {
      return NextResponse.json(
        { error: 'ارتباط یافت نشد یا شما مجاز به حذف آن نیستید' },
        { status: 404 }
      )
    }

    await prisma.customerConnection.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete connection error:', error)
    return NextResponse.json(
      { error: 'خطای سرور رخ داد' },
      { status: 500 }
    )
  }
})

// PATCH /api/connections/[id] - ویرایش نام سفارشی
export const PATCH = withAuth(async (request: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
  if (user.type !== 'customer') {
    return NextResponse.json(
      { error: 'فقط مشتریان می‌توانند ارتباطات خود را ویرایش کنند' },
      { status: 403 }
    )
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { customName } = body

    if (!customName || customName.trim().length < 2) {
      return NextResponse.json(
        { error: 'نام سفارشی باید حداقل 2 کاراکتر باشد' },
        { status: 400 }
      )
    }

    // بررسی اینکه این ارتباط متعلق به کاربر فعلی است
    const connection = await prisma.customerConnection.findUnique({
      where: { id },
    })

    if (!connection || connection.ownerId !== user.userId) {
      return NextResponse.json(
        { error: 'ارتباط یافت نشد یا شما مجاز به ویرایش آن نیستید' },
        { status: 404 }
      )
    }

    const updatedConnection = await prisma.customerConnection.update({
      where: { id },
      data: { customName },
    })

    return NextResponse.json({ connection: updatedConnection })
  } catch (error) {
    console.error('Update connection error:', error)
    return NextResponse.json(
      { error: 'خطای سرور رخ داد' },
      { status: 500 }
    )
  }
})
