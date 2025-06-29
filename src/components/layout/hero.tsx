import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'
import { ArrowRight, Zap, Bell, FileText } from 'lucide-react'

export function Hero() {
  return (
    <section className="pt-24 pb-12 md:pt-32 md:pb-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center rounded-full px-4 py-1 text-sm bg-primary/10 text-primary mb-6">
            <Zap className="w-4 h-4 mr-2" />
            Find apartments 10x faster
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Never Miss Your Dream Apartment in Berlin Again
          </h1>

          {/* Subheading */}
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get instant notifications, generate perfect German applications, and apply before anyone else. 
            Join thousands finding apartments faster with FlatApply.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button asChild size="lg" className="text-base">
              <Link href={ROUTES.SIGNUP}>
                Start Free Trial
                <ArrowRight className="ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base">
              <Link href="#how-it-works">
                See How It Works
              </Link>
            </Button>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-4 justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bell className="w-4 h-4 text-primary" />
              Real-time alerts
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4 text-primary" />
              AI-powered applications
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="w-4 h-4 text-primary" />
              Auto-apply feature
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}