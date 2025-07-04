'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Euro } from 'lucide-react'

interface PriceFilterProps {
  minPrice: number
  maxPrice: number
  onChange: (min: number, max: number) => void
  userPreferences?: { min: number; max: number }
}

export function PriceFilter({ 
  minPrice, 
  maxPrice, 
  onChange,
  userPreferences 
}: PriceFilterProps) {
  const [open, setOpen] = useState(false)
  const [range, setRange] = useState([minPrice, maxPrice])

  const handleChange = (newRange: number[]) => {
    setRange(newRange)
  }

  const handleCommit = () => {
    onChange(range[0], range[1])
  }

  const formatPrice = (price: number) => `€${price}`

  const matchesPreferences = userPreferences && 
    minPrice === userPreferences.min && 
    maxPrice === userPreferences.max

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={matchesPreferences ? "border-primary" : ""}
        >
          <Euro className={`mr-2 h-4 w-4 ${matchesPreferences ? "text-primary" : ""}`} />
          {formatPrice(minPrice)} - {formatPrice(maxPrice)}
          {matchesPreferences && (
            <span className="ml-1 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Monthly Rent (Warm)</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Including utilities and additional costs
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{formatPrice(range[0])}</span>
              <span>{formatPrice(range[1])}</span>
            </div>
            <Slider
              min={300}
              max={3000}
              step={50}
              value={range}
              onValueChange={handleChange}
              onValueCommit={handleCommit}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>Min: {formatPrice(300)}</div>
            <div className="text-right">Max: {formatPrice(3000)}</div>
          </div>

          {userPreferences && (
            <div className="pt-2 border-t">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setRange([userPreferences.min, userPreferences.max])
                  onChange(userPreferences.min, userPreferences.max)
                }}
                className="w-full text-xs"
              >
                Reset to my preferences ({formatPrice(userPreferences.min)} - {formatPrice(userPreferences.max)})
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}