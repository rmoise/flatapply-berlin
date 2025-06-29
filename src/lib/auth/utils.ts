import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ROUTES } from '@/lib/constants'
import { AppError } from '@/lib/utils/error-handler'

export async function requireAuth() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect(ROUTES.LOGIN)
  }
  
  return user
}

export async function getUser() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  return user
}

export async function requireProfile() {
  const user = await requireAuth()
  const supabase = await createClient()
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (error || !profile) {
    throw new AppError(
      'Profile not found',
      'PROFILE_NOT_FOUND',
      404
    )
  }
  
  return { user, profile }
}

export async function getProfile(userId: string) {
  const supabase = await createClient()
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) {
    return null
  }
  
  return profile
}

export async function isAuthenticated() {
  const user = await getUser()
  return !!user
}