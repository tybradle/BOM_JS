'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { useBOMStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { AlertCircle, Check, Copy, RotateCcw, Loader2, Info } from 'lucide-react'
import type { WireSystem, Contact } from '@/types/glenair'
import { SHELL_STYLES } from './ShellStyleSelector'
import { convertWireGauge } from '@/lib/glenair/wire-gauge'

interface PartNumberBuilderProps {
  catalogId: string
  onComplete?: () => void
}

export function PartNumberBuilder({
  catalogId,
  onComplete
}: PartNumberBuilderProps) {
  const {
    glenairBuilder,
    loading,
    error,
    setGlenairBuilderState,
    resetGlenairBuilder,
    fetchGlenairWireSizes,
    fetchGlenairContactSizes,
    fetchGlenairContacts,
    fetchGlenairArrangements,
    buildGlenairPart
  } = useBOMStore()

  const {
    wireSelection,
    availableWireSizes,
    availableContactSizes,
    contactSize,
    availableContacts,
    arrangement,
    availableArrangements,
    shellStyle,
    selectedContacts,
    result
  } = glenairBuilder

  // Local state for form inputs
  const [system, setSystem] = useState<WireSystem>('AWG')
  const [wireValue, setWireValue] = useState('')
  const [conductorCount, setConductorCount] = useState(1)
  const [copied, setCopied] = useState(false)
  
  // Ref to track and cancel in-flight contact size requests
  const contactSizeFetchRef = useRef<AbortController | null>(null)

  // Load wire sizes when component mounts
  useEffect(() => {
    fetchGlenairWireSizes(catalogId).catch(console.error)
  }, [catalogId, fetchGlenairWireSizes])

  // Calculate equivalent wire value
  const equivalent = wireValue ? (() => {
    const numValue = parseFloat(wireValue)
    if (isNaN(numValue)) return null
    const targetSystem = system === 'AWG' ? 'MM2' : 'AWG'
    const converted = convertWireGauge(numValue, system, targetSystem)
    return converted !== null ? `${converted.toFixed(2)} ${targetSystem === 'AWG' ? 'AWG' : 'mm²'}` : null
  })() : null

  // Get available wire options based on selected system
  const availableOptions = system === 'AWG' ? availableWireSizes.awg : availableWireSizes.mm2

  // Handle wire selection change
  const handleWireChange = useCallback(async (newWireValue: string) => {
    setWireValue(newWireValue)
    if (newWireValue && conductorCount > 0) {
      setGlenairBuilderState({
        wireSelection: { system, wireValue: newWireValue, conductorCount },
        // Reset downstream
        contactSize: null,
        availableContactSizes: [],
        availableContacts: null,
        arrangement: null,
        availableArrangements: [],
        shellStyle: null,
        selectedContacts: [],
        result: null
      })
      
      // Cancel any previous in-flight request
      if (contactSizeFetchRef.current) {
        contactSizeFetchRef.current.abort()
      }
      
      // Create new abort controller for this request
      const controller = new AbortController()
      contactSizeFetchRef.current = controller
      
      // Fetch compatible contact sizes based on wire selection
      try {
        await fetchGlenairContactSizes(catalogId, newWireValue, system)
      } catch (err) {
        // Ignore abort errors (expected when user changes selection quickly)
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
        console.error('Failed to fetch compatible contact sizes:', err)
      }
    }
  }, [system, conductorCount, catalogId, setGlenairBuilderState, fetchGlenairContactSizes])

  // Handle system change
  const handleSystemChange = (newSystem: WireSystem) => {
    setSystem(newSystem)
    setWireValue('') // Reset wire value when system changes
    setGlenairBuilderState({
      wireSelection: null,
      contactSize: null,
      availableContactSizes: [],
      availableContacts: null,
      arrangement: null,
      availableArrangements: [],
      shellStyle: null,
      selectedContacts: [],
      result: null
    })
  }

  // Handle conductor count change
  const handleConductorCountChange = (count: number) => {
    setConductorCount(count)
    if (wireValue && count > 0) {
      setGlenairBuilderState({
        wireSelection: { system, wireValue, conductorCount: count },
        arrangement: null,
        availableArrangements: [],
        result: null
      })
    }
  }

  // Handle contact size selection (Step 2) - triggers contact filtering
  const handleContactSizeSelect = useCallback(async (size: string) => {
    // Reset downstream selections when contact size changes
    setGlenairBuilderState({
      contactSize: size,
      selectedContacts: [],
      arrangement: null,
      availableArrangements: [],
      shellStyle: null,
      result: null
    })
  }, [setGlenairBuilderState])

  // Handle arrangement selection
  const handleArrangementSelect = useCallback((arr: string) => {
    setGlenairBuilderState({
      arrangement: arr,
      shellStyle: null,
      result: null
    })
  }, [setGlenairBuilderState])

  // Handle shell style selection
  const handleShellStyleSelect = useCallback((style: string) => {
    setGlenairBuilderState({
      shellStyle: style,
      result: null
    })
  }, [setGlenairBuilderState])

  // Handle contact selection (Step 3) - triggers arrangement fetch
  const handleContactToggle = useCallback(async (contact: Contact) => {
    const exists = selectedContacts.some(c => c.part_number === contact.part_number)
    const newContacts = exists
      ? selectedContacts.filter(c => c.part_number !== contact.part_number)
      : [...selectedContacts, contact]
    
    setGlenairBuilderState({
      selectedContacts: newContacts,
      arrangement: null,
      availableArrangements: [],
      shellStyle: null,
      result: null
    })

    // Fetch arrangements using the already-selected contact size
    if (newContacts.length > 0 && wireSelection && contactSize) {
      // Fetch arrangements for this contact size and conductor count
      try {
        await fetchGlenairArrangements(catalogId, wireSelection.conductorCount, contactSize)
      } catch (err) {
        console.error('Failed to fetch arrangements:', err)
      }
    }
  }, [selectedContacts, wireSelection, contactSize, catalogId, setGlenairBuilderState, fetchGlenairArrangements])

  // Fetch contacts when wire selection is made (Step 2)
  useEffect(() => {
    if (wireSelection && wireSelection.wireValue) {
      fetchGlenairContacts(
        catalogId,
        wireSelection.wireValue,
        wireSelection.system
      ).catch(console.error)
    }
  }, [catalogId, wireSelection, fetchGlenairContacts])

  // Build part when all selections are made
  const handleBuildPart = useCallback(async () => {
    if (!wireSelection || !contactSize || !arrangement || !shellStyle || selectedContacts.length === 0) {
      return
    }

    try {
      await buildGlenairPart({
        catalogId,
        wireSystem: wireSelection.system,
        wireValue: wireSelection.wireValue,
        conductorCount: wireSelection.conductorCount,
        shellStyle,
        arrangement,
        contactSize,
        selectedContacts
      })
    } catch (err) {
      console.error('Failed to build part:', err)
    }
  }, [catalogId, wireSelection, contactSize, arrangement, shellStyle, selectedContacts, buildGlenairPart])

  // Copy part number to clipboard
  const handleCopy = async () => {
    if (result?.partNumber) {
      await navigator.clipboard.writeText(result.partNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Reset form
  const handleReset = () => {
    setSystem('AWG')
    setWireValue('')
    setConductorCount(1)
    setCopied(false)
    resetGlenairBuilder()
  }

  // Determine which sections are enabled (6-STEP FLOW)
  const canSelectContactSize = wireSelection && wireSelection.wireValue && wireSelection.conductorCount > 0 && availableContactSizes.length > 0
  const canSelectContacts = canSelectContactSize && contactSize && availableContacts
  const canSelectArrangement = selectedContacts.length > 0 && availableArrangements.length > 0
  const isLoadingArrangements = glenairBuilder.isLoadingArrangements
  const arrangementError = glenairBuilder.arrangementError
  const canSelectShellStyle = canSelectArrangement && arrangement
  const canReview = canSelectShellStyle && shellStyle
  const canBuild = canReview && selectedContacts.length > 0

  // Filter contacts by selected contact size
  const filteredPins = availableContacts?.pins.filter(p => p.contact_size === contactSize) || []
  const filteredSockets = availableContacts?.sockets.filter(s => s.contact_size === contactSize) || []

  return (
    <div className="space-y-4">
      {/* Header with Result Preview */}
      <Card className={result ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : ''}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Part Number Builder</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Generated Part Number:</p>
                <p className="text-2xl font-mono font-bold text-green-600 dark:text-green-400">
                  {result.partNumber}
                </p>
              </div>
              <Button onClick={handleCopy} variant="outline">
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Complete the form below to generate a Glenair part number
            </p>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}


      {/* Single Sheet Form */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Section 1: Wire Input */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={wireSelection ? "default" : "secondary"}>1</Badge>
              <h3 className="font-semibold">Wire Input</h3>
              {wireSelection && (
                <Badge variant="outline" className="ml-auto">
                  {wireSelection.wireValue} {wireSelection.system} × {wireSelection.conductorCount}
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6">
              {/* Wire System */}
              <div className="space-y-2">
                <Label>Wire System</Label>
                <RadioGroup
                  value={system}
                  onValueChange={(v) => handleSystemChange(v as WireSystem)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="AWG" id="awg" />
                    <Label htmlFor="awg" className="cursor-pointer">AWG</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="MM2" id="mm2" />
                    <Label htmlFor="mm2" className="cursor-pointer">MM²</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Wire Size */}
              <div className="space-y-2">
                <Label>Wire Size</Label>
                {availableOptions.length > 0 ? (
                  <Select value={wireValue} onValueChange={handleWireChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${system} size`} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOptions.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size} {system === 'AWG' ? 'AWG' : 'mm²'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading wire sizes...</span>
                  </div>
                )}
                {equivalent && (
                  <p className="text-xs text-muted-foreground">≈ {equivalent}</p>
                )}
              </div>

              {/* Conductor Count */}
              <div className="space-y-2">
                <Label>Number of Conductors</Label>
                <Input
                  type="number"
                  min={1}
                  max={200}
                  value={conductorCount}
                  onChange={(e) => handleConductorCountChange(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Section 2: Contact Size Selection */}
          <div className={`space-y-4 ${!canSelectContactSize ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-2">
              <Badge variant={contactSize ? "default" : "secondary"}>2</Badge>
              <h3 className="font-semibold">Contact Size</h3>
              {contactSize && (
                <Badge variant="outline" className="ml-auto">
                  Size {contactSize}
                </Badge>
              )}
            </div>
            
            <div className="pl-6">
              {canSelectContactSize ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {availableContactSizes.map((sizeInfo) => (
                      <TooltipProvider key={sizeInfo.contactSize}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={contactSize === sizeInfo.contactSize ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleContactSizeSelect(sizeInfo.contactSize)}
                            >
                              {sizeInfo.contactSize}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <p className="font-medium">Contact Size: {sizeInfo.contactSize}</p>
                              {sizeInfo.awgRange && <p>AWG: {sizeInfo.awgRange}</p>}
                              {sizeInfo.mm2Range && <p>MM2: {sizeInfo.mm2Range}</p>}
                              <p className="text-xs mt-1">{sizeInfo.partNumbers.length} part number(s)</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {availableContactSizes.length} contact size{availableContactSizes.length !== 1 ? 's' : ''} compatible with {wireValue} {system}
                  </p>
                </div>
              ) : loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading contact sizes...</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Select wire input first</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Section 3: Contact Selection */}
          <div className={`space-y-4 ${!canSelectContacts ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-2">
              <Badge variant={selectedContacts.length > 0 ? "default" : "secondary"}>3</Badge>
              <h3 className="font-semibold">Contact Selection</h3>
              {selectedContacts.length > 0 && (
                <Badge variant="outline" className="ml-auto">
                  {selectedContacts.length} selected
                </Badge>
              )}
            </div>
            
            <div className="pl-6">
              {canSelectContacts && availableContacts ? (
                <div className="space-y-4">
                  {/* Pins */}
                  {filteredPins.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Pins ({filteredPins.length} for size {contactSize})</Label>
                      <div className="flex flex-wrap gap-2">
                        {filteredPins.map((pin) => {
                          const isSelected = selectedContacts.some(c => c.part_number === pin.part_number)
                          return (
                            <TooltipProvider key={pin.part_number}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant={isSelected ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleContactToggle(pin)}
                                  >
                                    {pin.part_number}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-sm">
                                    <p className="font-medium">{pin.part_number}</p>
                                    {pin.contact_size && <p>Contact Size: {pin.contact_size}</p>}
                                    {pin.awg_range && <p>AWG: {pin.awg_range}</p>}
                                    {pin.mm2_range && <p>MM2: {pin.mm2_range}</p>}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Sockets */}
                  {filteredSockets.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Sockets ({filteredSockets.length} for size {contactSize})</Label>
                      <div className="flex flex-wrap gap-2">
                        {filteredSockets.map((socket) => {
                          const isSelected = selectedContacts.some(c => c.part_number === socket.part_number)
                          return (
                            <TooltipProvider key={socket.part_number}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant={isSelected ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleContactToggle(socket)}
                                  >
                                    {socket.part_number}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-sm">
                                    <p className="font-medium">{socket.part_number}</p>
                                    {socket.contact_size && <p>Contact Size: {socket.contact_size}</p>}
                                    {socket.awg_range && <p>AWG: {socket.awg_range}</p>}
                                    {socket.mm2_range && <p>MM2: {socket.mm2_range}</p>}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {filteredPins.length === 0 && filteredSockets.length === 0 && (
                    <p className="text-sm text-muted-foreground">No contacts found for size {contactSize}</p>
                  )}
                </div>
              ) : loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading compatible contacts...</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Select contact size first</p>
              )}
            </div>
          </div>
          <Separator />

          {/* Section 4: Arrangement */}
          <div className={`space-y-4 ${!canSelectArrangement ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-2">
              <Badge variant={arrangement ? "default" : "secondary"}>4</Badge>
              <h3 className="font-semibold">Arrangement</h3>
              {arrangement && (
                <Badge variant="outline" className="ml-auto">{arrangement}</Badge>
              )}
            </div>
            
            <div className="pl-6">
              {isLoadingArrangements ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm text-muted-foreground">Loading arrangements...</span>
                </div>
              ) : arrangementError ? (
                <div className="space-y-2">
                  <p className="text-sm text-destructive">Error loading arrangements</p>
                  <p className="text-xs text-muted-foreground">{arrangementError}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      if (wireSelection && contactSize) {
                        fetchGlenairArrangements(catalogId, wireSelection.conductorCount, contactSize)
                      }
                    }}
                  >
                    Retry
                  </Button>
                </div>
              ) : canSelectArrangement ? (
                <div className="space-y-2">
                  <Select value={arrangement || ''} onValueChange={handleArrangementSelect}>
                    <SelectTrigger className="w-full md:w-64">
                      <SelectValue placeholder="Select arrangement" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableArrangements.map((arr) => (
                        <SelectItem key={arr.arrangement} value={arr.arrangement}>
                          {arr.arrangement} ({arr.count} contacts)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableArrangements.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Found {availableArrangements.length} arrangement{availableArrangements.length !== 1 ? 's' : ''}
                      {availableArrangements.length === 1 && ' - auto-selected'}
                    </p>
                  )}
                </div>
              ) : contactSize && availableArrangements.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">No arrangements found for this configuration</p>
                  <p className="text-xs text-muted-foreground">
                    Try a different contact size or wire gauge
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Select contacts first</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Section 5: Shell Style */}
          <div className={`space-y-4 ${!canSelectShellStyle ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-2">
              <Badge variant={shellStyle ? "default" : "secondary"}>5</Badge>
              <h3 className="font-semibold">Shell Style</h3>
              {shellStyle && (
                <Badge variant="outline" className="ml-auto">{shellStyle}</Badge>
              )}
            </div>
            
            <div className="pl-6">
              {canSelectShellStyle ? (
                <div className="flex flex-wrap gap-2">
                  {SHELL_STYLES.map(({ value, label }) => (
                    <Button
                      key={value}
                      variant={shellStyle === value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleShellStyleSelect(value)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Select arrangement first</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Section 6: Review & Confirm */}
          <div className={`space-y-4 ${!canReview ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-2">
              <Badge variant={canReview ? "default" : "secondary"}>6</Badge>
              <h3 className="font-semibold">Review & Confirm</h3>
            </div>
            
            <div className="pl-6">
              {canReview ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Wire</Label>
                      <p className="font-medium">{wireSelection?.wireValue} {wireSelection?.system}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Conductors</Label>
                      <p className="font-medium">{wireSelection?.conductorCount}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Arrangement</Label>
                      <p className="font-medium">{arrangement}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Shell Style</Label>
                      <p className="font-medium">{shellStyle}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Selected Contacts ({selectedContacts.length})</Label>
                    <div className="border rounded-md p-3 space-y-1">
                      {selectedContacts.map((contact) => (
                        <div key={contact.part_number} className="flex justify-between items-center text-sm">
                          <span className="font-mono">{contact.part_number}</span>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="text-xs">{contact.type}</span>
                            {contact.contact_size && (
                              <span className="text-xs">Size {contact.contact_size}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Complete all previous steps to review</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Build Button */}
          <div className="flex justify-end">
            <Button
              size="lg"
              disabled={!canBuild || loading}
              onClick={handleBuildPart}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Building...
                </>
              ) : (
                'Build Part Number'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
