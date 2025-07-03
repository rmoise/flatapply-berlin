import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

interface ListingContext {
  listingId?: string
  title?: string
  district?: string
  price?: number
  warmRent?: number
  propertyType?: string
  rooms?: number
}

export function useListingContext() {
  const searchParams = useSearchParams()
  const [listingContext, setListingContext] = useState<ListingContext | null>(null)
  
  useEffect(() => {
    const listingId = searchParams.get('listing')
    if (listingId) {
      // In a real app, fetch listing details from the database
      // For now, we'll use the listing details passed via state
      // or stored in sessionStorage
      const stored = sessionStorage.getItem(`listing-context-${listingId}`)
      if (stored) {
        setListingContext(JSON.parse(stored))
      }
    }
  }, [searchParams])
  
  const getSuggestedContent = () => {
    if (!listingContext) return null
    
    return {
      // Tailor the introduction based on the district
      introduction: listingContext.district 
        ? `I am particularly interested in your property in ${listingContext.district}, as I have been specifically looking for accommodation in this area.`
        : null,
      
      // Emphasize income if rent is high
      incomeEmphasis: listingContext.warmRent && listingContext.warmRent > 1500
        ? "With my stable income significantly exceeding the rental requirements, I can assure timely payments."
        : null,
      
      // Mention property type preference
      propertyMatch: listingContext.propertyType
        ? `Your ${listingContext.rooms}-room ${listingContext.propertyType.toLowerCase()} perfectly matches what I've been searching for.`
        : null,
      
      // District-specific interests
      districtInterests: getDistrictInterests(listingContext.district)
    }
  }
  
  return {
    listingContext,
    isFromListing: !!listingContext,
    getSuggestedContent
  }
}

function getDistrictInterests(district?: string): string | null {
  if (!district) return null
  
  const districtInfo: Record<string, string> = {
    "Prenzlauer Berg": "I appreciate the family-friendly atmosphere and excellent cafes in Prenzlauer Berg.",
    "Kreuzberg": "The vibrant cultural scene and international community in Kreuzberg aligns perfectly with my lifestyle.",
    "Mitte": "The central location of Mitte would be ideal for my work commute.",
    "Charlottenburg": "I value the elegant, quieter atmosphere of Charlottenburg.",
    "Friedrichshain": "The dynamic, young energy of Friedrichshain appeals to me.",
    "Neukölln": "I'm drawn to Neukölln's diverse community and emerging cultural scene.",
    "Wedding": "Wedding's authentic character and growing arts scene interest me.",
    "Schöneberg": "The LGBTQ+-friendly atmosphere and village feel of Schöneberg suits me well."
  }
  
  return districtInfo[district] || null
}