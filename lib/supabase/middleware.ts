import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ADMIN_EMAIL = 'clubdepatinajetravesia@gmail.com'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Always use getUser() instead of getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/admin') ||
    request.nextUrl.pathname.startsWith('/portal');

  const isAdminRoute =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/admin');

  const isPortalRoute = request.nextUrl.pathname.startsWith('/portal');

  // 1. If not logged in and trying to access any protected route
  if (!user && isProtectedRoute) {
    console.log('Middleware: Unauthenticated access to protected route, redirecting to /login');
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    const isUserAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    // 2. If logged in but NOT admin and trying to access ADMIN routes
    if (isAdminRoute && !isUserAdmin) {
      console.log('Middleware: Non-admin trying to access admin route, redirecting to /portal');
      const url = request.nextUrl.clone()
      url.pathname = '/portal'
      return NextResponse.redirect(url)
    }

    // 3. If admin and trying to access PORTAL routes
    if (isPortalRoute && isUserAdmin) {
      console.log('Middleware: Admin trying to access portal route, redirecting to /dashboard');
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
