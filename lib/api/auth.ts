import { createClient } from '@/lib/supabase/server'
import { unauthorizedResponse } from './response'

export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

export async function requireAuth() {
  const user = await getAuthenticatedUser()
  if (!user) {
    return { user: null, response: unauthorizedResponse() }
  }
  return { user, response: null }
}

