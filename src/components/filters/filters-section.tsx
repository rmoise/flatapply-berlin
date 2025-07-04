import { Suspense } from 'react'
import { FiltersSectionContent } from './filters-section-content'

interface FiltersSectionProps {
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

function FiltersSectionFallback() {
  return (
    <section className="border-b sticky top-16 z-40 bg-background">
      <div className="container px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="h-9" /> {/* Placeholder height */}
      </div>
    </section>
  )
}

export function FiltersSection(props: FiltersSectionProps) {
  return (
    <Suspense fallback={<FiltersSectionFallback />}>
      <FiltersSectionContent {...props} />
    </Suspense>
  )
}