'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { 
  ArrowLeft,
  Download,
  Upload,
  Plus,
  RefreshCw,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useBOMStore, BinLabel } from '@/lib/store'
import { LabelWorksheetTable } from '@/components/LabelWorksheetTable'
import { openProjectManager } from '@/lib/header-actions'

export default function LabelsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  
  const {
    currentProject,
    binLabels,
    loading,
    error,
    fetchProject,
    fetchBinLabels,
    createBinLabel,
    updateBinLabel,
    deleteBinLabels,
    syncLabelsFromProject,
    addLabelRows,
    exportLabelsPDF
  } = useBOMStore()

  const [isExporting, setIsExporting] = useState(false)



  useEffect(() => {
    if (projectId) {
      // Fetch project and labels
      fetchProject(projectId)
      fetchBinLabels(projectId)
    }
  }, [projectId, fetchProject, fetchBinLabels])

  const handleSyncFromProject = async () => {
    try {
      const result = await syncLabelsFromProject(projectId)
      toast.success('Sync completed', {
        description: 'Labels synced from project.'
      })
    } catch (error) {
      toast.error('Failed to sync labels', {
        description: 'An error occurred while syncing labels from the project.'
      })
    }
  }

  const handleAddRows = async (count: number) => {
    try {
      await addLabelRows(projectId, count)
      toast.success(`Added ${count} new label row(s)`)
    } catch (error) {
      toast.error('Failed to add rows', {
        description: 'An error occurred while adding new label rows.'
      })
    }
  }

  const handleRowUpdate = async (rowId: string, field: string, value: any) => {
    try {
      await updateBinLabel(projectId, rowId, { [field]: value })
    } catch (error) {
      toast.error('Failed to update label', {
        description: 'An error occurred while updating the label.'
      })
    }
  }

  const handleRowsDelete = async (rowIds: string[]) => {
    try {
      await deleteBinLabels(rowIds)
      toast.success(`Deleted ${rowIds.length} label(s)`)
    } catch (error) {
      toast.error('Failed to delete labels', {
        description: 'An error occurred while deleting the labels.'
      })
    }
  }

  const handleExportPdf = async (labelIds: string[]) => {
    setIsExporting(true)
    try {
      const result = await exportLabelsPDF(projectId, labelIds)
      
      // Download the PDF
      const link = document.createElement('a')
      link.href = `data:application/pdf;base64,${result.content}`
      link.download = result.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('PDF exported successfully', {
        description: `Downloaded ${result.filename} with ${labelIds.length} label(s).`
      })
    } catch (error) {
      toast.error('Failed to export PDF', {
        description: 'An error occurred while generating the PDF.'
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          {currentProject && (
            <div>
              <h1 className="text-2xl font-bold">{currentProject.projectNumber}</h1>
              <p className="text-sm text-muted-foreground">{currentProject.packageName}</p>
            </div>
          )}
        </div>
        
        <Button variant="outline" onClick={openProjectManager}>
          Switch Project
        </Button>
      </div>

      {/* Project Info Card */}
      {currentProject && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Bin Label Generator
              <Badge variant="outline">
                {binLabels.length} Label{binLabels.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
            <CardDescription>
              Generate QR code labels for warehouse bin management. Sync from your BOM project or create labels manually.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Project:</span> {currentProject.projectNumber}
              </div>
              <div>
                <span className="font-medium">Package:</span> {currentProject.packageName}
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <Badge variant="secondary" className="ml-2">
                  {currentProject.status}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Version:</span> {currentProject.version}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Labels Table */}
      <Card>
        <CardHeader>
          <CardTitle>Label Worksheet</CardTitle>
          <CardDescription>
            Edit label information in the table below. Click cells to edit inline. Changes are auto-saved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !binLabels.length ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading labels...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              Error loading labels: {error}
            </div>
          ) : (
            <LabelWorksheetTable
              rows={binLabels}
              onRowUpdate={handleRowUpdate}
              onRowsDelete={handleRowsDelete}
              onRowsAdd={handleAddRows}
              onSyncFromProject={handleSyncFromProject}
              onExportPdf={handleExportPdf}
              loading={loading}
            />
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex gap-2">
            <span className="font-medium">1. Sync:</span>
            <span>Click "Sync from Project" to auto-populate Kit strings from your BOM locations.</span>
          </div>
          <div className="flex gap-2">
            <span className="font-medium">2. Edit:</span>
            <span>Fill in Building Code, Bin number, Category, Description, and Build QTY.</span>
          </div>
          <div className="flex gap-2">
            <span className="font-medium">3. QR:</span>
            <span>QR codes are generated automatically in format: B{`{building}`}-{`{bin}`}-{`{package}`}-{`{category}{location}`}.</span>
          </div>
          <div className="flex gap-2">
            <span className="font-medium">4. Export:</span>
            <span>Click "Export PDF" to download 4x6 inch thermal printer labels.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
