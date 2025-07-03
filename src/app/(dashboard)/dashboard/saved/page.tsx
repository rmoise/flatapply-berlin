"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Search,
  Heart,
  MapPin,
  Euro,
  Home,
  Calendar,
  ExternalLink,
  Trash2,
  Bell,
  Filter,
  SortAsc
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SavedListing {
  id: string
  listingId: string
  title: string
  address: string
  price: number
  warmRent: number
  size: number
  rooms: number
  image: string
  savedAt: string
  availableFrom: string
  platform: string
  matchScore: number
  status: "available" | "unavailable" | "applied"
  notes?: string
}

const savedListings: SavedListing[] = [
  {
    id: "1",
    listingId: "listing-1",
    title: "Beautiful 2-room apartment in Prenzlauer Berg",
    address: "Stargarder Straße, 10437 Berlin",
    price: 1200,
    warmRent: 1450,
    size: 65,
    rooms: 2,
    image: "/api/placeholder/400/300",
    savedAt: "2024-01-10T10:00:00",
    availableFrom: "2024-03-01",
    platform: "immoscout24",
    matchScore: 92,
    status: "applied",
    notes: "Great location, already applied!"
  },
  {
    id: "2",
    listingId: "listing-5",
    title: "Sunny studio with balcony in Kreuzberg",
    address: "Bergmannstraße, 10961 Berlin",
    price: 950,
    warmRent: 1100,
    size: 42,
    rooms: 1,
    image: "/api/placeholder/400/300",
    savedAt: "2024-01-08T14:30:00",
    availableFrom: "2024-02-15",
    platform: "wg_gesucht",
    matchScore: 88,
    status: "available"
  },
  {
    id: "3",
    listingId: "listing-8",
    title: "Modern 3-room flat near Alexanderplatz",
    address: "Karl-Marx-Allee, 10178 Berlin",
    price: 1600,
    warmRent: 1850,
    size: 85,
    rooms: 3,
    image: "/api/placeholder/400/300",
    savedAt: "2024-01-05T09:15:00",
    availableFrom: "2024-04-01",
    platform: "kleinanzeigen",
    matchScore: 75,
    status: "available",
    notes: "A bit over budget but worth checking"
  },
  {
    id: "4",
    listingId: "listing-12",
    title: "Cozy 1-bedroom in Neukölln",
    address: "Weserstraße, 12047 Berlin",
    price: 800,
    warmRent: 950,
    size: 45,
    rooms: 1.5,
    image: "/api/placeholder/400/300",
    savedAt: "2024-01-03T16:45:00",
    availableFrom: "2024-02-01",
    platform: "immoscout24",
    matchScore: 90,
    status: "unavailable",
    notes: "Landlord said it's no longer available"
  }
]

export default function SavedListingsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "price" | "score">("date")
  const [filterStatus, setFilterStatus] = useState<"all" | "available" | "applied" | "unavailable">("all")

  const filteredListings = savedListings
    .filter(listing => {
      const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           listing.address.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = filterStatus === "all" || listing.status === filterStatus
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
        case "price":
          return a.price - b.price
        case "score":
          return b.matchScore - a.matchScore
        default:
          return 0
      }
    })

  const stats = {
    total: savedListings.length,
    available: savedListings.filter(l => l.status === "available").length,
    applied: savedListings.filter(l => l.status === "applied").length,
    unavailable: savedListings.filter(l => l.status === "unavailable").length
  }

  const handleUnsave = (id: string) => {
    // TODO: Remove from saved listings
    console.log("Unsaving listing:", id)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "Yesterday"
    if (diffInDays < 7) return `${diffInDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Saved Listings</h1>
        <p className="text-muted-foreground mt-1">
          Keep track of apartments you're interested in
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Home className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.available}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applied</CardTitle>
            <ExternalLink className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.applied}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unavailable</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unavailable}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search saved listings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilterStatus("all")}>
                  All Listings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("available")}>
                  Available
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("applied")}>
                  Applied
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("unavailable")}>
                  Unavailable
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <SortAsc className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortBy("date")}>
                  Date Saved
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("price")}>
                  Price (Low to High)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("score")}>
                  Match Score
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Saved Listings Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredListings.map((listing) => (
          <Card key={listing.id} className="overflow-hidden group">
            <div className="relative h-48">
              <Image
                src={listing.image}
                alt={listing.title}
                fill
                className="object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <Badge className="bg-white/90 text-black">
                  {listing.matchScore}% match
                </Badge>
                {listing.status === "applied" && (
                  <Badge className="bg-blue-500/90">Applied</Badge>
                )}
                {listing.status === "unavailable" && (
                  <Badge variant="secondary" className="bg-gray-500/90">Unavailable</Badge>
                )}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 left-2 bg-white/80 hover:bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleUnsave(listing.id)}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>

            <CardContent className="p-4">
              <div className="space-y-2">
                <h3 className="font-semibold line-clamp-1">
                  <Link 
                    href={`/dashboard/listings/${listing.listingId}`}
                    className="hover:underline"
                  >
                    {listing.title}
                  </Link>
                </h3>
                
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="mr-1 h-3 w-3" />
                  {listing.address}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center">
                      <Euro className="mr-1 h-3 w-3" />
                      <span className="font-semibold">{listing.price}</span>
                    </span>
                    <span className="flex items-center text-muted-foreground">
                      <Home className="mr-1 h-3 w-3" />
                      {listing.rooms} rooms, {listing.size}m²
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    Available {new Date(listing.availableFrom).toLocaleDateString()}
                  </span>
                  <span>Saved {formatDate(listing.savedAt)}</span>
                </div>

                {listing.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground italic">{listing.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/dashboard/listings/${listing.listingId}`}>
                      View Details
                    </Link>
                  </Button>
                  {listing.status === "available" && (
                    <Button size="sm" className="flex-1" asChild>
                      <Link href={`/dashboard/listings/${listing.listingId}?apply=true`}>
                        Apply Now
                      </Link>
                    </Button>
                  )}
                  {listing.status === "applied" && (
                    <Button variant="secondary" size="sm" className="flex-1" asChild>
                      <Link href="/dashboard/applications">
                        View Application
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredListings.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No saved listings found</p>
            <Button className="mt-4" asChild>
              <Link href="/dashboard/listings">
                Browse Listings
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Alert for price drops */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="flex flex-row items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">Price Drop Alert</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Enable notifications to get alerted when prices drop on your saved listings.
          </p>
          <Button variant="outline" size="sm" className="mt-3" asChild>
            <Link href="/dashboard/preferences?tab=notifications">
              Manage Notifications
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}