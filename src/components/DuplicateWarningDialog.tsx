'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertTriangle } from 'lucide-react'

interface DuplicateWarningDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  existingItem: {
    partNumber: string
    description: string
    quantity: number
    manufacturer?: string | null
    unitPrice?: number | null
  }
  newItem: {
    partNumber: string
    description: string
    quantity: number
    manufacturer?: string | null
    unitPrice?: number | null
  }
}

export function DuplicateWarningDialog({
  open,
  onClose,
  onConfirm,
  existingItem,
  newItem
}: DuplicateWarningDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Duplicate Part Number Detected
          </AlertDialogTitle>
          <AlertDialogDescription>
            This part number already exists in the current location. Compare the details below:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Field</TableHead>
                <TableHead>Existing Item</TableHead>
                <TableHead>New Item</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Part Number</TableCell>
                <TableCell>{existingItem.partNumber}</TableCell>
                <TableCell>{newItem.partNumber}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Description</TableCell>
                <TableCell>{existingItem.description}</TableCell>
                <TableCell>{newItem.description}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Quantity</TableCell>
                <TableCell>{existingItem.quantity}</TableCell>
                <TableCell>{newItem.quantity}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Manufacturer</TableCell>
                <TableCell>{existingItem.manufacturer || '-'}</TableCell>
                <TableCell>{newItem.manufacturer || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Unit Price</TableCell>
                <TableCell>
                  {existingItem.unitPrice ? `$${existingItem.unitPrice}` : '-'}
                </TableCell>
                <TableCell>
                  {newItem.unitPrice ? `$${newItem.unitPrice}` : '-'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Add Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
