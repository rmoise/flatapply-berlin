'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MapPin,
  Home,
  Calendar,
  Heart,
  Eye,
  ExternalLink
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { DatabaseListing, UserMatch } from '@/features/listings/types'
import { markListingViewed, saveListing, unsaveListing } from '@/features/listings/actions'
import { toast } from "sonner"
import { ProxiedImage } from "@/components/ui/proxied-image"

interface ListingCardProps {
  listing: DatabaseListing;
  match: UserMatch;
  userId: string;
}

export function ListingCard({ listing, match, userId }: ListingCardProps) {
  const [isViewed, setIsViewed] = useState(!!match?.viewed_at)
  const [isSaved, setIsSaved] = useState(false) // TODO: Get from props
  const [isLoading, setIsLoading] = useState(false)
  
  // Early return if listing is null or undefined
  if (!listing) {
    return null;
  }

  const handleView = async () => {
    if (!isViewed) {
      setIsViewed(true)
      await markListingViewed(userId, listing.id)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      if (isSaved) {
        const result = await unsaveListing(userId, listing.id)
        if (result.success) {
          setIsSaved(false)
          toast.success("Listing removed from saved")
        } else {
          toast.error(result.error)
        }
      } else {
        const result = await saveListing(userId, listing.id)
        if (result.success) {
          setIsSaved(true)
          toast.success("Listing saved")
        } else {
          toast.error(result.error)
        }
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const isNew = () => {
    const matchedAt = new Date(match.matched_at)
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return matchedAt > dayAgo
  }

  const formatAvailableDate = (dateString?: string) => {
    if (!dateString) return 'Available now'
    
    const date = new Date(dateString)
    const now = new Date()
    
    if (date <= now) return 'Available now'
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(price)
  }

  const getPlatformName = (platform: string) => {
    const names: Record<string, string> = {
      'wg_gesucht': 'WG-Gesucht',
      'immoscout24': 'ImmoScout24',
      'kleinanzeigen': 'Kleinanzeigen',
      'immowelt': 'Immowelt',
      'immonet': 'Immonet'
    }
    return names[platform] || platform
  }

  const getRoomDisplay = () => {
    const rooms = listing.rooms || 1;
    if (listing.wg_size) {
      // This is a WG room
      return `1 room in ${listing.wg_size}er WG`;
    } else if (rooms === 1) {
      return '1-room apartment';
    } else {
      return `${rooms}-room apartment`;
    }
  }

  const getWGIcon = () => {
    // WG badge removed - already shows "1 room in 3er WG" in room display
    return null;
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-[4/3]">
        {listing.images && listing.images.length > 0 ? (
          <ProxiedImage
            src={listing.images[0]}
            alt={listing.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <Home className="h-12 w-12 text-gray-400" />
          </div>
        )}
        
        <div className="absolute top-3 left-3 flex gap-2">
          {isNew() && (
            <Badge className="bg-blue-600">New</Badge>
          )}
          <Badge variant="secondary">{Math.round(match?.match_score || 0)}% match</Badge>
        </div>
        
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-3 right-3 bg-white/80 hover:bg-white"
          onClick={handleSave}
          disabled={isLoading}
        >
          <Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
        </Button>
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">
              <Link 
                href={`/dashboard/listings/${listing.id}`}
                className="hover:underline"
                onClick={handleView}
              >
                {listing.title}
              </Link>
            </CardTitle>
          </div>
          <div className="text-right">
            <div className="font-bold text-lg">{formatPrice(listing.warm_rent || listing.price)}</div>
            <div className="text-xs text-muted-foreground">Warm rent</div>
          </div>
        </div>
        
        <div className="flex items-center mt-1 text-sm text-muted-foreground">
          <MapPin className="mr-1 h-3 w-3" />
          {listing.district && listing.address ? 
            `${listing.district} • ${listing.address}` :
            listing.district || listing.address || 'Location not specified'
          }
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground mt-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center">
              <Home className="mr-1 h-3 w-3" />
              {getRoomDisplay()}
            </span>
            {listing.size_sqm && <span>{listing.size_sqm} m²</span>}
          </div>
          <span className="flex items-center">
            <Calendar className="mr-1 h-3 w-3" />
            {formatAvailableDate(listing.available_from)}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-col h-full pt-0">
        
        <div className="flex items-end justify-between mt-auto">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {getPlatformName(listing.platform)}
            </Badge>
            {getWGIcon()}
            {isViewed && (
              <span className="text-xs text-muted-foreground flex items-center">
                <Eye className="mr-1 h-3 w-3" />
                Viewed
              </span>
            )}
          </div>
          <Button size="sm" asChild onClick={handleView}>
            <Link href={`/dashboard/listings/${listing.id}`}>
              View Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}