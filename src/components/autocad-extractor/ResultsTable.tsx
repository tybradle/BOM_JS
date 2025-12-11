'use client'

import { AlertTriangle } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { BOMItem } from '@/lib/autocad-extractor/types'

interface ResultsTableProps {
  items: BOMItem[]
}

export function ResultsTable({ items }: ResultsTableProps) {
  if (items.length === 0) {
    return null
  }

  const flaggedCount = items.filter(item => item.flagged).length

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Extracted BOM Items</h3>
          <p className="text-sm text-gray-500">
            {items.length} items extracted
            {flaggedCount > 0 && (
              <span className="ml-2 text-orange-600">
                • {flaggedCount} flagged for review
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Part Number</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Manufacturer</TableHead>
              <TableHead className="w-20">Qty</TableHead>
              <TableHead className="w-24">Confidence</TableHead>
              <TableHead className="w-20">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow
                key={index}
                className={item.flagged ? 'bg-orange-50 dark:bg-orange-950' : ''}
              >
                <TableCell className="font-medium">{item.itemNumber}</TableCell>
                <TableCell className="font-mono text-sm">{item.partNumber}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>{item.manufacturer}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      item.confidence && item.confidence >= 0.8
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {item.confidence
                      ? `${Math.round(item.confidence * 100)}%`
                      : 'N/A'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {item.flagged ? (
                    <div className="flex items-center gap-1 text-orange-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-xs font-medium">Review</span>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-green-600">
                      OK
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
