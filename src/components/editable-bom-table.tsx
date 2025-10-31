'use client'

import { useState, useEffect, useRef } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Edit, 
  Trash2, 
  Copy, 
  Save, 
  X, 
  ChevronUp, 
  ChevronDown,
  MoreHorizontal,
  Search,
  Plus,
  FileDown,
  FileUp
} from 'lucide-react'
import { useBOMStore } from '@/lib/store'
import { BOMItem } from '@/lib/store'
import { PartSearchDialog } from './PartSearchDialog'
import { ExportDialog } from './ExportDialog'
import { ImportPreviewDialog } from './ImportPreviewDialog'
import { useToast } from '@/hooks/use-toast'

interface EditableTableProps {
  items: BOMItem[]
  onItemUpdate: (itemId: string, field: string, value: any) => void
  onItemsDelete: (itemIds: string[]) => void
  onItemsDuplicate: (itemIds: string[]) => void
  addItemButton?: React.ReactNode
  onAddItemClick?: () => void
  currentLocationName?: string
}

interface EditingCell {
  itemId: string
  field: string
  value: any
}

export function EditableBOMTable({ 
  items, 
  onItemUpdate, 
  onItemsDelete, 
  onItemsDuplicate,
  addItemButton,
  onAddItemClick,
  currentLocationName
}: EditableTableProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [sortConfig, setSortConfig] = useState<{ key: keyof BOMItem; direction: 'asc' | 'desc' } | null>(null)
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const editInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { currentProject, currentLocationId, addBOMItem, fetchBOMItems } = useBOMStore()

  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingCell])

  const handleCellEdit = (itemId: string, field: string, value: any) => {
    setEditingCell({ itemId, field, value })
  }

  const handleCellSave = () => {
    if (editingCell) {
      onItemUpdate(editingCell.itemId, editingCell.field, editingCell.value)
      setEditingCell(null)
    }
  }

  const handleCellCancel = () => {
    setEditingCell(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellSave()
    } else if (e.key === 'Escape') {
      handleCellCancel()
    }
  }

  const handleSort = (key: keyof BOMItem) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(items.map(item => item.id))
    } else {
      setSelectedItems([])
    }
  }

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, itemId])
    } else {
      setSelectedItems(selectedItems.filter(id => id !== itemId))
    }
  }

  const handleBulkDelete = () => {
    if (selectedItems.length > 0) {
      onItemsDelete(selectedItems)
      setSelectedItems([])
    }
  }

  const handleBulkDuplicate = () => {
    if (selectedItems.length > 0) {
      onItemsDuplicate(selectedItems)
    }
  }

  const handlePartSelected = async (part: any) => {
    if (!currentProject || !currentLocationId) {
      toast({
        title: "Error",
        description: "No project or location selected",
        variant: "destructive"
      })
      return
    }

    try {
      await addBOMItem(currentProject.id, {
        locationId: currentLocationId,
        partNumber: part.partNumber,
        manufacturer: part.manufacturer || '',
        description: part.description,
        secondaryDescription: part.secondaryDescription || '',
        category: part.category || '',
        quantity: 1,
        unit: 'EA',
        unitPrice: part.unitPrice || null,
        status: 'ACTIVE',
        isSpare: false,
        referenceDesignator: ''
      })

      toast({
        title: "Part Added",
        description: `${part.partNumber} added to BOM`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add part to BOM",
        variant: "destructive"
      })
    }
  }

  const sortedItems = [...items].sort((a, b) => {
    if (!sortConfig) return 0
    
    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]
    
    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      ACTIVE: 'default',
      OBSOLETE: 'destructive',
      PENDING: 'secondary',
      DISCONTINUED: 'outline'
    }
    return <Badge variant={variants[status]}>{status}</Badge>
  }

  const renderEditableCell = (item: BOMItem, field: keyof BOMItem, value: any) => {
    const isEditing = editingCell?.itemId === item.id && editingCell?.field === field

    if (isEditing) {
      if (field === 'status') {
        return (
          <Select
            value={editingCell.value}
            onValueChange={(newValue) => setEditingCell({ ...editingCell, value: newValue })}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="OBSOLETE">Obsolete</SelectItem>
              <SelectItem value="DISCONTINUED">Discontinued</SelectItem>
            </SelectContent>
          </Select>
        )
      }

      if (field === 'quantity' || field === 'unitPrice') {
        return (
          <Input
            ref={editInputRef}
            type="number"
            step={field === 'unitPrice' ? '0.01' : '1'}
            value={editingCell.value}
            onChange={(e) => setEditingCell({ ...editingCell, value: parseFloat(e.target.value) || 0 })}
            onKeyDown={handleKeyDown}
            onBlur={handleCellSave}
            className="h-8"
          />
        )
      }

      return (
        <Input
          ref={editInputRef}
          value={editingCell.value}
          onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
          onKeyDown={handleKeyDown}
          onBlur={handleCellSave}
          className="h-8"
        />
      )
    }

    if (field === 'status') {
      return getStatusBadge(value)
    }

    if (field === 'unitPrice' && value) {
      return (
        <div
          className="min-h-[2rem] cursor-pointer hover:bg-muted/50 px-2 py-1 rounded"
          onClick={() => handleCellEdit(item.id, field, value)}
        >
          ${Number(value).toFixed(2)}
        </div>
      )
    }

    return (
      <div
        className="min-h-[2rem] cursor-pointer hover:bg-muted/50 px-2 py-1 rounded"
        onClick={() => handleCellEdit(item.id, field as string, value)}
      >
        {value}
      </div>
    )
  }

  const SortIcon = ({ column }: { column: keyof BOMItem }) => {
    if (sortConfig?.key !== column) {
      return <ChevronUp className="w-4 h-4 opacity-0" />
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />
  }

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button 
          onClick={() => setSearchDialogOpen(true)}
          variant="default"
          size="sm"
        >
          <Search className="w-4 h-4 mr-2" />
          Add from Catalog
        </Button>
        {onAddItemClick && (
          <Button 
            onClick={onAddItemClick}
            variant="default"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item{currentLocationName ? ` to ${currentLocationName}` : ''}
          </Button>
        )}
        {currentLocationId && (
          <Button 
            onClick={() => setImportDialogOpen(true)}
            variant="outline"
            size="sm"
          >
            <FileUp className="w-4 h-4 mr-2" />
            Import
          </Button>
        )}
        {currentProject && (
          <Button 
            onClick={() => setExportDialogOpen(true)}
            variant="outline"
            size="sm"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export
          </Button>
        )}
        {addItemButton}
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
          </span>
          <Button size="sm" variant="outline" onClick={handleBulkDuplicate}>
            <Copy className="w-4 h-4 mr-2" />
            Duplicate
          </Button>
          <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedItems([])}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedItems.length === items.length && items.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold"
                  onClick={() => handleSort('partNumber')}
                >
                  Part Number
                  <SortIcon column="partNumber" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold"
                  onClick={() => handleSort('description')}
                >
                  Description
                  <SortIcon column="description" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold"
                  onClick={() => handleSort('secondaryDescription')}
                >
                  Description 2
                  <SortIcon column="secondaryDescription" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold"
                  onClick={() => handleSort('quantity')}
                >
                  Quantity
                  <SortIcon column="quantity" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold"
                  onClick={() => handleSort('unit')}
                >
                  Unit
                  <SortIcon column="unit" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold"
                  onClick={() => handleSort('unitPrice')}
                >
                  Unit Price
                  <SortIcon column="unitPrice" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold"
                  onClick={() => handleSort('manufacturer')}
                >
                  Manufacturer
                  <SortIcon column="manufacturer" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold"
                  onClick={() => handleSort('supplier')}
                >
                  Supplier
                  <SortIcon column="supplier" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold"
                  onClick={() => handleSort('referenceDesignator')}
                >
                  Ref Designator
                  <SortIcon column="referenceDesignator" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold"
                  onClick={() => handleSort('status')}
                >
                  Status
                  <SortIcon column="status" />
                </Button>
              </TableHead>
              <TableHead className="text-center">
                Spare
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.map((item) => (
              <TableRow key={item.id} className="group">
                <TableCell>
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {renderEditableCell(item, 'partNumber', item.partNumber)}
                </TableCell>
                <TableCell>
                  {renderEditableCell(item, 'description', item.description)}
                </TableCell>
                <TableCell>
                  {renderEditableCell(item, 'secondaryDescription', item.secondaryDescription || '')}
                </TableCell>
                <TableCell>
                  {renderEditableCell(item, 'quantity', item.quantity)}
                </TableCell>
                <TableCell>
                  {renderEditableCell(item, 'unit', item.unit)}
                </TableCell>
                <TableCell>
                  {renderEditableCell(item, 'unitPrice', item.unitPrice || '')}
                </TableCell>
                <TableCell>
                  {renderEditableCell(item, 'manufacturer', item.manufacturer || '')}
                </TableCell>
                <TableCell>
                  {renderEditableCell(item, 'supplier', item.supplier || '')}
                </TableCell>
                <TableCell>
                  {renderEditableCell(item, 'referenceDesignator', item.referenceDesignator || '')}
                </TableCell>
                <TableCell>
                  {renderEditableCell(item, 'status', item.status)}
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={item.isSpare}
                    onCheckedChange={(checked) => onItemUpdate(item.id, 'isSpare', checked as boolean)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onItemsDuplicate([item.id])}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onItemsDelete([item.id])}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Mode Actions */}
      {editingCell && (
        <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary rounded-lg">
          <span className="text-sm font-medium">Editing cell...</span>
          <Button size="sm" onClick={handleCellSave}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={handleCellCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      )}

      {/* Part Search Dialog */}
      <PartSearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        onSelect={handlePartSelected}
      />

      {/* Export Dialog */}
      {currentProject && (
        <ExportDialog
          open={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
          projectId={currentProject.id}
          projectNumber={currentProject.projectNumber}
          packageName={currentProject.packageName}
        />
      )}

      {/* Import Dialog */}
      {currentProject && currentLocationId && (
        <ImportPreviewDialog
          open={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          projectId={currentProject.id}
          locationId={currentLocationId}
          onImportComplete={() => {
            // Refresh the BOM items after import
            if (fetchBOMItems) {
              fetchBOMItems(currentProject.id, currentLocationId)
            }
          }}
        />
      )}
    </div>
  )
}