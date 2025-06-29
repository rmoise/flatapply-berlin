import { Metadata } from 'next'
import { LoginForm } from '@/features/auth/components/login-form'
import Link from 'next/link'
import { ROUTES } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Sign In - FlatApply Berlin',
  description: 'Sign in to your FlatApply account to find your dream apartment in Berlin',
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link href={ROUTES.HOME} className="text-2xl font-bold">
            FlatApply Berlin
          </Link>
          <h1 className="mt-6 text-3xl font-bold tracking-tight">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  )
}