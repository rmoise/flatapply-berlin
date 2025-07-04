import { getUser } from '@/lib/auth/utils'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Heart,
  MapPin,
  Euro,
  Home,
  Calendar,
  Trash2,
  ExternalLink,
  TrendingDown,
  Clock,
  Check
} from 'lucide-react'

interface SavedListing {
  id: string
  listingId: string
  title: string
  address: string
  district: string
  price: number
  warmRent: number
  size: number
  rooms: number
  images: string[]
  savedAt: string
  availableFrom: string
  platform: string
  matchScore?: number
  status: "available" | "unavailable" | "applied"
  hasUpdate?: boolean
  priceDropped?: {
    oldPrice: number
    newPrice: number
  }
}

// Mock data - in production, fetch from database
const savedListings: SavedListing[] = [
  {
    id: "1",
    listingId: "listing-1",
    title: "Beautiful 2-room apartment in Prenzlauer Berg",
    address: "Stargarder Straße 15",
    district: "Prenzlauer Berg",
    price: 1200,
    warmRent: 1450,
    size: 65,
    rooms: 2,
    images: ["/api/placeholder/400/300"],
    savedAt: new Date().toISOString(),
    availableFrom: "2024-03-01",
    platform: "immoscout24",
    matchScore: 92,
    status: "applied"
  },
  {
    id: "2",
    listingId: "listing-5",
    title: "Sunny studio with balcony in Kreuzberg",
    address: "Bergmannstraße 42",
    district: "Kreuzberg",
    price: 950,
    warmRent: 1100,
    size: 42,
    rooms: 1,
    images: ["/api/placeholder/400/300"],
    savedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    availableFrom: "2024-02-15",
    platform: "wg_gesucht",
    matchScore: 88,
    status: "available",
    hasUpdate: true,
    priceDropped: {
      oldPrice: 1000,
      newPrice: 950
    }
  },
  {
    id: "3",
    listingId: "listing-8",
    title: "Modern 3-room flat near Alexanderplatz",
    address: "Karl-Marx-Allee 108",
    district: "Mitte",
    price: 1600,
    warmRent: 1850,
    size: 85,
    rooms: 3,
    images: ["/api/placeholder/400/300"],
    savedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    availableFrom: "2024-04-01",
    platform: "kleinanzeigen",
    matchScore: 75,
    status: "available"
  },
  {
    id: "4",
    listingId: "listing-12",
    title: "Cozy 1-bedroom in Neukölln",
    address: "Weserstraße 89",
    district: "Neukölln",
    price: 800,
    warmRent: 950,
    size: 45,
    rooms: 1.5,
    images: ["/api/placeholder/400/300"],
    savedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    availableFrom: "2024-02-01",
    platform: "immoscout24",
    matchScore: 90,
    status: "unavailable"
  }
]

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInHours / 24)
  
  if (diffInHours < 1) return "Just now"
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInDays === 1) return "Yesterday"
  if (diffInDays < 7) return `${diffInDays} days ago`
  return date.toLocaleDateString()
}

export default async function SavedPage() {
  const user = await getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const availableCount = savedListings.filter(l => l.status === "available").length
  const appliedCount = savedListings.filter(l => l.status === "applied").length
  
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Saved Listings
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {savedListings.length} total • {availableCount} available • {appliedCount} applied
              </p>
            </div>
            
            {/* Filter buttons */}
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                All
              </button>
              <button className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Available
              </button>
              <button className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Applied
              </button>
            </div>
          </div>
        </div>
        
        {/* Listings Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {savedListings.map((listing) => (
            <div
              key={listing.id}
              className="group bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Image */}
              <Link href={`/listings/${listing.listingId}`}>
                <div className="relative h-48 bg-gray-100">
                  <Image
                    src={listing.images[0]}
                    alt={listing.title}
                    fill
                    className="object-cover"
                  />
                  
                  {/* Status badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {listing.status === "applied" && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-500 text-white rounded">
                        Applied
                      </span>
                    )}
                    {listing.status === "unavailable" && (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-500 text-white rounded">
                        Unavailable
                      </span>
                    )}
                    {listing.hasUpdate && (
                      <span className="px-2 py-1 text-xs font-medium bg-amber-500 text-white rounded">
                        Updated
                      </span>
                    )}
                  </div>
                  
                  {/* Match score */}
                  {listing.matchScore && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded text-xs font-medium">
                      {listing.matchScore}% match
                    </div>
                  )}
                  
                  {/* Remove button - show on hover */}
                  <button
                    className="absolute bottom-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                    title="Remove from saved"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </Link>
              
              {/* Content */}
              <div className="p-4 flex-1 flex flex-col">
                <Link href={`/listings/${listing.listingId}`}>
                  <h3 className="font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-1">
                    {listing.title}
                  </h3>
                </Link>
                
                <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{listing.district}</span>
                </div>
                
                {/* Price drop alert */}
                {listing.priceDropped && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 rounded-md">
                    <TrendingDown className="h-4 w-4 text-blue-600" />
                    <div className="flex items-center gap-2 text-sm">
                      <span className="line-through text-gray-500">€{listing.priceDropped.oldPrice}</span>
                      <span className="font-medium text-blue-600">€{listing.priceDropped.newPrice}</span>
                      <span className="text-xs text-blue-600">
                        (-{Math.round((1 - listing.priceDropped.newPrice / listing.priceDropped.oldPrice) * 100)}%)
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Details */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-semibold text-gray-900">€{listing.warmRent}</span>
                    <span className="text-gray-500">warm</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{listing.rooms} rooms</span>
                    <span>•</span>
                    <span>{listing.size}m²</span>
                  </div>
                </div>
                
                {/* Spacer to push footer to bottom */}
                <div className="flex-1" />
                
                {/* Footer */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    Saved {formatTimestamp(listing.savedAt)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs text-gray-600">
                      {new Date(listing.availableFrom).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  {listing.status === "available" && (
                    <>
                      <Link 
                        href={`/listings/${listing.listingId}`}
                        className="flex-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-center"
                      >
                        View
                      </Link>
                      <Link 
                        href={`/listings/${listing.listingId}?apply=true`}
                        className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors text-center"
                      >
                        Apply
                      </Link>
                    </>
                  )}
                  {listing.status === "applied" && (
                    <Link 
                      href="/dashboard/applications"
                      className="flex-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-center flex items-center justify-center gap-1"
                    >
                      <Check className="h-3.5 w-3.5" />
                      View Application
                    </Link>
                  )}
                  {listing.status === "unavailable" && (
                    <span className="flex-1 px-3 py-1.5 text-sm text-gray-500 text-center">
                      No longer available
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Empty state */}
        {savedListings.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
              <Heart className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-2">No saved listings yet</p>
            <p className="text-sm text-gray-500 mb-6">
              Save apartments you like to keep track of them here
            </p>
            <Link 
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Browse Listings
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        )}
        
        {/* Tips */}
        {savedListings.length > 0 && (
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-1">
              Pro tip: Set up alerts
            </h3>
            <p className="text-sm text-blue-700">
              Get notified when prices drop or new similar apartments become available.
            </p>
            <Link 
              href="/dashboard/preferences?tab=notifications"
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 mt-2"
            >
              Manage alerts
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}