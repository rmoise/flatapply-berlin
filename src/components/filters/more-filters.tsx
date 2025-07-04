'use client'

// This component requires client-side interactivity:
// - useState for managing local filter state and popover open state
// - Interactive checkboxes, sliders, and radio buttons
// - Dynamic UI updates based on property type selections
// - Tabs navigation between General and Shared Living sections

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { SlidersHorizontal, HelpCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface MoreFiltersProps {
  filters: {
    minSize?: number
    maxSize?: number
    propertyTypes?: string[]
    sharedGenderPreference?: string
    sharedMinAge?: number
    sharedMaxAge?: number
    sharedSmokingAllowed?: boolean | null
    sharedPetsAllowed?: boolean | null
  }
  onChange: (filters: any) => void
  userPreferences?: any
}

const propertyTypeOptions = {
  regular: [
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'studio', label: 'Studio' },
    { value: 'loft', label: 'Loft' },
    { value: 'penthouse', label: 'Penthouse' },
    { value: 'maisonette', label: 'Maisonette' },
    { value: 'attic', label: 'Attic' },
    { value: 'ground_floor', label: 'Ground Floor' },
    { value: 'basement', label: 'Basement' },
  ],
  shared: [
    { value: 'room_in_shared', label: 'Room in Shared Flat' },
    { value: 'student_housing', label: 'Student Housing' },
    { value: 'sublet', label: 'Sublet' },
  ]
}

export function MoreFilters({ filters, onChange, userPreferences }: MoreFiltersProps) {
  // Local state for managing filter values and UI state
  const [open, setOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState(filters)
  const [sizeRange, setSizeRange] = useState([
    filters.minSize || 40,
    filters.maxSize || 80
  ])
  const [sharedAgeRange, setSharedAgeRange] = useState([
    filters.sharedMinAge || 18,
    filters.sharedMaxAge || 45
  ])

  const handleApply = () => {
    onChange({
      ...localFilters,
      minSize: sizeRange[0],
      maxSize: sizeRange[1],
      sharedMinAge: sharedAgeRange[0],
      sharedMaxAge: sharedAgeRange[1]
    })
    setOpen(false)
  }

  const handleReset = () => {
    setLocalFilters({
      propertyTypes: [],
      sharedGenderPreference: undefined,
      sharedSmokingAllowed: null,
      sharedPetsAllowed: null
    })
    setSizeRange([40, 80])
    setSharedAgeRange([18, 45])
  }

  const hasActiveFilters = 
    (localFilters.propertyTypes && localFilters.propertyTypes.length > 0) ||
    localFilters.minSize !== undefined ||
    localFilters.maxSize !== undefined ||
    localFilters.sharedGenderPreference !== undefined ||
    localFilters.sharedMinAge !== undefined ||
    localFilters.sharedMaxAge !== undefined ||
    localFilters.sharedSmokingAllowed !== null ||
    localFilters.sharedPetsAllowed !== null

  // Interactive handler for property type checkboxes
  const togglePropertyType = (type: string) => {
    const currentTypes = localFilters.propertyTypes || []
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type]
    setLocalFilters({ ...localFilters, propertyTypes: newTypes })
  }

  const hasSharedLiving = localFilters.propertyTypes?.some(type => 
    type === 'room_in_shared' || type === 'student_housing'
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={hasActiveFilters ? "border-primary" : ""}
        >
          <SlidersHorizontal className={`mr-2 h-4 w-4 ${hasActiveFilters ? "text-primary" : ""}`} />
          <span className="hidden sm:inline">More Filters</span>
          <span className="sm:hidden">More</span>
          {hasActiveFilters && (
            <span className="ml-1 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px]" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">More Filters</h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-xs"
              >
                Reset
              </Button>
            )}
          </div>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="shared">Shared Living</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              {/* Size Range with interactive slider */}
              <div className="space-y-2">
                <Label className="text-sm">Size (m²)</Label>
                <div className="px-2">
                  <Slider
                    value={sizeRange}
                    onValueChange={setSizeRange}
                    min={20}
                    max={150}
                    step={5}
                    className="mb-4"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{sizeRange[0]}m²</span>
                    <span>{sizeRange[1]}m²</span>
                  </div>
                </div>
              </div>

              {/* Property Types with interactive checkboxes */}
              <div className="space-y-3">
                <Label className="text-sm">Property Types</Label>
                
                {/* Regular Properties Only */}
                <div className="grid grid-cols-2 gap-2">
                  {propertyTypeOptions.regular.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.value}
                        checked={localFilters.propertyTypes?.includes(option.value) || false}
                        onCheckedChange={() => togglePropertyType(option.value)}
                      />
                      <Label
                        htmlFor={option.value}
                        className="text-xs font-normal cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="shared" className="space-y-4">
              {/* Shared Living Property Types */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Shared Living Types</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Select shared living options to enable preferences below</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {propertyTypeOptions.shared.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`shared-${option.value}`}
                        checked={localFilters.propertyTypes?.includes(option.value) || false}
                        onCheckedChange={() => togglePropertyType(option.value)}
                      />
                      <Label
                        htmlFor={`shared-${option.value}`}
                        className="text-xs font-normal cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {!hasSharedLiving && (
                <div className="text-xs text-muted-foreground text-center py-4 border rounded-md bg-muted/20">
                  Select a shared living type above to enable additional preferences
                </div>
              )}
              
              {hasSharedLiving && (
                <>
                  {/* Gender Preference with interactive radio buttons */}
                  <div className="space-y-2">
                    <Label className="text-sm">Gender Preference</Label>
                    <RadioGroup 
                      value={localFilters.sharedGenderPreference || 'any'}
                      onValueChange={(value) => setLocalFilters({ 
                        ...localFilters, 
                        sharedGenderPreference: value !== 'any' ? value : undefined 
                      })}
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="any" id="any" />
                          <Label htmlFor="any" className="text-xs font-normal">Any</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="female" id="female" />
                          <Label htmlFor="female" className="text-xs font-normal">Female only</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="male" id="male" />
                          <Label htmlFor="male" className="text-xs font-normal">Male only</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="mixed" id="mixed" />
                          <Label htmlFor="mixed" className="text-xs font-normal">Mixed</Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Age Range with interactive slider */}
                  <div className="space-y-2">
                    <Label className="text-sm">Flatmate Age Range</Label>
                    <div className="px-2">
                      <Slider
                        value={sharedAgeRange}
                        onValueChange={setSharedAgeRange}
                        min={18}
                        max={60}
                        step={1}
                        className="mb-4"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{sharedAgeRange[0]} years</span>
                        <span>{sharedAgeRange[1]} years</span>
                      </div>
                    </div>
                  </div>

                  {/* House Rules with interactive checkboxes */}
                  <div className="space-y-2">
                    <Label className="text-sm">House Rules</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="smoking"
                          checked={localFilters.sharedSmokingAllowed === true}
                          onCheckedChange={(checked) => setLocalFilters({ 
                            ...localFilters, 
                            sharedSmokingAllowed: checked === true ? true : null
                          })}
                        />
                        <Label htmlFor="smoking" className="text-xs font-normal">
                          Smoking allowed
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="pets"
                          checked={localFilters.sharedPetsAllowed === true}
                          onCheckedChange={(checked) => setLocalFilters({ 
                            ...localFilters, 
                            sharedPetsAllowed: checked === true ? true : null
                          })}
                        />
                        <Label htmlFor="pets" className="text-xs font-normal">
                          Pets allowed
                        </Label>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

          {/* Interactive action buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}