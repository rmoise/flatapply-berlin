import { 
  Search, 
  Bell, 
  FileText, 
  Shield, 
  Languages,
  Mail
} from 'lucide-react'

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

export function Features() {
  return (
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
  )
}