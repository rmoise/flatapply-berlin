'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MapPin } from 'lucide-react'

interface DistrictFilterProps {
  districts: string[]
  selectedDistricts: string[]
  onChange: (districts: string[]) => void
  userPreferences?: string[]
}

export function DistrictFilter({ 
  districts, 
  selectedDistricts, 
  onChange,
  userPreferences 
}: DistrictFilterProps) {
  const [open, setOpen] = useState(false)

  const toggleDistrict = (district: string) => {
    const newSelection = selectedDistricts.includes(district)
      ? selectedDistricts.filter(d => d !== district)
      : [...selectedDistricts, district]
    onChange(newSelection)
  }


  const getButtonText = () => {
    if (selectedDistricts.length === 0) return 'All Districts'
    if (selectedDistricts.length === districts.length) return 'All Districts'
    if (selectedDistricts.length === 1) return selectedDistricts[0]
    if (selectedDistricts.length === 2) return selectedDistricts.join(', ')
    return `${selectedDistricts.length} Districts`
  }

  const matchesPreferences = userPreferences && 
    JSON.stringify(selectedDistricts.sort()) === JSON.stringify(userPreferences.sort())

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={matchesPreferences ? "border-primary" : ""}
        >
          <MapPin className={`mr-2 h-4 w-4 ${matchesPreferences ? "text-primary" : ""}`} />
          <span className="hidden sm:inline">{getButtonText()}</span>
          <span className="sm:hidden">Districts</span>
          {selectedDistricts.length > 0 && (
            <span className="ml-1 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-medium">Select Districts</div>
            {selectedDistricts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange([])}
                className="h-7 px-2 text-xs"
              >
                Clear
              </Button>
            )}
          </div>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              
              {/* Individual Districts */}
              {districts.map((district) => (
                <div key={district} className="flex items-center space-x-2">
                  <Checkbox
                    id={district}
                    checked={selectedDistricts.includes(district)}
                    onCheckedChange={() => toggleDistrict(district)}
                  />
                  <Label
                    htmlFor={district}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {district}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
          {userPreferences && selectedDistricts.length > 0 && (
            <div className="pt-2 border-t">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onChange(userPreferences)}
                className="w-full text-xs"
              >
                Reset to my preferences
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}