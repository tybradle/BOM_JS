'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, AlertCircle } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ArrangementOption } from '@/types/glenair'

interface ArrangementPickerProps {
  arrangements: ArrangementOption[]
  conductorCount: number
  selectedArrangement: string | null
  onSelect: (arrangement: string) => void
  disabled?: boolean
}

export function ArrangementPicker({
  arrangements,
  conductorCount,
  selectedArrangement,
  onSelect,
  disabled = false
}: ArrangementPickerProps) {
  if (arrangements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Step 3: Arrangement</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Complete previous steps to see available arrangements
          </p>
        </CardContent>
      </Card>
    )
  }

  // Check if we have an exact match
  const exactMatch = arrangements.find(a => a.count === conductorCount)
  const closestMatch = arrangements[0] // Assuming sorted by closest match

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Step 3: Arrangement
          {selectedArrangement && (
            <Badge variant="secondary">{selectedArrangement}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!exactMatch && (
          <div className="flex items-center gap-2 text-amber-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>
              No exact match for {conductorCount} conductors. Showing closest options.
            </span>
          </div>
        )}

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Arrangement</TableHead>
                <TableHead>Shell Size</TableHead>
                <TableHead className="text-right">Contact Count</TableHead>
                <TableHead className="text-right">Difference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {arrangements.slice(0, 10).map((arr) => {
                const isSelected = selectedArrangement === arr.arrangement
                const isExact = arr.count === conductorCount
                const difference = arr.count - conductorCount

                return (
                  <TableRow
                    key={arr.arrangement}
                    className={`cursor-pointer hover:bg-muted/50 ${isSelected ? 'bg-primary/10' : ''} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={() => !disabled && onSelect(arr.arrangement)}
                  >
                    <TableCell>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </TableCell>
                    <TableCell className="font-medium">
                      {arr.arrangement}
                      {isExact && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Exact Match
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{arr.shellSize}</TableCell>
                    <TableCell className="text-right">{arr.count}</TableCell>
                    <TableCell className="text-right">
                      {difference === 0 ? (
                        <span className="text-green-600">0</span>
                      ) : difference > 0 ? (
                        <span className="text-amber-600">+{difference}</span>
                      ) : (
                        <span className="text-red-600">{difference}</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {arrangements.length > 10 && (
          <p className="text-sm text-muted-foreground text-center">
            Showing top 10 of {arrangements.length} arrangements
          </p>
        )}
      </CardContent>
    </Card>
  )
}
