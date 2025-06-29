import { getUser } from '@/lib/auth/utils'
import { redirect } from 'next/navigation'
import { ROUTES } from '@/lib/constants'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Redirect to dashboard if already logged in
  const user = await getUser()
  
  if (user) {
    redirect(ROUTES.DASHBOARD)
  }

  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}