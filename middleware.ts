import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJWT } from '@/lib/auth-utils/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // مسیرهای عمومی که نیاز به احراز هویت ندارند
  const publicPaths = ['/', '/api/auth/login', '/api/auth/logout']
  const isPublicPath = publicPaths.some(path => pathname === path)

  // دریافت توکن از cookie
  const token = request.cookies.get('auth-token')?.value

  // اگر مسیر public است، اجازه دسترسی
  if (isPublicPath) {
    // اگر کاربر لاگین کرده و به صفحه اصلی می‌رود، redirect کن
    if (pathname === '/' && token) {
      const user = await verifyJWT(token)
      if (user) {
        if (user.type === 'admin') {
          return NextResponse.redirect(new URL('/admin', request.url))
        } else {
          return NextResponse.redirect(new URL('/customer', request.url))
        }
      }
    }
    return NextResponse.next()
  }

  // اگر توکن نیست، redirect به صفحه لاگین
  if (!token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // تایید توکن
  const user = await verifyJWT(token)
  
  if (!user) {
    const response = NextResponse.redirect(new URL('/', request.url))
    response.cookies.delete('auth-token')
    return response
  }

  // بررسی دسترسی به پنل‌های مختلف
  if (pathname.startsWith('/admin') && user.type !== 'admin') {
    return NextResponse.redirect(new URL('/customer', request.url))
  }

  if (pathname.startsWith('/customer') && user.type !== 'customer') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
