'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BOMItem } from '@/lib/autocad-extractor/types'

interface ExportButtonProps {
  items: BOMItem[]
  fileName: string
  disabled?: boolean
}

export function ExportButton({ items, fileName, disabled }: ExportButtonProps) {
  const handleExport = async () => {
    try {
      const response = await fetch('/api/autocad-extractor/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          fileName: fileName.replace('.pdf', '')
        })
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Download file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${fileName.replace('.pdf', '')}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export Excel file')
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={disabled || items.length === 0}
      size="lg"
      className="w-full"
    >
      <Download className="mr-2 h-5 w-5" />
      Export to Excel
    </Button>
  )
}
