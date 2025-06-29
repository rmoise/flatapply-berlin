import { Navbar } from '@/components/layout/navbar'
import { Hero } from '@/components/layout/hero'
import { Features } from '@/components/layout/features'
import { HowItWorks } from '@/components/layout/how-it-works'
import { Testimonials } from '@/components/layout/testimonials'
import { Pricing } from '@/components/layout/pricing'
import { Footer } from '@/components/layout/footer'
import { getUser } from '@/lib/auth/utils'

export default async function Home() {
  const user = await getUser()

  return (
    <div className="min-h-screen">
      <Navbar isAuthenticated={!!user} />
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <Footer />
    </div>
  )
}