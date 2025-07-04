import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'
import { ArrowRight, Zap, Bell, FileText, UserPlus, Settings, Send, Check, X, Search, Shield, Languages, Mail } from 'lucide-react'

const steps = [
  {
    icon: UserPlus,
    title: 'Sign Up & Set Preferences',
    description: 'Create your profile and tell us what you\'re looking for: budget, location, size, and move-in date.',
  },
  {
    icon: Settings,
    title: 'Upload Your Documents',
    description: 'Add your SCHUFA, proof of income, and ID. We\'ll help you create a professional rental CV.',
  },
  {
    icon: Bell,
    title: 'Get Instant Alerts',
    description: 'Receive notifications the moment matching apartments appear. Our scrapers check every 10 minutes.',
  },
  {
    icon: Send,
    title: 'Apply in Seconds',
    description: 'Generate personalized messages in perfect German. Auto-apply to listings with email contacts.',
  },
]

const features = [
  {
    icon: Search,
    title: 'Smart Apartment Matching',
    description: 'Set your preferences once. Our AI matches you with perfect apartments from WG-Gesucht, ImmoScout24, and more.',
  },
  {
    icon: Bell,
    title: 'Instant Notifications',
    description: 'Get alerts within seconds via WhatsApp, Telegram, or Email. Be the first to see new listings.',
  },
  {
    icon: Languages,
    title: 'Perfect German Applications',
    description: 'Generate native-level German messages tailored to each listing. Stand out from other applicants.',
  },
  {
    icon: FileText,
    title: 'Professional Rental CV',
    description: 'Create a polished German rental CV with your photo, income proof, and documents. Impress landlords instantly.',
  },
  {
    icon: Mail,
    title: 'Auto-Apply Feature',
    description: 'When listings have email contacts, we can automatically send your application. Apply while you sleep.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your data is encrypted and never shared. Full GDPR compliance with complete control over your information.',
  },
]

const plans = [
  {
    name: 'Free',
    price: '€0',
    description: 'Perfect for getting started',
    features: [
      { text: '5 alerts per day', included: true },
      { text: 'Basic search filters', included: true },
      { text: 'Email notifications', included: true },
      { text: 'AI message generation', included: false },
      { text: 'Rental CV generator', included: false },
      { text: 'Auto-apply feature', included: false },
      { text: 'WhatsApp & Telegram alerts', included: false },
    ],
    cta: 'Start Free',
    variant: 'outline' as const,
  },
  {
    name: 'Basic',
    price: '€9.99',
    period: '/month',
    description: 'For serious apartment hunters',
    features: [
      { text: '50 alerts per day', included: true },
      { text: 'Advanced search filters', included: true },
      { text: 'All notification channels', included: true },
      { text: '100 AI messages/month', included: true },
      { text: '5 CV generations/month', included: true },
      { text: 'Auto-apply feature', included: false },
      { text: 'Priority support', included: true },
    ],
    cta: 'Start 7-Day Trial',
    variant: 'default' as const,
    popular: true,
  },
  {
    name: 'Pro',
    price: '€19.99',
    period: '/month',
    description: 'Maximum advantage in your search',
    features: [
      { text: 'Unlimited alerts', included: true },
      { text: 'All search filters', included: true },
      { text: 'All notification channels', included: true },
      { text: 'Unlimited AI messages', included: true },
      { text: 'Unlimited CV generations', included: true },
      { text: 'Auto-apply feature', included: true },
      { text: '24/7 priority support', included: true },
    ],
    cta: 'Start 7-Day Trial',
    variant: 'default' as const,
  },
]

export default function HowItWorksPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="pt-24 pb-12 md:pt-32 md:pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center rounded-full px-4 py-1 text-sm bg-primary/10 text-primary mb-6">
              <Zap className="w-4 h-4 mr-2" />
              How FlatApply Works
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              How FlatApply Works
            </h1>

            {/* Subheading */}
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Discover how FlatApply gives you an unfair advantage in Berlin's competitive rental market. 
              From smart alerts to AI-powered applications - here's everything you need to know.
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
                <Link href="#features">
                  Explore Features
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Win the Berlin Housing Game
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Stop losing apartments to faster applicants. Our tools give you an unfair advantage.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-background rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              From Sign Up to Move In - Made Simple
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our streamlined process helps you find and secure your dream apartment faster than ever.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-4 mb-8 last:mb-0">
                {/* Step Number & Line */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                    {index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-0.5 h-full bg-border mt-2" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-8">
                  <div className="bg-background rounded-lg p-6 border shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <step.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                        <p className="text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your needs. Upgrade or downgrade anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`bg-background rounded-lg p-8 border-2 relative ${
                  plan.popular ? 'border-primary shadow-lg' : 'border-border'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                  <p className="text-muted-foreground">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground/50 shrink-0 mt-0.5" />
                      )}
                      <span
                        className={
                          feature.included ? '' : 'text-muted-foreground/50'
                        }
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  variant={plan.variant}
                  className="w-full"
                  size="lg"
                >
                  <Link href={ROUTES.SIGNUP}>{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            All plans include a 7-day free trial. No credit card required to start.
          </p>
        </div>
      </section>
    </div>
  )
}