'use client'

import { useState, useRef, useEffect } from 'react'
import { useBOMStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Upload, Trash2, FileJson, Check, Loader2, RefreshCw, Star } from 'lucide-react'
import type { GlenairCatalog } from '@/lib/store'

interface CatalogManagerProps {
  onCatalogSelect?: (catalogId: string) => void
  selectedCatalogId?: string | null
}

export function CatalogManager({
  onCatalogSelect,
  selectedCatalogId
}: CatalogManagerProps) {
  const {
    glenairCatalogs,
    loading,
    fetchGlenairCatalogs,
    uploadGlenairCatalog,
    deleteGlenairCatalog,
    setCurrentCatalogId
  } = useBOMStore()

  const [seeding, setSeeding] = useState(false)

  const [uploadOpen, setUploadOpen] = useState(false)
  const [catalogName, setCatalogName] = useState('')
  const [catalogVersion, setCatalogVersion] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch catalogs on mount
  useEffect(() => {
    fetchGlenairCatalogs()
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.json')) {
        setUploadError('Please select a JSON file')
        return
      }
      setUploadFile(file)
      setUploadError(null)
      
      // Auto-fill name from filename
      if (!catalogName) {
        const baseName = file.name.replace('.json', '').replace(/_/g, ' ')
        setCatalogName(baseName)
      }
    }
  }

  const handleUpload = async () => {
    if (!uploadFile || !catalogName || !catalogVersion) {
      setUploadError('Please fill in all fields')
      return
    }

    setUploading(true)
    setUploadError(null)

    try {
      const text = await uploadFile.text()
      const json = JSON.parse(text)

      // Validate JSON structure
      if (!json.tables || !Array.isArray(json.tables)) {
        throw new Error('Invalid JSON format: expected { tables: [...] }')
      }

      // Validate table structure
      for (let i = 0; i < json.tables.length; i++) {
        const table = json.tables[i]
        if (!table.headers || !Array.isArray(table.headers)) {
          throw new Error(`Table ${i + 1} is missing headers array`)
        }
        if (!table.data || !Array.isArray(table.data)) {
          throw new Error(`Table ${i + 1} is missing data array`)
        }
        if (typeof table.page !== 'number') {
          throw new Error(`Table ${i + 1} is missing page number`)
        }
      }

      await uploadGlenairCatalog(catalogName, catalogVersion, json.tables)
      
      // Reset form
      setCatalogName('')
      setCatalogVersion('')
      setUploadFile(null)
      setUploadOpen(false)
      
      // Refresh catalogs
      await fetchGlenairCatalogs()
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload catalog')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (catalog: GlenairCatalog) => {
    try {
      await deleteGlenairCatalog(catalog.id)
      if (selectedCatalogId === catalog.id) {
        setCurrentCatalogId(null)
        onCatalogSelect?.(glenairCatalogs[0]?.id || '')
      }
    } catch (err) {
      console.error('Failed to delete catalog:', err)
    }
  }

  const handleSelect = (catalogId: string) => {
    setCurrentCatalogId(catalogId)
    onCatalogSelect?.(catalogId)
  }

  const handleResetToDefault = async () => {
    setSeeding(true)
    try {
      const response = await fetch('/api/glenair/seed', { method: 'POST' })
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Default Glenair catalog re-seeded successfully')
        // Refresh catalogs
        await fetchGlenairCatalogs()
        // Auto-select the new default catalog
        setCurrentCatalogId(result.catalog.id)
        onCatalogSelect?.(result.catalog.id)
      } else {
        console.log('ℹ️ Default catalog already exists')
      }
    } catch (error) {
      console.error('Failed to reset to default catalog:', error)
    } finally {
      setSeeding(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Glenair Catalogs</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetToDefault}
            disabled={seeding}
          >
            {seeding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Seeding...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to Default
              </>
            )}
          </Button>
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Upload Catalog
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Glenair Catalog</DialogTitle>
              <DialogDescription>
                Upload a validated JSON file containing Glenair catalog tables.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Catalog Name</Label>
                <Input
                  placeholder="e.g., Glenair Series 80"
                  value={catalogName}
                  onChange={(e) => setCatalogName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Version</Label>
                <Input
                  placeholder="e.g., 2024.1"
                  value={catalogVersion}
                  onChange={(e) => setCatalogVersion(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>JSON File</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept=".json"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileJson className="h-4 w-4 mr-2" />
                    {uploadFile ? uploadFile.name : 'Select JSON File'}
                  </Button>
                </div>
              </div>

              {uploadError && (
                <p className="text-sm text-destructive">{uploadError}</p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading && glenairCatalogs.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : glenairCatalogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileJson className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No catalogs uploaded yet</p>
            <p className="text-sm">Upload a Glenair catalog JSON to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {glenairCatalogs.map((catalog) => {
              const isSelected = selectedCatalogId === catalog.id

              return (
                <div
                  key={catalog.id}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 ${
                    isSelected ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => handleSelect(catalog.id)}
                >
                  <div className="flex items-center gap-3">
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{catalog.name}</p>
                        {catalog.name === 'Glenair Series 80' && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        v{catalog.version} • {catalog.tableCount} tables
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {new Date(catalog.uploadedAt).toLocaleDateString()}
                    </Badge>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Catalog?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{catalog.name}" and all its tables.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => handleDelete(catalog)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
