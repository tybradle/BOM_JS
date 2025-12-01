'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import type { Contact } from '@/types/glenair'

interface ContactSizeDisplayProps {
  contacts: { pins: Contact[], sockets: Contact[] } | null
  selectedSize: string | null
  onSelect: (size: string) => void
  disabled?: boolean
}

export function ContactSizeDisplay({
  contacts,
  selectedSize,
  onSelect,
  disabled = false
}: ContactSizeDisplayProps) {
  if (!contacts) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Step 2: Contact Size</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Complete Step 1 to see available contact sizes
          </p>
        </CardContent>
      </Card>
    )
  }

  // Extract unique contact sizes from pins and sockets
  const allContacts = [...contacts.pins, ...contacts.sockets]
  const uniqueSizes = new Map<string, { pins: Contact[], sockets: Contact[] }>()

  allContacts.forEach(contact => {
    // Extract size from part number or use a pattern to identify size
    // Common sizes: 22D, 20, 16, 12, etc.
    const sizeMatch = contact.part_number.match(/(\d+D?)/i)
    const size = sizeMatch ? sizeMatch[1] : 'Unknown'
    
    if (!uniqueSizes.has(size)) {
      uniqueSizes.set(size, { pins: [], sockets: [] })
    }
    
    const sizeData = uniqueSizes.get(size)!
    if (contact.type === 'pin') {
      sizeData.pins.push(contact)
    } else {
      sizeData.sockets.push(contact)
    }
  })

  // If no sizes found, show all contacts as options
  if (uniqueSizes.size === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Step 2: Contact Size
            {selectedSize && <Badge variant="secondary">{selectedSize}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No compatible contact sizes found for selected wire gauge
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Step 2: Contact Size
          {selectedSize && <Badge variant="secondary">{selectedSize}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from(uniqueSizes.entries()).map(([size, data]) => {
            const isSelected = selectedSize === size
            const pinCount = data.pins.length
            const socketCount = data.sockets.length
            const samplePin = data.pins[0]
            const sampleSocket = data.sockets[0]

            return (
              <Button
                key={size}
                variant={isSelected ? 'default' : 'outline'}
                className="h-auto flex-col items-start p-3 relative"
                onClick={() => onSelect(size)}
                disabled={disabled}
              >
                {isSelected && (
                  <Check className="absolute top-2 right-2 h-4 w-4" />
                )}
                <span className="font-bold text-lg">{size}</span>
                <div className="text-xs text-left mt-1 space-y-1">
                  {pinCount > 0 && (
                    <div>
                      <span className="font-medium">Pins:</span> {pinCount}
                      {samplePin?.awg_range && (
                        <span className="ml-1 opacity-70">({samplePin.awg_range})</span>
                      )}
                    </div>
                  )}
                  {socketCount > 0 && (
                    <div>
                      <span className="font-medium">Sockets:</span> {socketCount}
                      {sampleSocket?.awg_range && (
                        <span className="ml-1 opacity-70">({sampleSocket.awg_range})</span>
                      )}
                    </div>
                  )}
                </div>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
