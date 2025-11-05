'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Upload, FileUp, Loader2, CheckCircle2, XCircle, AlertCircle, Database, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { parsePartsCSV, parsePartsExcel, CleanPartData, ParseResult } from '@/lib/csv-parser'

interface MasterPartsImportDialogProps {
  open: boolean
  onClose: () => void
  onImportComplete: () => void
}

interface ParsedRow {
  data: CleanPartData
  isValid: boolean
  errors: string[]
  rowNumber: number
  errorType?: 'missing' | 'duplicate'
  isDuplicate?: boolean
}

export function MasterPartsImportDialog({
  open,
  onClose,
  onImportComplete
}: MasterPartsImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [existingParts, setExistingParts] = useState<Set<string>>(new Set())
  const [clearExisting, setClearExisting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    if (!selectedFile) return

    setFile(selectedFile)
    setIsParsing(true)
    setParsedRows([])

    try {
      // First, fetch existing part numbers from database
      const existingResponse = await fetch('/api/parts/existing')
      if (existingResponse.ok) {
        const { partNumbers } = await existingResponse.json()
        setExistingParts(new Set(partNumbers))
      }

      const fileBuffer = await selectedFile.arrayBuffer()
      const uint8Array = new Uint8Array(fileBuffer)
      const fileName = selectedFile.name.toLowerCase()

      let parseResult: ParseResult

      if (fileName.endsWith('.csv')) {
        // For CSV, we need to save to temp file first since parsePartsCSV expects a file path
        // In a real implementation, we'd need to handle this differently or modify the parser
        // For now, let's use a simpler approach with Papa Parse directly
        const text = new TextDecoder().decode(uint8Array)
        const Papa = await import('papaparse')
        
        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header: string) => header.trim()
        })

        // Convert to our format and validate
        parseResult = convertPapaParseResult(result.data)
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // For Excel, we'd need to save to temp file or modify the parser
        // For now, let's create a simple mock implementation
        const XLSX = await import('xlsx')
        const workbook = XLSX.read(uint8Array, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
        
        parseResult = convertPapaParseResult(data)
      } else {
        toast.error('Unsupported file type', {
          description: 'Please upload a CSV or Excel (.xlsx) file'
        })
        return
      }

      // Check for duplicates against existing parts
      const rowsWithDuplicateCheck = parseResult.parts.map((part, index) => {
        const rowNumber = index + 2 // +2 because index is 0-based and row 1 is headers
        const isDuplicate = existingParts.has(part.partNumber.trim())
        
        return {
          data: part,
          isValid: !isDuplicate,
          errors: isDuplicate ? ['Part number already exists in database'] : [],
          rowNumber,
          errorType: isDuplicate ? ('duplicate' as const) : undefined,
          isDuplicate
        }
      })

      // Add parsing errors
      const errorRows = parseResult.errors.map(err => ({
        data: {} as CleanPartData,
        isValid: false,
        errors: [err.error],
        rowNumber: err.row,
          errorType: ('missing' as const),
        isDuplicate: false
      }))

      setParsedRows([...rowsWithDuplicateCheck, ...errorRows])

      const validCount = rowsWithDuplicateCheck.filter(r => r.isValid).length
      const duplicateCount = rowsWithDuplicateCheck.filter(r => r.isDuplicate).length
      const errorCount = parseResult.errors.length

      toast.success('File parsed successfully', {
        description: `${validCount} valid, ${duplicateCount} duplicates, ${errorCount} errors`
      })

    } catch (error) {
      console.error('Parse error:', error)
      toast.error('Failed to parse file', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsParsing(false)
    }
  }, [existingParts])

  const convertPapaParseResult = (data: any[]): ParseResult => {
    const parts: CleanPartData[] = []
    const errors: any[] = []
    
    data.forEach((record, index) => {
      const rowNumber = index + 2
      
      try {
        const part = parsePartRecord(record, rowNumber)
        if (part) {
          parts.push(part)
        } else {
          errors.push({
            row: rowNumber,
            error: 'Missing required fields (Part Number, Manufacturer, Description)',
            data: record
          })
        }
      } catch (error) {
        errors.push({
          row: rowNumber,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: record
        })
      }
    })

    return {
      parts,
      totalRows: data.length,
      validRows: parts.length,
      skippedRows: data.length - parts.length,
      errors
    }
  }

  const parsePartRecord = (record: any, rowNumber: number): CleanPartData | null => {
    // Helper function to find value by trying multiple possible keys
    const findValue = (possibleNames: string[]): string | undefined => {
      for (const name of possibleNames) {
        // Try exact match
        if (record[name] !== undefined && record[name] !== '') {
          return String(record[name])
        }
        
        // Try case-insensitive match
        const lowerName = name.toLowerCase()
        for (const key in record) {
          if (key.toLowerCase() === lowerName && record[key] !== '') {
            return String(record[key])
          }
        }
      }
      return undefined
    }

    // Find required fields
    const partNumber = findValue([
      'Part Numbers', 'Part Number', 'PartNumber', 'partNumber', 'Part_Number', 'PART_NUMBER'
    ])
    
    const manufacturer = findValue([
      'Manufacturer', 'Mfr', 'Vendor', 'MANUFACTURER', 'MFR'
    ])
    
    const description = findValue([
      'Description', 'Desc', 'Part Description', 'DESCRIPTION', 'DESC'
    ])

    // Validate required fields
    if (!partNumber || !manufacturer || !description) {
      return null
    }

    // Parse optional fields
    const category = findValue([
      'Category', 'Type', 'Part Type', 'CATEGORY'
    ])
    
    const unitPriceStr = findValue([
      'Unit Cost', 'Unit Price', 'Price', 'Cost', 'UnitPrice', 'UNIT_COST'
    ])
    
    const currency = findValue([
      'Currency', 'Curr', 'CURRENCY'
    ])
    
    const secondaryDescription = findValue([
      'Secondary Description', 'Description 2', 'Desc2', 'Notes'
    ])

    // Parse unit price
    let unitPrice: number | undefined
    if (unitPriceStr) {
      const cleanPrice = unitPriceStr.replace(/[,$]/g, '').trim()
      const parsed = parseFloat(cleanPrice)
      if (!isNaN(parsed) && parsed >= 0) {
        unitPrice = parsed
      }
    }

    return {
      partNumber: partNumber.trim(),
      manufacturer: manufacturer.trim(),
      description: description.trim(),
      category: category?.trim() || undefined,
      unitPrice,
      currency: currency?.trim().toUpperCase() || undefined,
      secondaryDescription: secondaryDescription?.trim() || undefined,
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleImport = async () => {
    if (!file) {
      toast.error('No file selected')
      return
    }

    setIsImporting(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('clearExisting', String(clearExisting))

      const response = await fetch('/api/parts/import', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        let errorMessage = 'Import failed'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.details || errorMessage
        } catch (e) {
          errorMessage = `Import failed: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      setImportResult(result)

      const { imported, updated, errors } = result.summary
      if (imported > 0 || updated > 0) {
        toast.success('Master parts import complete!', {
          description: `Imported: ${imported}, Updated: ${updated}, Errors: ${errors}`
        })
      } else {
        toast.error('No parts imported', {
          description: 'All rows were invalid. Please check the preview for errors.'
        })
      }

      onImportComplete()
      handleClose()

    } catch (error) {
      console.error('Import error:', error)
      toast.error('Import failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setParsedRows([])
    setExistingParts(new Set())
    setClearExisting(false)
    setImportResult(null)
    onClose()
  }

  const validCount = parsedRows.filter(r => r.isValid).length
  const duplicateCount = parsedRows.filter(r => r.isDuplicate).length
  const errorCount = parsedRows.filter(r => !r.isValid && !r.isDuplicate).length

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            Import Master Parts
          </DialogTitle>
          <DialogDescription>
            Upload CSV or Excel file with master parts data. Required columns: Part Number, Manufacturer, Description
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {/* File Upload Area */}
          {!file && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-2">
                Drag and drop file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Supports CSV and Excel (.xlsx) files
              </p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0]
                  if (selectedFile) handleFileSelect(selectedFile)
                }}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" asChild>
                  <span>Select File</span>
                </Button>
              </label>
            </div>
          )}

          {/* File Info & Preview */}
          {file && (
            <>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <FileUp className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => {
                  setFile(null)
                  setParsedRows([])
                }}>
                  Change File
                </Button>
              </div>

              {/* Parsing Progress */}
              {isParsing && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin mr-3" />
                  <span>Parsing file...</span>
                </div>
              )}

              {/* Summary Stats */}
              {parsedRows.length > 0 && !isParsing && (
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Valid</span>
                    </div>
                    <p className="text-2xl font-bold">{validCount}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">Duplicates</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{duplicateCount}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium">Errors</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-600">{errorCount}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Total</span>
                    </div>
                    <p className="text-2xl font-bold">{parsedRows.length}</p>
                  </div>
                </div>
              )}

              {/* Preview Table */}
              {parsedRows.length > 0 && !isParsing && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-[400px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Row</TableHead>
                          <TableHead className="w-12">Status</TableHead>
                          <TableHead>Part Number</TableHead>
                          <TableHead>Manufacturer</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Errors</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedRows.slice(0, 50).map((row, index) => {
                          let rowBgClass = 'bg-green-50'
                          let iconColor = 'text-green-600'
                          let errorTextColor = 'text-green-600'
                          
                          if (!row.isValid) {
                            if (row.isDuplicate) {
                              rowBgClass = 'bg-red-50'
                              iconColor = 'text-red-600'
                              errorTextColor = 'text-red-600'
                            } else {
                              rowBgClass = 'bg-yellow-50'
                              iconColor = 'text-yellow-600'
                              errorTextColor = 'text-yellow-600'
                            }
                          }
                          
                          return (
                            <TableRow key={index} className={rowBgClass}>
                              <TableCell className="font-mono text-xs">{row.rowNumber}</TableCell>
                              <TableCell>
                                {row.isValid ? (
                                  <CheckCircle2 className={`h-4 w-4 ${iconColor}`} />
                                ) : (
                                  <XCircle className={`h-4 w-4 ${iconColor}`} />
                                )}
                              </TableCell>
                              <TableCell className="font-medium">
                                {row.data.partNumber}
                                {row.isDuplicate && (
                                  <Badge variant="outline" className="text-red-600 border-red-600 text-xs ml-2">
                                    <Database className="h-3 w-3 mr-1" />
                                    Duplicate
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>{row.data.manufacturer}</TableCell>
                              <TableCell>{row.data.description}</TableCell>
                              <TableCell>{row.data.category || '-'}</TableCell>
                              <TableCell>
                                {row.data.unitPrice 
                                  ? `${row.data.currency || 'USD'} ${row.data.unitPrice.toFixed(2)}`
                                  : '-'
                                }
                              </TableCell>
                              <TableCell>
                                {row.errors.length > 0 && (
                                  <span className={`text-xs ${errorTextColor}`}>{row.errors.join(', ')}</span>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  {parsedRows.length > 50 && (
                    <div className="p-2 text-center text-xs text-muted-foreground border-t">
                      Showing first 50 of {parsedRows.length} rows
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm">
              <Checkbox
                id="clear-existing"
                checked={clearExisting}
                onCheckedChange={(checked) => setClearExisting(checked === true)}
              />
              <label htmlFor="clear-existing" className="cursor-pointer text-muted-foreground">
                Clear all existing parts before import
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isImporting}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!file || parsedRows.length === 0 || validCount === 0 || isImporting || isParsing}
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <FileUp className="mr-2 h-4 w-4" />
                  Import {validCount > 0 && `${validCount} Parts`}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}