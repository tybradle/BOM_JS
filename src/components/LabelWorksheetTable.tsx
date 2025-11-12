'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Plus,
  Download,
  RefreshCw,
  GripVertical
} from 'lucide-react'
import { QrCode as QRCodeComponent } from '@/components/ui/qr-code'
import { toast } from 'sonner'
import { debounce } from '@/lib/utils'

export interface LabelRow {
  id: string
  projectNumber: string    // From project
  kitString: string        // "Z2_EC1"
  buildingCode: string     // "1"
  rackNumber: string       // "45A"
  category: 'Panel' | 'Field'
  description: string
  buildQty: number
  qrCodeData: string       // Computed: "B1-45A-2-E1"
  binLocation: string      // Computed: "Building 1 / Bin 45A"
  createdAt: string
  updatedAt: string
}

interface LabelWorksheetTableProps {
  rows: LabelRow[]
  onRowUpdate: (rowId: string, field: string, value: any) => void
  onRowsDelete: (rowIds: string[]) => void
  onRowsAdd: (count: number) => void
  onSyncFromProject: () => void
  onExportPdf: (rowIds: string[]) => void
  loading?: boolean
}

export function LabelWorksheetTable({ 
  rows, 
  onRowUpdate, 
  onRowsDelete, 
  onRowsAdd,
  onSyncFromProject,
  onExportPdf,
  loading = false
}: LabelWorksheetTableProps) {
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [pendingSave, setPendingSave] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Auto-save with debounce
  const debouncedSave = useCallback(
    debounce((rowId: string, field: string, value: any) => {
      setPendingSave(true)
      onRowUpdate(rowId, field, value)
      setTimeout(() => setPendingSave(false), 500)
    }, 500),
    [onRowUpdate]
  )

  // Handle cell editing
  const handleCellEdit = (rowId: string, field: string, currentValue: any) => {
    setEditingCell({ rowId, field })
    setEditValue(String(currentValue || ''))
    setEditingCell({ rowId, field })
    setEditValue(String(currentValue || ''))
  }

  const handleCellSave = (rowId: string, field: string) => {
    if (editingCell?.rowId === rowId && editingCell?.field === field) {
      debouncedSave(rowId, field, editValue)
      setEditingCell(null)
      setEditValue('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent, rowId: string, field: string) => {
    if (e.key === 'Enter') {
      handleCellSave(rowId, field)
    } else if (e.key === 'Escape') {
      setEditingCell(null)
      setEditValue('')
    }
  }

  const handleDelete = () => {
    if (selectedRows.length > 0) {
      onRowsDelete(selectedRows)
      setSelectedRows([])
      setShowDeleteConfirm(false)
      toast.success(`Deleted ${selectedRows.length} label(s)`)
    }
  }

  const handleExportSelected = () => {
    if (selectedRows.length > 0) {
      onExportPdf(selectedRows)
    } else {
      onExportPdf(rows.map(row => row.id))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(rows.map(row => row.id))
    } else {
      setSelectedRows([])
    }
  }

  const handleSelectRow = (rowId: string, checked: boolean) => {
    if (checked) {
      setSelectedRows([...selectedRows, rowId])
    } else {
      setSelectedRows(selectedRows.filter(id => id !== rowId))
    }
  }

  const renderEditableCell = (
    row: LabelRow,
    field: string,
    value: string,
    type: 'text' | 'select' | 'number' = 'text',
    options?: string[]
  ) => {
    const isEditing = editingCell?.rowId === row.id && editingCell?.field === field

    if (isEditing) {
      if (type === 'select') {
        return (
          <Select
            value={editValue}
            onValueChange={(value) => {
              setEditValue(value)
              debouncedSave(row.id, field, value)
            }}
          >
            {options?.map(option => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </Select>
        )
      }

      return (
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => handleCellSave(row.id, field)}
          onKeyDown={(e) => handleKeyPress(e, row.id, field)}
          type={type}
          className="w-full"
          autoFocus
        />
      )
    }

    return (
      <div
        className={`cursor-pointer p-2 rounded hover:bg-gray-50 ${
          pendingSave && editingCell?.rowId === row.id ? 'opacity-50' : ''
        }`}
        onClick={() => handleCellEdit(row.id, field, value)}
      >
        {value || <span className="text-gray-400">Click to edit</span>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex justify-between items-center gap-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSyncFromProject}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Sync from Project
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRowsAdd(1)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Row
          </Button>
        </div>
        
        <div className="flex gap-2">
          {selectedRows.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete ({selectedRows.length})
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={handleExportSelected}
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedRows.length === rows.length && rows.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-32">Kit</TableHead>
              <TableHead className="w-24">Building</TableHead>
              <TableHead className="w-24">Bin</TableHead>
              <TableHead className="w-24">Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-20">Build QTY</TableHead>
              <TableHead className="w-20">QR Code</TableHead>
              <TableHead className="w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedRows.includes(row.id)}
                    onCheckedChange={(checked: boolean) => handleSelectRow(row.id, checked)}
                  />
                </TableCell>
                
                <TableCell>
                  {renderEditableCell(row, 'kitString', row.kitString)}
                </TableCell>
                
                <TableCell>
                  {renderEditableCell(row, 'buildingCode', row.buildingCode, 'text')}
                </TableCell>
                
                <TableCell>
                  {renderEditableCell(row, 'rackNumber', row.rackNumber, 'text')}
                </TableCell>
                
                <TableCell>
                  {renderEditableCell(row, 'category', row.category, 'select', ['Panel', 'Field'])}
                </TableCell>
                
                <TableCell>
                  {renderEditableCell(row, 'description', row.description, 'text')}
                </TableCell>
                
                <TableCell>
                  {renderEditableCell(row, 'buildQty', String(row.buildQty), 'number')}
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white border border-gray-200 rounded flex items-center justify-center">
                      <QRCodeComponent value={row.qrCodeData} size={32} />
                    </div>
                    <span className="text-xs text-gray-500 font-mono">
                      {row.qrCodeData}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onExportPdf([row.id])}
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectRow(row.id, true)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Labels</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedRows.length} label(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
