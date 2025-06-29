import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'
import Link from 'next/link'
import { ROUTES } from '@/lib/constants'

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

export function Pricing() {
  return (
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
  )
}