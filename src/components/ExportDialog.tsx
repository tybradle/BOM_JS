'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { FileDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ExportDialogProps {
  open: boolean
  onClose: () => void
  projectId: string
  projectNumber: string
  packageName: string
}

type ExportFormat = 'EPLAN' | 'CSV' | 'EXCEL'

interface FormatOption {
  value: ExportFormat
  label: string
  description: string
  fileExtension: string
}

const formatOptions: FormatOption[] = [
  {
    value: 'EPLAN',
    label: 'Eplan XML',
    description: 'PLM-compatible XML format for Eplan integration',
    fileExtension: '.xml'
  },
  {
    value: 'CSV',
    label: 'CSV (Comma-Separated)',
    description: 'Simple spreadsheet format compatible with Excel, Google Sheets',
    fileExtension: '.csv'
  },
  {
    value: 'EXCEL',
    label: 'Excel Workbook',
    description: 'Formatted Excel file with separate sheets per location',
    fileExtension: '.xlsx'
  }
]

export function ExportDialog({ open, onClose, projectId, projectNumber, packageName }: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('EPLAN')
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (!selectedFormat) {
      toast.error('Please select an export format')
      return
    }

    setIsExporting(true)

    try {
      const response = await fetch(`/api/projects/${projectId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ format: selectedFormat })
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const data = await response.json()

      // Trigger file download
      downloadFile(data.content, data.filename, data.contentType)

      toast.success(`${selectedFormat} export successful`, {
        description: `Downloaded ${data.filename}`
      })

      onClose()
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Export failed', {
        description: 'An error occurred while exporting the BOM'
      })
    } finally {
      setIsExporting(false)
    }
  }

  const downloadFile = (content: string, filename: string, contentType: string) => {
    let blob: Blob

    if (contentType.includes('spreadsheetml')) {
      // Excel file - content is base64 encoded
      const byteCharacters = atob(content)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      blob = new Blob([byteArray], { type: contentType })
    } else {
      // Text-based formats (XML, CSV, JSON)
      blob = new Blob([content], { type: contentType })
    }

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Export BOM
          </DialogTitle>
          <DialogDescription>
            Export {packageName} ({projectNumber}) in your preferred format
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as ExportFormat)}>
            <div className="space-y-3">
              {formatOptions.map((option) => (
                <div
                  key={option.value}
                  className="flex items-start space-x-3 p-3 rounded-md border cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => setSelectedFormat(option.value)}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                  <div className="flex-1 space-y-1">
                    <Label htmlFor={option.value} className="cursor-pointer font-medium">
                      {option.label}
                      <span className="ml-2 text-xs text-muted-foreground">{option.fileExtension}</span>
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
