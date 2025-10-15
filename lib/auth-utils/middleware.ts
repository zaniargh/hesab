import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT, JWTPayload } from './jwt'
import { getAuthCookie } from './cookies'

export async function requireAuth(
  request: NextRequest,
  requiredType?: 'admin' | 'customer'
): Promise<{ user: JWTPayload } | NextResponse> {
  const token = await getAuthCookie()

  if (!token) {
    return NextResponse.json(
      { error: 'احراز هویت نشده‌اید' },
      { status: 401 }
    )
  }

  const user = await verifyJWT(token)

  if (!user) {
    return NextResponse.json(
      { error: 'توکن نامعتبر است' },
      { status: 401 }
    )
  }

  if (requiredType && user.type !== requiredType) {
    return NextResponse.json(
      { error: 'شما دسترسی به این بخش ندارید' },
      { status: 403 }
    )
  }

  return { user }
}

export function withAuth(
  handler: (request: NextRequest, user: JWTPayload) => Promise<NextResponse>,
  requiredType?: 'admin' | 'customer'
) {
  return async (request: NextRequest) => {
    const authResult = await requireAuth(request, requiredType)
    
    if (authResult instanceof NextResponse) {
      return authResult
    }

    return handler(request, authResult.user)
  }
}
