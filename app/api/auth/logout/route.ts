import { NextResponse } from 'next/server'
import { removeAuthCookie } from '@/lib/auth-utils/cookies'

export async function POST() {
  try {
    await removeAuthCookie()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'خطای سرور رخ داد' },
      { status: 500 }
    )
  }
}
