"use server"

import { cookies } from "next/headers"

export async function updateSidebarPreference(isCollapsed: boolean) {
  const cookieStore = await cookies()
  
  cookieStore.set('sidebar-collapsed', isCollapsed.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  })
}

export async function getSidebarPreference(): Promise<boolean> {
  const cookieStore = await cookies()
  const preference = cookieStore.get('sidebar-collapsed')
  
  return preference?.value === 'true'
}