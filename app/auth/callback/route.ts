import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function isSafeRedirect(path: string): boolean {
  // Must be a relative path. Reject protocol-relative (//evil.com) and
  // path-traversal (/\evil.com) variants that browsers treat as absolute URLs.
  return path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\')
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/dashboard'
  // Normalize untrusted query input to a safe in-app path.
  const next = isSafeRedirect(rawNext) ? rawNext : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      // In production behind a proxy, prefer the forwarded host for correct redirects.
      const base = forwardedHost && process.env.NODE_ENV !== 'development'
        ? `https://${forwardedHost}`
        : origin
      return NextResponse.redirect(`${base}${next}`)
    } else {
      // Redirect to error page with reason
      const errorUrl = new URL('/auth/auth-code-error', origin)
      errorUrl.searchParams.set('reason', error.message)
      return NextResponse.redirect(errorUrl)
    }
  }

  // Return the user to an error page with instructions
  const errorUrl = new URL('/auth/auth-code-error', origin)
  errorUrl.searchParams.set('reason', 'Invalid or missing recovery code')
  return NextResponse.redirect(errorUrl)
}
