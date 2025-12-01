'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Copy, Plus, Check } from 'lucide-react'
import { useState } from 'react'
import type { Contact, PartBuilderResult } from '@/types/glenair'

interface PartNumberDisplayProps {
  result: PartBuilderResult | null
  onAddToBom?: () => void
  onCopy?: () => void
  loading?: boolean
}

export function PartNumberDisplay({
  result,
  onAddToBom,
  onCopy,
  loading = false
}: PartNumberDisplayProps) {
  const [copied, setCopied] = useState(false)

  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Step 6: Generated Part Number</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Complete all steps to generate part number
          </p>
        </CardContent>
      </Card>
    )
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.partNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      onCopy?.()
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const totalContacts = result.selectedContacts.reduce((sum, c) => sum + c.quantity, 0)
  const pinCount = result.selectedContacts
    .filter(c => c.type === 'pin')
    .reduce((sum, c) => sum + c.quantity, 0)
  const socketCount = result.selectedContacts
    .filter(c => c.type === 'socket')
    .reduce((sum, c) => sum + c.quantity, 0)

  return (
    <Card className="border-primary">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Step 6: Generated Part Number
          <Badge variant="default">Complete</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Part Number */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Connector Assembly</p>
              <p className="font-mono text-xl font-bold">{result.partNumber}</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Configuration Summary */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Shell Size</p>
            <p className="font-medium">{result.shellSize}</p>
          </div>
          <div>
            <p className="text-muted-foreground">PHM Size</p>
            <p className="font-medium">{result.phmSize}</p>
          </div>
        </div>

        <Separator />

        {/* Selected Contacts */}
        <div>
          <h4 className="font-medium mb-2">Selected Contacts ({totalContacts} total)</h4>
          <div className="space-y-2">
            {result.selectedContacts.map((contact, idx) => (
              <div
                key={`${contact.part_number}-${idx}`}
                className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded"
              >
                <div className="flex items-center gap-2">
                  <Badge variant={contact.type === 'pin' ? 'default' : 'secondary'}>
                    {contact.type}
                  </Badge>
                  <span className="font-mono">{contact.part_number}</span>
                </div>
                <span className="font-medium">× {contact.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Procurement Summary */}
        {result.procurementSummary && (
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-sm">
            <h4 className="font-medium mb-2">Procurement Summary</h4>
            <div className="space-y-1">
              <p><span className="text-muted-foreground">Connector:</span> {result.procurementSummary.connector}</p>
              <p><span className="text-muted-foreground">Contacts:</span> {result.procurementSummary.contacts}</p>
              <p><span className="text-muted-foreground">Type:</span> {result.procurementSummary.type}</p>
              <p><span className="text-muted-foreground">Wire:</span> {result.procurementSummary.wire}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            className="flex-1"
            onClick={onAddToBom}
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add to BOM
          </Button>
          <Button
            variant="outline"
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Part Number
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
