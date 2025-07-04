'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Home } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface RoomsFilterProps {
  minRooms: number
  maxRooms: number
  onChange: (min: number, max: number) => void
  userPreferences?: { min: number; max: number }
}

export function RoomsFilter({ 
  minRooms, 
  maxRooms, 
  onChange,
  userPreferences 
}: RoomsFilterProps) {
  const [open, setOpen] = useState(false)

  const handleMinChange = (value: string) => {
    const minNum = parseFloat(value)
    const maxNum = maxRooms
    if (minNum > maxNum) {
      onChange(minNum, minNum)
    } else {
      onChange(minNum, maxNum)
    }
  }

  const handleMaxChange = (value: string) => {
    const minNum = minRooms
    const maxNum = parseFloat(value)
    if (maxNum < minNum) {
      onChange(maxNum, maxNum)
    } else {
      onChange(minNum, maxNum)
    }
  }

  const getButtonText = () => {
    if (minRooms === maxRooms) {
      return minRooms === 1 ? '1 Room' : `${minRooms} Rooms`
    }
    return `${minRooms}-${maxRooms} Rooms`
  }

  const matchesPreferences = userPreferences && 
    minRooms === userPreferences.min && 
    maxRooms === userPreferences.max

  const roomOptions = [1, 1.5, 2, 2.5, 3, 3.5, 4, 5]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={matchesPreferences ? "border-primary" : ""}
        >
          <Home className={`mr-2 h-4 w-4 ${matchesPreferences ? "text-primary" : ""}`} />
          {getButtonText()}
          {matchesPreferences && (
            <span className="ml-1 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Number of Rooms</Label>
            <p className="text-xs text-muted-foreground mt-1">
              In Germany, rooms exclude kitchen and bathroom
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-rooms" className="text-xs">Minimum</Label>
              <Select value={minRooms.toString()} onValueChange={handleMinChange}>
                <SelectTrigger id="min-rooms">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roomOptions.map(room => (
                    <SelectItem key={room} value={room.toString()}>
                      {room} {room === 1 ? 'Room' : 'Rooms'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max-rooms" className="text-xs">Maximum</Label>
              <Select value={maxRooms.toString()} onValueChange={handleMaxChange}>
                <SelectTrigger id="max-rooms">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roomOptions.map(room => (
                    <SelectItem key={room} value={room.toString()}>
                      {room} {room === 1 ? 'Room' : 'Rooms'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {userPreferences && (
            <div className="pt-2 border-t">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  onChange(userPreferences.min, userPreferences.max)
                }}
                className="w-full text-xs"
              >
                Reset to my preferences ({userPreferences.min}-{userPreferences.max} Rooms)
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}