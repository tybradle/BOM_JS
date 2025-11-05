'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useBOMStore, DatabaseImportResult, MasterPartsImportResult, DatabaseExportProgress } from '@/lib/store'
import { DatabaseArchiveEntry } from '@/types/database'
import { Download, UploadCloud, Database, ServerCog, RefreshCw, HardDriveDownload, FileSpreadsheet, Eye } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { MasterPartsImportDialog } from './MasterPartsImportDialog'

interface DatabaseToolsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

export function DatabaseToolsDialog({ open, onOpenChange, children }: DatabaseToolsDialogProps) {
  const downloadDatabaseArchive = useBOMStore((state) => state.downloadDatabaseArchive)
  const downloadDatabaseArchiveWithProgress = useBOMStore((state) => state.downloadDatabaseArchiveWithProgress)
  const uploadDatabaseArchive = useBOMStore((state) => state.uploadDatabaseArchive)
  const launchPrismaStudio = useBOMStore((state) => state.launchPrismaStudio)
  const fetchProjects = useBOMStore((state) => state.fetchProjects)
  const fetchDatabaseArchives = useBOMStore((state) => state.fetchDatabaseArchives)
  const importDatabaseArchivePath = useBOMStore((state) => state.importDatabaseArchivePath)
  const createDatabaseArchive = useBOMStore((state) => state.createDatabaseArchive)
  const deleteDatabaseArchive = useBOMStore((state) => state.deleteDatabaseArchive)
  const restoreDatabaseArchive = useBOMStore((state) => state.restoreDatabaseArchive)
  const uploadMasterParts = useBOMStore((state) => state.uploadMasterParts)
  const setExportProgress = useBOMStore((state) => state.setExportProgress)
  const exportProgress = useBOMStore((state) => state.exportProgress)
  const { toast } = useToast()

  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isLaunchingStudio, setIsLaunchingStudio] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [lastImportResult, setLastImportResult] = useState<DatabaseImportResult | null>(null)
  const [studioUrl, setStudioUrl] = useState<string | null>(null)
  const [archives, setArchives] = useState<DatabaseArchiveEntry[]>([])
  const [isLoadingArchives, setIsLoadingArchives] = useState(false)
  const [isImportingArchive, setIsImportingArchive] = useState<string | null>(null)
  const [currentExportProgress, setCurrentExportProgress] = useState<DatabaseExportProgress | null>(null)
  const [isCreatingArchive, setIsCreatingArchive] = useState(false)
  const [archiveDescription, setArchiveDescription] = useState('')
  const [isDeletingArchive, setIsDeletingArchive] = useState<string | null>(null)
  
  // Master Parts Import state
  const [isImportingParts, setIsImportingParts] = useState(false)
  const [selectedPartsFile, setSelectedPartsFile] = useState<File | null>(null)
  const [lastPartsImportResult, setLastPartsImportResult] = useState<MasterPartsImportResult | null>(null)
  const [clearExistingParts, setClearExistingParts] = useState(false)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const partsFileInputRef = useRef<HTMLInputElement | null>(null)
  
  const formattedArchives = useMemo(() => {
    return archives.map((archive) => ({
      ...archive,
      sizeLabel: `${(archive.size / (1024 * 1024)).toFixed(1)} MB`,
      modifiedLabel: new Date(archive.modifiedAt).toLocaleString()
    }))
  }, [archives])

  const refreshArchives = useCallback(async () => {
    setIsLoadingArchives(true)
    try {
      const list = await fetchDatabaseArchives()
      setArchives(list)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load archives.'
      toast({ title: 'Failed to load archives', description: message, variant: 'destructive' })
    } finally {
      setIsLoadingArchives(false)
    }
  }, [fetchDatabaseArchives, toast])

  useEffect(() => {
    if (open) {
      refreshArchives()
    }
  }, [open, refreshArchives])


  const resetFileInput = useCallback(() => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleDownload = useCallback(async () => {
    setIsExporting(true)
    setCurrentExportProgress(null)
    
    try {
      const { blob, filename } = await downloadDatabaseArchiveWithProgress((progress) => {
        setCurrentExportProgress(progress)
        setExportProgress(progress)
      })
      
      // Check if running in Electron
      const isElectron = typeof window !== 'undefined' && 
                        window.electronAPI !== undefined
      
      if (isElectron && window.electronAPI) {
        // Electron: Use native save dialog
        const { filePath, canceled } = await window.electronAPI.showSaveDialog({
          defaultPath: filename,
          filters: [
            { name: 'ZIP Archive', extensions: ['zip'] }
          ]
        })
        
        if (canceled || !filePath) {
          toast({
            title: 'Export cancelled',
            description: 'Database export was cancelled.'
          })
          setIsExporting(false)
          return
        }
        
        // Write the blob to the selected file path using Electron's file system
        const buffer = await blob.arrayBuffer()
        const result = await window.electronAPI.writeFile(filePath, buffer)
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to write file')
        }
        
        toast({
          title: 'Database export ready',
          description: `Archive saved to ${filePath}`
        })
      } else {
        // Web browser: Use blob download
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = filename
        document.body.appendChild(anchor)
        anchor.click()
        document.body.removeChild(anchor)
        setTimeout(() => URL.revokeObjectURL(url), 1000)

        toast({
          title: 'Database export ready',
          description: `Archive ${filename} downloaded. Store it in a safe location.`
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export database.'
      toast({
        title: 'Database export failed',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsExporting(false)
      setCurrentExportProgress(null)
      setExportProgress(null)
    }
  }, [downloadDatabaseArchiveWithProgress, setExportProgress, toast])

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setSelectedFile(null)
      return
    }

    if (!file.name.toLowerCase().endsWith('.zip')) {
      toast({
        title: 'Unsupported file type',
        description: 'Please select a .zip archive created from this application.',
        variant: 'destructive'
      })
      event.target.value = ''
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
  }, [toast])

  const handleImport = useCallback(async () => {
    if (!selectedFile) {
      toast({
        title: 'Select an archive first',
        description: 'Choose a .zip backup archive before importing.',
        variant: 'destructive'
      })
      return
    }

    if (!confirm('Importing will replace the current database. Continue?')) {
      return
    }

    setIsImporting(true)
    try {
      const result = await uploadDatabaseArchive(selectedFile)
      setLastImportResult(result)
      toast({
        title: 'Database import successful',
        description: result.backup
          ? `Previous database backed up as ${result.backup}.`
          : 'Database replaced successfully.'
      })

      await fetchProjects()
      resetFileInput()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import database.'
      toast({
        title: 'Database import failed',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsImporting(false)
    }
  }, [fetchProjects, resetFileInput, selectedFile, toast, uploadDatabaseArchive])

  const handleImportArchivePath = useCallback(async (archivePath: string) => {
    if (!archivePath) return

    if (!confirm('Importing this archive will replace the current database. Continue?')) {
      return
    }

    setIsImportingArchive(archivePath)
    try {
      const result = await importDatabaseArchivePath(archivePath)
      setLastImportResult(result)
      toast({
        title: 'Database import successful',
        description: result.backup
          ? `Previous database backed up as ${result.backup}.`
          : 'Database replaced successfully.'
      })

      await fetchProjects()
      await refreshArchives()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import database.'
      toast({
        title: 'Database import failed',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsImportingArchive(null)
    }
  }, [fetchProjects, importDatabaseArchivePath, refreshArchives, toast])

  const handleLaunchStudio = useCallback(async () => {
    setIsLaunchingStudio(true)
    try {
      const { url } = await launchPrismaStudio()
      setStudioUrl(url)
      toast({
        title: 'Prisma Studio launched',
        description: `Studio is available at ${url}`
      })
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to launch Prisma Studio.'
      toast({
        title: 'Prisma Studio launch failed',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsLaunchingStudio(false)
    }
  }, [launchPrismaStudio, toast])

  const handleCreateArchive = useCallback(async () => {
    if (!archiveDescription.trim()) {
      toast({
        title: 'Description required',
        description: 'Please enter a description for the archive.',
        variant: 'destructive'
      })
      return
    }

    setIsCreatingArchive(true)
    try {
      const result = await createDatabaseArchive(archiveDescription.trim())
      toast({
        title: 'Archive created successfully',
        description: `Archive ${result.filename} has been created.`
      })
      setArchiveDescription('')
      await refreshArchives()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create archive.'
      toast({
        title: 'Archive creation failed',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsCreatingArchive(false)
    }
  }, [archiveDescription, createDatabaseArchive, refreshArchives, toast])

  const handleDeleteArchive = useCallback(async (archivePath: string, archiveName: string) => {
    if (!confirm(`Are you sure you want to delete archive "${archiveName}"? This action cannot be undone.`)) {
      return
    }

    setIsDeletingArchive(archivePath)
    try {
      const result = await deleteDatabaseArchive(archivePath)
      toast({
        title: 'Archive deleted successfully',
        description: result.message
      })
      await refreshArchives()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete archive.'
      toast({
        title: 'Archive deletion failed',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsDeletingArchive(null)
    }
  }, [deleteDatabaseArchive, refreshArchives, toast])

  const handleRestoreArchive = useCallback(async (archivePath: string, archiveName: string) => {
    if (!confirm(`Restoring archive "${archiveName}" will replace the current database. Continue?`)) {
      return
    }

    setIsImportingArchive(archivePath)
    try {
      const result = await restoreDatabaseArchive(archivePath, true)
      setLastImportResult({
        message: result.message,
        backup: result.backupPath || null,
        validation: {
          tables: [],
          integrity: 'Restored successfully'
        }
      })
      toast({
        title: 'Database restored successfully',
        description: result.backupPath
          ? `Previous database backed up as ${result.backupPath}.`
          : 'Database restored successfully.'
      })

      await fetchProjects()
      await refreshArchives()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restore archive.'
      toast({
        title: 'Archive restore failed',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsImportingArchive(null)
    }
  }, [fetchProjects, restoreDatabaseArchive, refreshArchives, toast])

  const resetPartsFileInput = useCallback(() => {
    setSelectedPartsFile(null)
    if (partsFileInputRef.current) {
      partsFileInputRef.current.value = ''
    }
  }, [])

  const handlePartsFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setSelectedPartsFile(null)
      return
    }

    const fileName = file.name.toLowerCase()
    const validExtensions = ['.csv', '.xlsx', '.xls']
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext))

    if (!hasValidExtension) {
      toast({
        title: 'Unsupported file type',
        description: 'Please select a CSV or Excel (.xlsx/.xls) file.',
        variant: 'destructive'
      })
      event.target.value = ''
      setSelectedPartsFile(null)
      return
    }

    setSelectedPartsFile(file)
  }, [toast])

  const handlePartsImport = useCallback(async () => {
    if (!selectedPartsFile) {
      toast({
        title: 'Select a file first',
        description: 'Choose a parts file before importing.',
        variant: 'destructive'
      })
      return
    }

    const action = clearExistingParts ? 'replace' : 'update'
    const confirmMessage = clearExistingParts
      ? 'This will delete all existing parts and import new ones. Continue?'
      : 'This will add new parts and update existing ones. Continue?'

    if (!confirm(confirmMessage)) {
      return
    }

    setIsImportingParts(true)
    try {
      const result = await uploadMasterParts(selectedPartsFile, clearExistingParts)
      setLastPartsImportResult(result)
      
      const { imported, updated, errors } = result.summary
      toast({
        title: 'Master parts import successful',
        description: `Imported: ${imported}, Updated: ${updated}, Errors: ${errors}`
      })

      resetPartsFileInput()
      setClearExistingParts(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import master parts.'
      toast({
        title: 'Master parts import failed',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsImportingParts(false)
    }
  }, [clearExistingParts, resetPartsFileInput, selectedPartsFile, toast, uploadMasterParts])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Database Management</DialogTitle>
          <DialogDescription>
            Import or export the application database, or launch Prisma Studio for direct inspection.
          </DialogDescription>
        </DialogHeader>

  <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-md bg-blue-100 p-2 text-blue-700">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Export Database</h3>
                <p className="text-sm text-muted-foreground">
                  Download the active SQLite database as a zipped archive.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {currentExportProgress && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{currentExportProgress.message}</span>
                    <span className="text-muted-foreground">{currentExportProgress.progress}%</span>
                  </div>
                  <Progress value={currentExportProgress.progress} className="w-full" />
                  {currentExportProgress.details && (
                    <p className="text-xs text-muted-foreground">{currentExportProgress.details}</p>
                  )}
                </div>
              )}
              <Button onClick={handleDownload} disabled={isExporting} className="w-full">
                {isExporting ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {isExporting ? 'Exporting...' : 'Export Database'}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-md bg-amber-100 p-2 text-amber-700">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Import Database</h3>
                <p className="text-sm text-muted-foreground">
                  Replace the current database using a backup archive (.zip).
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="database-import-file">Backup Archive</Label>
                <Input
                  id="database-import-file"
                  type="file"
                  accept=".zip"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
                {selectedFile && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <Button variant="outline" onClick={resetFileInput} disabled={!selectedFile || isImporting}>
                  Clear Selection
                </Button>
                <Button onClick={handleImport} disabled={isImporting || !selectedFile}>
                  {isImporting ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UploadCloud className="mr-2 h-4 w-4" />
                  )}
                  {isImporting ? 'Importing...' : 'Import Database'}
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-md bg-green-100 p-2 text-green-700">
                <ServerCog className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Launch Prisma Studio</h3>
                <p className="text-sm text-muted-foreground">
                  Open Prisma Studio in your browser to inspect or edit data.
                </p>
              </div>
            </div>
            <Button onClick={handleLaunchStudio} disabled={isLaunchingStudio} className="w-full">
              {isLaunchingStudio ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Database className="mr-2 h-4 w-4" />
              )}
              {isLaunchingStudio ? 'Starting Prisma Studio...' : 'Launch Prisma Studio'}
            </Button>
            {studioUrl && (
              <p className="mt-2 text-xs text-muted-foreground">
                Last opened: <a href={studioUrl} className="underline" target="_blank" rel="noreferrer">{studioUrl}</a>
              </p>
            )}
          </div>

          <div className="rounded-lg border p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-md bg-slate-100 p-2 text-slate-700">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Last Import Summary</h3>
                <p className="text-sm text-muted-foreground">
                  Review details from the most recent import operation.
                </p>
              </div>
            </div>
            {lastImportResult ? (
              <div className="space-y-2 text-sm">
                <p>Status: {lastImportResult.validation.integrity}</p>
                <p>Tables detected: {lastImportResult.validation.tables.join(', ')}</p>
                {lastImportResult.backup && (
                  <p className="text-xs text-muted-foreground">
                    Backup created: {lastImportResult.backup}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No import has been run in this session.
              </p>
            )}
          </div>

          <div className="md:col-span-2 rounded-lg border p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-md bg-blue-100 p-2 text-blue-700">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Create Archive</h3>
                <p className="text-sm text-muted-foreground">
                  Create a new database archive with a description.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="archive-description">Description</Label>
                <Input
                  id="archive-description"
                  type="text"
                  placeholder="Enter archive description (e.g., 'Weekly backup')"
                  value={archiveDescription}
                  onChange={(e) => setArchiveDescription(e.target.value)}
                  disabled={isCreatingArchive}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setArchiveDescription('')} 
                  disabled={!archiveDescription.trim() || isCreatingArchive}
                >
                  Clear
                </Button>
                <Button 
                  onClick={handleCreateArchive} 
                  disabled={!archiveDescription.trim() || isCreatingArchive}
                >
                  {isCreatingArchive ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Database className="mr-2 h-4 w-4" />
                  )}
                  {isCreatingArchive ? 'Creating...' : 'Create Archive'}
                </Button>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 rounded-lg border p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-purple-100 p-2 text-purple-700">
                  <HardDriveDownload className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">Available Archives</h3>
                  <p className="text-sm text-muted-foreground">
                    Restore from previously exported database archives.
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={refreshArchives} disabled={isLoadingArchives}>
                {isLoadingArchives ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>

            <div className="space-y-3">
              {formattedArchives.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {isLoadingArchives ? 'Loading archives...' : 'No archives found in the configured directories.'}
                </p>
              ) : (
                <ScrollArea className="max-h-64">
                  <div className="space-y-2">
                    {formattedArchives.map((archive) => (
                      <div key={archive.path} className="flex items-center justify-between gap-3 rounded-md border p-3">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{archive.name}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="secondary">{archive.sizeLabel}</Badge>
                            <span>{archive.modifiedLabel}</span>
                            <span className="max-w-[220px] truncate" title={archive.location}>{archive.location}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestoreArchive(archive.path, archive.name)}
                            disabled={isImportingArchive === archive.path}
                          >
                            {isImportingArchive === archive.path ? (
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <UploadCloud className="mr-2 h-4 w-4" />
                            )}
                            {isImportingArchive === archive.path ? 'Restoring...' : 'Restore'}
                          </Button>
                          <a
                            href={`/api/database/archive?path=${encodeURIComponent(archive.path)}`}
                            className={cn('inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted')}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </a>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteArchive(archive.path, archive.name)}
                            disabled={isDeletingArchive === archive.path}
                          >
                            {isDeletingArchive === archive.path ? (
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <UploadCloud className="mr-2 h-4 w-4" />
                            )}
                            {isDeletingArchive === archive.path ? 'Deleting...' : 'Delete'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
          
          <div className="md:col-span-2 rounded-lg border p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-md bg-indigo-100 p-2 text-indigo-700">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Master Parts Import</h3>
                <p className="text-sm text-muted-foreground">
                  Upload CSV or Excel file to import master parts catalog data.
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="parts-import-file">Parts File (CSV or Excel)</Label>
                <Input
                  id="parts-import-file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handlePartsFileChange}
                  ref={partsFileInputRef}
                />
                {selectedPartsFile && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {selectedPartsFile.name} ({(selectedPartsFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="clear-existing-parts"
                  checked={clearExistingParts}
                  onChange={(e) => setClearExistingParts(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="clear-existing-parts" className="text-sm font-normal cursor-pointer">
                  Clear existing parts before import (replaces all data)
                </Label>
              </div>
              
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setPreviewDialogOpen(true)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview Import
                  </Button>
                  <Button variant="outline" onClick={resetPartsFileInput} disabled={!selectedPartsFile || isImportingParts}>
                    Clear Selection
                  </Button>
                </div>
                <Button onClick={handlePartsImport} disabled={isImportingParts || !selectedPartsFile}>
                  {isImportingParts ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UploadCloud className="mr-2 h-4 w-4" />
                  )}
                  {isImportingParts ? 'Importing...' : 'Import Master Parts'}
                </Button>
              </div>
              
              {lastPartsImportResult && (
                <div className="mt-3 rounded-md border bg-muted/50 p-3">
                  <h4 className="text-sm font-semibold mb-2">Last Import Summary</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Format:</span> {lastPartsImportResult.format.toUpperCase()}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span> {lastPartsImportResult.summary.duration}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Imported:</span> {lastPartsImportResult.summary.imported}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Updated:</span> {lastPartsImportResult.summary.updated}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total:</span> {lastPartsImportResult.summary.totalParsed}
                    </div>
                    <div className={lastPartsImportResult.summary.errors > 0 ? 'text-destructive' : ''}>
                      <span className="text-muted-foreground">Errors:</span> {lastPartsImportResult.summary.errors}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
      
      {/* Master Parts Import Preview Dialog */}
      <MasterPartsImportDialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        onImportComplete={() => {
          setPreviewDialogOpen(false)
          // Refresh data or trigger any needed updates
        }}
      />
    </Dialog>
  )
}
