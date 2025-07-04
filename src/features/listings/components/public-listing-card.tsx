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
  ExternalLink,
  Euro,
  Square,
  Bed,
  Lock
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { DatabaseListing } from '@/features/listings/types'
import { toast } from "sonner"
import { ProxiedImage } from "@/components/ui/proxied-image"
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { useRouter } from 'next/navigation'

interface PublicListingCardProps {
  listing: DatabaseListing;
  isAuthenticated?: boolean;
  onSaveClick?: () => void;
}

export function PublicListingCard({ listing, isAuthenticated = false, onSaveClick }: PublicListingCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  
  // Early return if listing is null or undefined
  if (!listing) {
    return null;
  }

  const formatPrice = (price: number | null, warmRent: number | null) => {
    const displayPrice = warmRent || price;
    if (!displayPrice) return 'Price on request';
    return `€${displayPrice.toLocaleString('de-DE')}`;
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Immediately';
    const dateObj = new Date(date);
    if (dateObj < new Date()) return 'Immediately';
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: de });
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push(`/signup?intent=save&listing=${listing.id}`);
    } else if (onSaveClick) {
      onSaveClick();
    }
  };

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

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/listings/${listing.id}`}>
        <div className="relative aspect-[4/3]">
          {listing.images && listing.images.length > 0 ? (
            <ProxiedImage
              src={listing.images[0]}
              alt={listing.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <Home className="h-12 w-12 text-gray-400" />
            </div>
          )}
          
          <div className="absolute top-3 left-3 flex gap-2">
            {/* Platform badge or other info could go here */}
          </div>
          
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-3 right-3 bg-white/80 hover:bg-white"
            onClick={handleSaveClick}
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </Link>
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">
              <Link 
                href={`/listings/${listing.id}`}
                className="hover:underline"
              >
                {listing.title}
              </Link>
            </CardTitle>
          </div>
          <div className="text-right">
            <div className="font-bold text-lg">{formatPrice(listing.price, listing.warm_rent)}</div>
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
            {formatDate(listing.available_from)}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-col h-full pt-0">
        <div className="flex items-end justify-between mt-auto">
          <Badge variant="outline" className="text-xs">
            {getPlatformName(listing.platform)}
          </Badge>
          <Button size="sm" asChild>
            <Link href={`/listings/${listing.id}`}>
              View Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}