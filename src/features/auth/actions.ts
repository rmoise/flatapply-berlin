'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ROUTES } from '@/lib/constants'
import { loginSchema, signupSchema } from '@/lib/utils/validation'
import { withErrorHandling } from '@/lib/utils/error-handler'
import { headers } from 'next/headers'

// Email/Password login
export async function loginWithEmail(formData: FormData) {
  return withErrorHandling(async () => {
    const validatedData = loginSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    })

    const supabase = await createClient()
    
    const { error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    })

    if (error) {
      throw error
    }

    redirect(ROUTES.DASHBOARD)
  })
}

// Email/Password signup
export async function signupWithEmail(formData: FormData) {
  return withErrorHandling(async () => {
    const validatedData = signupSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
      full_name: formData.get('full_name'),
    })

    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          full_name: validatedData.full_name,
        },
      },
    })

    if (error) {
      throw error
    }

    // Create profile record
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: validatedData.full_name,
        })

      if (profileError) {
        throw profileError
      }
    }

    redirect(ROUTES.DASHBOARD)
  })
}

// OAuth login (Google, etc.)
export async function loginWithOAuth(provider: 'google') {
  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin')

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}${ROUTES.AUTH_CALLBACK}`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    throw error
  }

  if (data.url) {
    redirect(data.url)
  }
}

// Logout
export async function logout() {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    throw error
  }
  
  redirect(ROUTES.HOME)
}