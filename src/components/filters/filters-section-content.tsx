'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SlidersHorizontal } from 'lucide-react'
import { DistrictFilter } from './district-filter'
import { PriceFilter } from './price-filter'
import { RoomsFilter } from './rooms-filter'
import { MoreFilters } from './more-filters'
import { updateUserPreferences } from '@/features/preferences/actions'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface FiltersSectionContentProps {
  user?: any
  preferences?: any
  districts: string[]
  initialFilters: {
    minRent?: number
    maxRent?: number
    minRooms?: number
    maxRooms?: number
    districts?: string[]
    sortBy: string
    minSize?: number
    maxSize?: number
    propertyTypes?: string[]
    sharedGenderPreference?: string
    sharedMinAge?: number
    sharedMaxAge?: number
    sharedSmokingAllowed?: boolean | null
    sharedPetsAllowed?: boolean | null
  }
}

export function FiltersSectionContent({ user, preferences, districts, initialFilters }: FiltersSectionContentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Initialize state from URL params first, then preferences only if user is logged in
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(
    initialFilters.districts || (user && preferences?.preferred_districts) || []
  )
  const [priceRange, setPriceRange] = useState({
    min: initialFilters.minRent ?? (user && preferences?.min_rent) ?? 300,
    max: initialFilters.maxRent ?? (user && preferences?.max_rent) ?? 3000
  })
  const [roomsRange, setRoomsRange] = useState({
    min: initialFilters.minRooms ?? (user && preferences?.min_rooms) ?? 1,
    max: initialFilters.maxRooms ?? (user && preferences?.max_rooms) ?? 3
  })
  const [sortBy, setSortBy] = useState(initialFilters.sortBy)
  const [moreFilters, setMoreFilters] = useState({
    minSize: initialFilters.minSize,
    maxSize: initialFilters.maxSize,
    propertyTypes: initialFilters.propertyTypes || [],
    sharedGenderPreference: initialFilters.sharedGenderPreference,
    sharedMinAge: initialFilters.sharedMinAge,
    sharedMaxAge: initialFilters.sharedMaxAge,
    sharedSmokingAllowed: initialFilters.sharedSmokingAllowed,
    sharedPetsAllowed: initialFilters.sharedPetsAllowed
  })

  // Create query string helper using useCallback as per Context7 docs
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  // Handler functions that update both state and URL
  const handleDistrictsChange = useCallback((newDistricts: string[]) => {
    setSelectedDistricts(newDistricts)
    const params = new URLSearchParams(searchParams.toString())
    if (newDistricts.length > 0) {
      params.set('districts', newDistricts.join(','))
    } else {
      params.delete('districts')
    }
    router.push(pathname + '?' + params.toString())
  }, [pathname, router, searchParams])

  const handlePriceChange = useCallback((min: number, max: number) => {
    setPriceRange({ min, max })
    const params = new URLSearchParams(searchParams.toString())
    if (min > 300) params.set('minRent', min.toString())
    else params.delete('minRent')
    if (max < 3000) params.set('maxRent', max.toString())
    else params.delete('maxRent')
    router.push(pathname + '?' + params.toString())
  }, [pathname, router, searchParams])

  const handleRoomsChange = useCallback((min: number, max: number) => {
    setRoomsRange({ min, max })
    const params = new URLSearchParams(searchParams.toString())
    if (min > 1) params.set('minRooms', min.toString())
    else params.delete('minRooms')
    if (max < 3) params.set('maxRooms', max.toString())
    else params.delete('maxRooms')
    router.push(pathname + '?' + params.toString())
  }, [pathname, router, searchParams])

  const handleSortChange = useCallback((newSort: string) => {
    setSortBy(newSort)
    const params = new URLSearchParams(searchParams.toString())
    params.set('sortBy', newSort)
    router.push(pathname + '?' + params.toString())
  }, [pathname, router, searchParams])

  const handleMoreFiltersChange = useCallback((newFilters: typeof moreFilters) => {
    setMoreFilters(newFilters)
    const params = new URLSearchParams(searchParams.toString())
    
    // Update URL with more filter values
    if (newFilters.minSize) params.set('minSize', newFilters.minSize.toString())
    else params.delete('minSize')
    if (newFilters.maxSize) params.set('maxSize', newFilters.maxSize.toString())
    else params.delete('maxSize')
    if (newFilters.propertyTypes && newFilters.propertyTypes.length > 0) {
      params.set('propertyTypes', newFilters.propertyTypes.join(','))
    } else {
      params.delete('propertyTypes')
    }
    
    router.push(pathname + '?' + params.toString())
  }, [pathname, router, searchParams])

  // Auto-save preferences when filters change
  const lastSavedRef = useRef<string>('')
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  useEffect(() => {
    // Don't auto-save if we don't have user/preferences
    if (!user || !preferences) return
    
    // Create a hash of current filter state
    const currentState = JSON.stringify({
      districts: selectedDistricts.sort(),
      minRent: priceRange.min,
      maxRent: priceRange.max,
      minRooms: roomsRange.min,
      maxRooms: roomsRange.max,
      minSize: moreFilters.minSize,
      maxSize: moreFilters.maxSize,
      propertyTypes: moreFilters.propertyTypes?.sort(),
      sharedGenderPreference: moreFilters.sharedGenderPreference,
      sharedMinAge: moreFilters.sharedMinAge,
      sharedMaxAge: moreFilters.sharedMaxAge,
      sharedSmokingAllowed: moreFilters.sharedSmokingAllowed,
      sharedPetsAllowed: moreFilters.sharedPetsAllowed
    })
    
    // Create a hash of preferences state
    const preferencesState = JSON.stringify({
      districts: (preferences.preferred_districts || []).sort(),
      minRent: preferences.min_rent,
      maxRent: preferences.max_rent,
      minRooms: preferences.min_rooms,
      maxRooms: preferences.max_rooms,
      minSize: preferences.min_size,
      maxSize: preferences.max_size,
      propertyTypes: (preferences.property_types || []).sort(),
      sharedGenderPreference: preferences.shared_gender_preference,
      sharedMinAge: preferences.shared_min_age,
      sharedMaxAge: preferences.shared_max_age,
      sharedSmokingAllowed: preferences.shared_smoking_allowed,
      sharedPetsAllowed: preferences.shared_pets_allowed
    })
    
    // Don't save if current state matches what we last saved or current preferences
    if (currentState === lastSavedRef.current || currentState === preferencesState) {
      return
    }
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Auto-save preferences after a short delay
    timeoutRef.current = setTimeout(async () => {
      lastSavedRef.current = currentState
      try {
        await updateUserPreferences(user.id, {
          minRent: priceRange.min,
          maxRent: priceRange.max,
          minRooms: roomsRange.min,
          maxRooms: roomsRange.max,
          districts: selectedDistricts,
          minSize: moreFilters.minSize,
          maxSize: moreFilters.maxSize,
          apartmentTypes: moreFilters.propertyTypes,
          sharedGenderPreference: moreFilters.sharedGenderPreference,
          sharedMinAge: moreFilters.sharedMinAge,
          sharedMaxAge: moreFilters.sharedMaxAge,
          sharedSmokingAllowed: moreFilters.sharedSmokingAllowed,
          sharedPetsAllowed: moreFilters.sharedPetsAllowed,
          active: true
        }, true) // Skip revalidation for autosave
      } catch (error) {
        console.error('Error auto-saving preferences:', error)
        // Reset lastSaved on error so we can retry
        lastSavedRef.current = ''
      }
    }, 1000) // 1 second debounce
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [selectedDistricts, priceRange, roomsRange, moreFilters, user, preferences])

  return (
    <section className="border-b sticky top-16 z-40 bg-background">
      <div className="container px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <DistrictFilter
              districts={districts}
              selectedDistricts={selectedDistricts}
              onChange={handleDistrictsChange}
              userPreferences={preferences?.preferred_districts}
            />
            
            <PriceFilter
              minPrice={priceRange.min}
              maxPrice={priceRange.max}
              onChange={handlePriceChange}
              userPreferences={preferences ? { min: preferences.min_rent, max: preferences.max_rent } : undefined}
            />
            
            <RoomsFilter
              minRooms={roomsRange.min}
              maxRooms={roomsRange.max}
              onChange={handleRoomsChange}
              userPreferences={preferences ? { min: preferences.min_rooms, max: preferences.max_rooms } : undefined}
            />
            
            <MoreFilters
              filters={moreFilters}
              onChange={handleMoreFiltersChange}
              userPreferences={preferences}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">Sort by:</span>
            <Select 
              value={sortBy}
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="size_asc">Size: Small to Large</SelectItem>
                <SelectItem value="size_desc">Size: Large to Small</SelectItem>
                {user && <SelectItem value="match_score">Best Match</SelectItem>}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </section>
  )
}