'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Plus, X } from 'lucide-react'

interface Location {
  id: string
  name: string
  order: number
  itemCount?: number
}

interface LocationTabsProps {
  locations: Location[]
  selectedLocationId: string | null
  onLocationSelect: (locationId: string) => void
  onLocationAdd: (name: string) => Promise<void>
  onLocationDelete: (locationId: string) => Promise<void>
  loading?: boolean
}

export function LocationTabs({
  locations,
  selectedLocationId,
  onLocationSelect,
  onLocationAdd,
  onLocationDelete,
  loading = false
}: LocationTabsProps) {
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false)
  const [newLocationName, setNewLocationName] = useState('')
  const { toast } = useToast()

  const handleAddLocation = async () => {
    if (!newLocationName.trim()) return

    try {
      await onLocationAdd(newLocationName.trim())
      setNewLocationName('')
      setIsAddLocationOpen(false)
      
      toast({
        title: "Location added",
        description: `Location "${newLocationName}" has been created.`
      })
    } catch (error) {
      toast({
        title: "Failed to add location",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      })
    }
  }

  const handleDeleteLocation = async (locationId: string, locationName: string) => {
    if (!confirm(`Are you sure you want to delete location "${locationName}"? This will also delete all parts in this location.`)) {
      return
    }

    try {
      await onLocationDelete(locationId)
      
      toast({
        title: "Location deleted",
        description: `Location "${locationName}" has been removed.`
      })
    } catch (error) {
      toast({
        title: "Failed to delete location",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      })
    }
  }

  const sortedLocations = [...locations].sort((a, b) => a.order - b.order)

  return (
    <div className="border-b bg-muted/30">
      <div className="flex items-center">
        {/* Location Tabs */}
        <div className="flex flex-1 overflow-x-auto">
          {sortedLocations.length === 0 ? (
            <div className="px-4 py-2 text-sm text-muted-foreground italic">
              No locations created yet. Add a location to get started.
            </div>
          ) : (
            sortedLocations.map((location, index) => (
              <div
                key={location.id}
                className={`group relative flex items-center border-r border-l border-t transition-colors ${
                  selectedLocationId === location.id
                    ? 'bg-background border-t-2 border-t-primary border-l-transparent border-r-transparent'
                    : index % 2 === 0
                    ? 'bg-muted/50 border-t-transparent hover:bg-muted/70'
                    : 'bg-background border-t-transparent hover:bg-muted/30'
                }`}
              >
                <button
                  onClick={() => onLocationSelect(location.id)}
                  className="px-4 py-2 text-sm font-medium text-left min-w-[80px] transition-colors"
                  disabled={loading}
                >
                  <div className="flex items-center gap-2">
                    <span>{location.name}</span>
                    {location.itemCount !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        ({location.itemCount})
                      </span>
                    )}
                  </div>
                </button>
                
                {/* Delete button - only show on hover and if more than 1 location */}
                {sortedLocations.length > 1 && (
                  <button
                    onClick={() => handleDeleteLocation(location.id, location.name)}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive hover:text-destructive-foreground"
                    disabled={loading}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add Location Button */}
        <div className="border-l border-t">
          <Dialog open={isAddLocationOpen} onOpenChange={setIsAddLocationOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-3 border-0 rounded-none hover:bg-muted/50"
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Location
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Location</DialogTitle>
                <DialogDescription>
                  Create a new location tab for organizing parts. Examples: EC1, EC2, MA, LCP, ICP
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="location-name">Location Name</Label>
                  <Input
                    id="location-name"
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    placeholder="e.g., EC1, MA, LCP"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddLocation()
                      }
                    }}
                  />
                </div>
                <Button 
                  onClick={handleAddLocation} 
                  className="w-full" 
                  disabled={loading || !newLocationName.trim()}
                >
                  {loading ? 'Adding...' : 'Add Location'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}