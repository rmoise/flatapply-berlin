import { Metadata } from 'next'
import { SignupForm } from '@/features/auth/components/signup-form'
import Link from 'next/link'
import { ROUTES } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Sign Up - FlatApply Berlin',
  description: 'Create your FlatApply account and start finding apartments in Berlin faster',
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link href={ROUTES.HOME} className="text-2xl font-bold">
            FlatApply Berlin
          </Link>
          <h1 className="mt-6 text-3xl font-bold tracking-tight">
            Create an account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Get started with your apartment search
          </p>
        </div>

        <SignupForm />
      </div>
    </div>
  )
}