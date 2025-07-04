import { getUser } from '@/lib/auth/utils'
import { redirect } from 'next/navigation'
import { ROUTES } from '@/lib/constants'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Redirect to home if already logged in
  const user = await getUser()
  
  if (user) {
    redirect(ROUTES.HOME)
  }

  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}