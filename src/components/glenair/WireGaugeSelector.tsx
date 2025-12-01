'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { WireSystem } from '@/types/glenair'
import { convertWireGauge } from '@/lib/glenair/wire-gauge'

export interface WireGaugeSelection {
  system: WireSystem
  wireValue: string
  conductorCount: number
}

interface WireGaugeSelectorProps {
  availableSizes: { awg: string[], mm2: string[] }
  value: WireGaugeSelection | null
  onChange: (value: WireGaugeSelection) => void
  disabled?: boolean
}

export function WireGaugeSelector({
  availableSizes,
  value,
  onChange,
  disabled = false
}: WireGaugeSelectorProps) {
  const [system, setSystem] = useState<WireSystem>(value?.system || 'AWG')
  const [wireValue, setWireValue] = useState(value?.wireValue || '')
  const [conductorCount, setConductorCount] = useState(value?.conductorCount || 1)
  const [equivalent, setEquivalent] = useState<string | null>(null)

  // Get available sizes based on selected system
  const availableOptions = system === 'AWG' ? availableSizes.awg : availableSizes.mm2

  // Calculate equivalent value when wire value changes
  useEffect(() => {
    if (wireValue) {
      const numValue = parseFloat(wireValue)
      if (!isNaN(numValue)) {
        const targetSystem = system === 'AWG' ? 'MM2' : 'AWG'
        const converted = convertWireGauge(numValue, system, targetSystem)
        if (converted !== null) {
          setEquivalent(`${converted.toFixed(2)} ${targetSystem === 'AWG' ? 'AWG' : 'mm²'}`)
        } else {
          setEquivalent(null)
        }
      }
    } else {
      setEquivalent(null)
    }
  }, [wireValue, system])

  // Notify parent of changes
  useEffect(() => {
    if (wireValue && conductorCount > 0) {
      onChange({ system, wireValue, conductorCount })
    }
  }, [system, wireValue, conductorCount, onChange])

  const handleSystemChange = (newSystem: WireSystem) => {
    setSystem(newSystem)
    setWireValue('') // Reset wire value when system changes
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Step 1: Wire Input
          {value?.wireValue && (
            <Badge variant="secondary">
              {value.wireValue} {value.system} × {value.conductorCount}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Wire System Selection */}
        <div className="space-y-2">
          <Label>Wire Gauge System</Label>
          <RadioGroup
            value={system}
            onValueChange={(v) => handleSystemChange(v as WireSystem)}
            className="flex gap-4"
            disabled={disabled}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="AWG" id="awg" />
              <Label htmlFor="awg" className="cursor-pointer">AWG (American Wire Gauge)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="MM2" id="mm2" />
              <Label htmlFor="mm2" className="cursor-pointer">MM² (Metric)</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Wire Size Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Wire Size</Label>
            {availableOptions.length > 0 ? (
              <Select
                value={wireValue}
                onValueChange={setWireValue}
                disabled={disabled}
              >
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
              <Input
                type="text"
                placeholder={`Enter ${system} value`}
                value={wireValue}
                onChange={(e) => setWireValue(e.target.value)}
                disabled={disabled}
              />
            )}
            {equivalent && (
              <p className="text-sm text-muted-foreground">
                ≈ {equivalent}
              </p>
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
              onChange={(e) => setConductorCount(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={disabled}
            />
            <p className="text-sm text-muted-foreground">
              Total contacts needed
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
