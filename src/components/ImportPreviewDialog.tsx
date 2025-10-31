'use client'

import { useState, useCallback } from 'react'
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
import { Upload, FileUp, Loader2, CheckCircle2, XCircle, AlertCircle, Database } from 'lucide-react'
import { toast } from 'sonner'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

interface ImportPreviewDialogProps {
  open: boolean
  onClose: () => void
  projectId: string
  locationId: string
  onImportComplete: () => void
}

interface ParsedRow {
  data: any
  isValid: boolean
  errors: string[]
  rowNumber: number
  errorType?: 'missing' | 'duplicate' // Track error type for styling
  isMissingFromDatabase?: boolean // Track if part doesn't exist in MasterPart database
}

export function ImportPreviewDialog({ 
  open, 
  onClose, 
  projectId, 
  locationId,
  onImportComplete
}: ImportPreviewDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [missingFromDatabase, setMissingFromDatabase] = useState<Set<string>>(new Set())
  const [checkingDatabase, setCheckingDatabase] = useState(false)
  const [addMissingToDatabase, setAddMissingToDatabase] = useState(true)

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    if (!selectedFile) return

    setFile(selectedFile)

    try {
      // First, fetch existing part numbers for this location
      const partNumbersResponse = await fetch(`/api/locations/${locationId}/part-numbers`)
      if (!partNumbersResponse.ok) {
        throw new Error('Failed to fetch existing part numbers')
      }
      const { partNumbers: existingPartNumbers } = await partNumbersResponse.json()
      const existingPartNumberSet = new Set(existingPartNumbers)

      const fileBuffer = await selectedFile.arrayBuffer()
      const uint8Array = new Uint8Array(fileBuffer)
      const fileName = selectedFile.name.toLowerCase()

      let rows: any[] = []

      if (fileName.endsWith('.csv')) {
        const text = new TextDecoder().decode(uint8Array)
        const parseResult = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header: string) => header.trim()
        })
        rows = parseResult.data
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const workbook = XLSX.read(uint8Array, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
      } else {
        toast.error('Unsupported file type', {
          description: 'Please upload a CSV or Excel (.xlsx) file'
        })
        return
      }

      // Validate rows (preview first 50 for performance)
      const previewRows = rows.slice(0, 50).map((row, index) => {
        const errors: string[] = []
        let errorType: 'missing' | 'duplicate' | undefined
        
        const partNumber = getFieldValue(row, ['part number', 'partnumber', 'part#', 'p/n'])
        const description = getFieldValue(row, ['description', 'desc', 'name'])
        const quantity = getFieldValue(row, ['quantity', 'qty', 'count'])

        // Check for duplicates first
        if (partNumber && partNumber.trim() !== '' && existingPartNumberSet.has(partNumber.trim())) {
          errors.push('Part number already exists in this location')
          errorType = 'duplicate'
        }
        
        // Then check for missing required fields
        if (!partNumber || partNumber.trim() === '') {
          errors.push('Missing part number')
          errorType = errorType || 'missing'
        }
        if (!description || description.trim() === '') {
          errors.push('Missing description')
          errorType = errorType || 'missing'
        }
        if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
          errors.push('Invalid quantity')
          errorType = errorType || 'missing'
        }

        return {
          data: row,
          isValid: errors.length === 0,
          errors,
          rowNumber: index + 2, // Account for header
          errorType
        }
      })

      setParsedRows(previewRows)

      // Check which parts are missing from the MasterPart database
      const uniquePartNumbers = Array.from(
        new Set(
          previewRows
            .map(row => getFieldValue(row.data, ['part number', 'partnumber', 'part#', 'p/n']))
            .filter(pn => pn && pn.trim() !== '')
        )
      )

      if (uniquePartNumbers.length > 0) {
        setCheckingDatabase(true)
        try {
          const checkResponse = await fetch('/api/parts/check-missing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ partNumbers: uniquePartNumbers })
          })

          if (checkResponse.ok) {
            const checkResult = await checkResponse.json()
            const missingSet = new Set<string>(checkResult.missing || [])
            setMissingFromDatabase(missingSet)

            // Update parsedRows to mark which ones are missing from database
            const updatedRows = previewRows.map(row => {
              const partNumber = getFieldValue(row.data, ['part number', 'partnumber', 'part#', 'p/n'])
              const isMissing = partNumber && partNumber.trim() !== '' && missingSet.has(partNumber.trim())
              return {
                ...row,
                isMissingFromDatabase: isMissing ? true : false
              }
            })
            setParsedRows(updatedRows)
          }
        } catch (error) {
          console.error('Failed to check database:', error)
          // Non-fatal error, continue without database check
        } finally {
          setCheckingDatabase(false)
        }
      }

      const totalRows = rows.length
      const validCount = previewRows.filter(r => r.isValid).length
      const missingCount = previewRows.filter(r => !r.isValid && r.errorType === 'missing').length
      const duplicateCount = previewRows.filter(r => !r.isValid && r.errorType === 'duplicate').length

      if (totalRows > 50) {
        toast.info('Preview showing first 50 rows', {
          description: `Total rows in file: ${totalRows}`
        })
      }

      toast.success('File parsed successfully', {
        description: `${validCount} valid, ${missingCount} missing info, ${duplicateCount} duplicates`
      })

    } catch (error) {
      console.error('Parse error:', error)
      toast.error('Failed to parse file', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }, [locationId])

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
      formData.append('locationId', locationId)
      formData.append('addToDatabase', String(addMissingToDatabase))

      const response = await fetch(`/api/projects/${projectId}/items/import`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        let errorMessage = 'Import failed'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.details || errorMessage
        } catch (e) {
          // If response isn't JSON, use status text
          errorMessage = `Import failed: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()

      // Success message with database additions
      if (result.summary.imported > 0) {
        let description = `Successfully imported ${result.summary.imported} items`
        
        if (result.databaseAdded?.created > 0) {
          description += `\nAdded ${result.databaseAdded.created} new parts to database`
        }
        
        if (result.databaseAdded?.skipped > 0) {
          description += `\n${result.databaseAdded.skipped} parts already existed in database`
        }
        
        toast.success('Import complete!', {
          description
        })
      } else {
        toast.error('No items imported', {
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
    setMissingFromDatabase(new Set())
    setCheckingDatabase(false)
    setAddMissingToDatabase(true)
    onClose()
  }

  const validCount = parsedRows.filter(r => r.isValid).length
  const missingCount = parsedRows.filter(r => !r.isValid && r.errorType === 'missing').length
  const duplicateCount = parsedRows.filter(r => !r.isValid && r.errorType === 'duplicate').length
  const notInDatabaseCount = parsedRows.filter(r => r.isValid && r.isMissingFromDatabase).length

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            Import BOM Items
          </DialogTitle>
          <DialogDescription>
            Upload CSV or Excel file with BOM items. Required columns: Part Number, Description, Quantity
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

              {/* Summary Stats */}
              {parsedRows.length > 0 && (
                <div className="grid grid-cols-5 gap-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Valid</span>
                    </div>
                    <p className="text-2xl font-bold">{validCount}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium">Missing Info</span>
                    </div>
                    <p className="text-2xl font-bold">{missingCount}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">Duplicate</span>
                    </div>
                    <p className="text-2xl font-bold">{duplicateCount}</p>
                  </div>
                  <div className="p-3 border rounded-lg bg-orange-50/50">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">Not in DB</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">{notInDatabaseCount}</p>
                    {checkingDatabase && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Checking...
                      </p>
                    )}
                    {!checkingDatabase && notInDatabaseCount > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">Can be added</p>
                    )}
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
              {parsedRows.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-[400px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Row</TableHead>
                          <TableHead className="w-12">Status</TableHead>
                          <TableHead>Part Number</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="w-20">Qty</TableHead>
                          <TableHead>Errors</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedRows.map((row, index) => {
                          // Determine row background color based on error type
                          let rowBgClass = 'bg-green-50'
                          let iconColor = 'text-green-600'
                          let errorTextColor = 'text-green-600'
                          
                          if (!row.isValid) {
                            if (row.errorType === 'duplicate') {
                              rowBgClass = 'bg-red-50'
                              iconColor = 'text-red-600'
                              errorTextColor = 'text-red-600'
                            } else if (row.errorType === 'missing') {
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
                                <div className="flex items-center gap-2">
                                  {getFieldValue(row.data, ['part number', 'partnumber', 'part#', 'p/n'])}
                                  {row.isValid && row.isMissingFromDatabase && (
                                    <Badge variant="outline" className="text-orange-600 border-orange-600 text-xs">
                                      <Database className="h-3 w-3 mr-1" />
                                      New
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {getFieldValue(row.data, ['description', 'desc', 'name'])}
                              </TableCell>
                              <TableCell>
                                {getFieldValue(row.data, ['quantity', 'qty', 'count'])}
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
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-4">
          <div className="flex-1">
            {notInDatabaseCount > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Checkbox
                  id="add-to-database"
                  checked={addMissingToDatabase}
                  onCheckedChange={(checked) => setAddMissingToDatabase(checked as boolean)}
                />
                <label htmlFor="add-to-database" className="cursor-pointer text-muted-foreground">
                  Add <span className="font-semibold text-orange-600">{notInDatabaseCount}</span> missing part{notInDatabaseCount !== 1 ? 's' : ''} to database
                </label>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isImporting}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!file || parsedRows.length === 0 || missingCount > 0 || duplicateCount > 0 || isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <FileUp className="mr-2 h-4 w-4" />
                  Import {validCount > 0 && `${validCount} Items`}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function getFieldValue(row: any, keys: string[]): string {
  for (const key of keys) {
    const foundKey = Object.keys(row).find(k => k.toLowerCase() === key.toLowerCase())
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && row[foundKey] !== '') {
      return String(row[foundKey])
    }
  }
  return ''
}
