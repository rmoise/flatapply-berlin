import { Star } from 'lucide-react'

const testimonials = [
  {
    name: 'Sarah M.',
    role: 'Software Engineer',
    content: 'Found my dream apartment in Prenzlauer Berg within 2 weeks! The instant WhatsApp alerts were a game-changer.',
    rating: 5,
  },
  {
    name: 'Marcus K.',
    role: 'Marketing Manager',
    content: 'The AI-generated messages in perfect German helped me stand out. Got 5 viewings in my first week!',
    rating: 5,
  },
  {
    name: 'Emma L.',
    role: 'PhD Student',
    content: 'As an expat, the rental CV feature was invaluable. Landlords were impressed with my professional application.',
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Loved by Apartment Hunters
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands who found their perfect home with FlatApply
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-muted/50 rounded-lg p-6 border"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-foreground mb-4">
                &ldquo;{testimonial.content}&rdquo;
              </p>
              <div>
                <p className="font-semibold">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}