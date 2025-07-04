import { getUser } from '@/lib/auth/utils'
import { getPublicListings, getUserListings } from '@/features/listings/actions'
import { getDistrictOptions } from '@/features/preferences/actions'
import { PublicListingCard } from '@/features/listings/components/public-listing-card'
import { ListingCard } from '@/features/listings/components/listing-card'
import { Button } from '@/components/ui/button'
import { SlidersHorizontal, Settings } from 'lucide-react'
import Link from 'next/link'
import { Hero } from '@/components/layout/hero'
import { FiltersSection } from '@/components/filters/filters-section'
import { createClient } from '@/lib/supabase/server'

interface SearchParams {
  page?: string;
  sortBy?: string;
  minRent?: string;
  maxRent?: string;
  minRooms?: string;
  maxRooms?: string;
  districts?: string;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getUser()
  const params = await searchParams;
  
  // Parse filters from search params
  const filters = {
    page: parseInt(params.page || '1'),
    sortBy: (params.sortBy as 'newest' | 'price_asc' | 'price_desc' | 'size_asc' | 'size_desc' | 'match_score') || 'newest',
    minRent: params.minRent && parseInt(params.minRent) > 300 ? parseInt(params.minRent) : undefined,
    maxRent: params.maxRent && parseInt(params.maxRent) < 3000 ? parseInt(params.maxRent) : undefined,
    minRooms: params.minRooms && parseInt(params.minRooms) > 1 ? parseInt(params.minRooms) : undefined,
    maxRooms: params.maxRooms && parseInt(params.maxRooms) < 3 ? parseInt(params.maxRooms) : undefined,
    districts: params.districts ? params.districts.split(',') : undefined,
    limit: 12,
  }
  
  console.log('🏠 Homepage raw params:', params);
  console.log('🔧 Parsed filters:', JSON.stringify(filters, null, 2));
  
  // Fetch available districts
  const districts = await getDistrictOptions()

  // Fetch listings based on authentication status
  let listings = []
  let matches = []
  let pagination = { page: 1, limit: 12, total: 0, totalPages: 0 }
  let preferences = null
  let isPersonalized = false
  
  // Always fetch public listings first
  const publicResult = await getPublicListings(filters)
  listings = publicResult.listings || []
  pagination = publicResult.pagination || pagination
  
  console.log(`📊 PUBLIC LISTINGS: Found ${listings.length} listings with filters:`, JSON.stringify(filters));
  
  if (user) {
    // Check if user has preferences
    const supabase = await createClient()
    const { data: userPrefs } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    preferences = userPrefs
    
    // If user has active preferences and there are matches, show personalized view
    if (preferences && preferences.is_active) {
      // Try to get matches, but don't fail if there are none
      try {
        const { data: userMatches } = await supabase
          .from('user_matches')
          .select(`
            *,
            listings!inner(*)
          `)
          .eq('user_id', user.id)
          .is('dismissed_at', null)
          .eq('listings.is_active', true)
          .is('listings.deactivated_at', null)
          .order('match_score', { ascending: false })
          .limit(100)
        
        if (userMatches && userMatches.length > 0) {
          matches = userMatches
          listings = matches
            .map((match) => match.listings)
            .filter((listing): listing is NonNullable<typeof listing> => listing !== null && listing !== undefined)
          isPersonalized = true
        }
      } catch (error) {
        // If error fetching matches, just use public listings
        console.error('Error fetching matches:', error)
      }
    }
  }

  return (
    <>

      {/* Hero Section - Only show for non-authenticated users */}
      {!user && <Hero />}

      {/* Filters Bar */}
      <FiltersSection 
        user={user}
        preferences={preferences}
        districts={districts}
        initialFilters={filters}
      />

      {/* Listings Grid */}
      <div>
        <div className="container px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {((user && isPersonalized) ? matches.length === 0 : listings.length === 0) ? (
            <div className="text-center py-16">
              <h3 className="text-lg font-medium mb-2">
                {isPersonalized ? 'No matches found' : 'No listings found'}
              </h3>
              <p className="text-muted-foreground">
                {isPersonalized 
                  ? 'No apartments match your preferences right now. We&apos;ll notify you when new ones arrive!'
                  : 'Try adjusting your filters or check back later for new listings.'}
              </p>
            </div>
          ) : (
            <>
              {/* Section header */}
              {user && isPersonalized && (
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold mb-2">Your Personalized Matches</h2>
                  <p className="text-muted-foreground">
                    Found {pagination.total} {pagination.total === 1 ? 'apartment' : 'apartments'} matching your preferences
                  </p>
                </div>
              )}
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {user && isPersonalized ? (
                  // For authenticated users with preferences, use matches array
                  matches.map((match) => (
                    <ListingCard 
                      key={match.listings.id} 
                      listing={match.listings}
                      match={match}
                      userId={user.id}
                    />
                  ))
                ) : (
                  // For all other cases (non-authenticated or authenticated without preferences)
                  listings.map((listing) => (
                    <PublicListingCard 
                      key={listing.id} 
                      listing={listing}
                      isAuthenticated={!!user}
                    />
                  ))
                )}
              </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={pagination.page <= 1}
                    asChild={pagination.page > 1}
                  >
                    {pagination.page > 1 ? (
                      <Link href={`?page=${pagination.page - 1}`}>
                        Previous
                      </Link>
                    ) : (
                      <span>Previous</span>
                    )}
                  </Button>
                  
                  <span className="text-sm text-muted-foreground px-4">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    asChild={pagination.page < pagination.totalPages}
                  >
                    {pagination.page < pagination.totalPages ? (
                      <Link href={`?page=${pagination.page + 1}`}>
                        Next
                      </Link>
                    ) : (
                      <span>Next</span>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
        
        </div>
      </div>
    </>
  )
}