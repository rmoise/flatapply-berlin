'use client';

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { runManualScrape } from "@/features/listings/actions/scraping"

export function ManualScrapeButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleScrape = async () => {
    setIsLoading(true)
    toast.info("Starting manual scrape...")

    try {
      const result = await runManualScrape()
      
      if (result.success) {
        toast.success(`Scrape completed! Found ${result.totalFound} listings, saved ${result.totalSaved} new ones.`)
        // The server action already revalidates the page
      } else {
        toast.error(result.error || 'Scrape failed')
      }
    } catch (error) {
      console.error('Manual scrape error:', error)
      toast.error('Failed to start scraping job')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      onClick={handleScrape}
      disabled={isLoading}
    >
      <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      {isLoading ? 'Scraping...' : 'Refresh Listings'}
    </Button>
  )
}