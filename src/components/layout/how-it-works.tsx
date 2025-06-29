import { UserPlus, Settings, Bell, Send } from 'lucide-react'

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

export function HowItWorks() {
  return (
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
  )
}