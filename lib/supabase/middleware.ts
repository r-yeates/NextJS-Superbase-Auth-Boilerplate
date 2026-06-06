import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ROUTES = {
  public: ['/auth/login', '/auth/register', '/auth/reset-password', '/auth/verify-email', '/auth/callback', '/auth/auth-code-error', '/'],
  passwordReset: ['/auth/update-password'],
} as const

function isRoute(pathname: string, routes: readonly string[]): boolean {
  return routes.some(route => pathname === route || pathname.startsWith(route + '/'))
}

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
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isPublic = isRoute(pathname, ROUTES.public)
  const isPasswordReset = isRoute(pathname, ROUTES.passwordReset)

  // Unauthenticated users trying to access protected routes: redirect to login
  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Authenticated users trying to access public auth pages: redirect to dashboard
  // Exception: /auth/update-password is accessible during password reset flow
  if (user && isRoute(pathname, ROUTES.public) && !isPasswordReset) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Authenticated users with unverified email trying to access protected routes: redirect to verify-email
  if (user && !user.email_confirmed_at && !isPublic && !isPasswordReset) {
    return NextResponse.redirect(new URL('/auth/verify-email', request.url))
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse
}
