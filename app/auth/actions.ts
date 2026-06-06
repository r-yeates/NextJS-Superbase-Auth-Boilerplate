'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { validatePassword } from '@/lib/validation/password'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { getFormStringRequired } from '@/lib/formData'

function getSiteUrl(): string | null {
  // Centralize environment lookup so auth flows fail with one consistent log.
  const url = process.env.NEXT_PUBLIC_SITE_URL
  if (!url) console.error('NEXT_PUBLIC_SITE_URL is not set')
  return url ?? null
}

export async function signUp(formData: FormData) {
  const email = getFormStringRequired(formData, 'email') ?? ''
  const password = getFormStringRequired(formData, 'password') ?? ''

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const ip = await getClientIp()
  // Rate limit by client IP before hitting Supabase auth endpoints.
  if (!await checkRateLimit('signUp', ip)) {
    return { error: 'Too many sign-up attempts. Please try again later.' }
  }

  const passwordValidation = validatePassword(password)
  if (!passwordValidation.isValid) {
    return { error: passwordValidation.errors[0] || 'Password does not meet requirements' }
  }

  const siteUrl = getSiteUrl()
  if (!siteUrl) {
    return { error: 'Unable to create account. Please try again later.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  })

  if (error) {
    console.error('Sign-up error:', error)
    return { error: 'Unable to create account. Please try again later.' }
  }

  redirect('/auth/verify-email')
}

export async function signIn(formData: FormData) {
  const email = getFormStringRequired(formData, 'email') ?? ''
  const password = getFormStringRequired(formData, 'password') ?? ''

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const ip = await getClientIp()
  // Rate limit by client IP before attempting password auth.
  if (!await checkRateLimit('signIn', ip)) {
    return { error: 'Too many sign-in attempts. Please try again later.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'Invalid email or password.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/auth/login')
}

export async function resetPassword(formData: FormData) {
  const email = getFormStringRequired(formData, 'email') ?? ''

  if (!email) {
    return { error: 'Email is required' }
  }

  const ip = await getClientIp()
  // Rate limit reset requests to reduce abuse and email spam.
  if (!await checkRateLimit('resetPassword', ip)) {
    return { error: 'Too many reset attempts. Please try again later.' }
  }

  const siteUrl = getSiteUrl()
  if (!siteUrl) {
    return { success: 'If an account exists with that email, you will receive a password reset link.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // Route through /auth/callback so the recovery code is exchanged for a
    // session before landing on the update-password page.
    redirectTo: `${siteUrl}/auth/callback?next=/auth/update-password`,
  })

  if (error) {
    console.error('Password reset error:', error)
  }

  // Always return a generic success message to prevent account enumeration.
  return { success: 'If an account exists with that email, you will receive a password reset link.' }
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()

  const password = getFormStringRequired(formData, 'password') ?? ''
  const confirmPassword = getFormStringRequired(formData, 'confirmPassword') ?? ''

  if (!password || !confirmPassword) {
    return { error: 'Both password fields are required' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  const passwordValidation = validatePassword(password)
  if (!passwordValidation.isValid) {
    return { error: passwordValidation.errors[0] || 'Password does not meet requirements' }
  }

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    console.error('Password update error:', error)
    return { error: 'Unable to update password. Please try again.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
