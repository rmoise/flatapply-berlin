import { Mail } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function EmptyMailbox() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
      <div className="text-center max-w-md mx-auto">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <Mail className="h-8 w-8 text-gray-400" />
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          No conversations yet
        </h2>
        
        <p className="text-gray-600 mb-6">
          When you send applications through Gmail, your conversations will appear here
        </p>
        
        <Link href="/dashboard/listings">
          <Button>
            Browse Listings
          </Button>
        </Link>
      </div>
    </div>
  )
}