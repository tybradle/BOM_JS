'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Settings, Loader2, Upload, RefreshCw } from 'lucide-react'
import { useBOMStore } from '@/lib/store'
import { PartNumberBuilder } from '@/components/glenair/PartNumberBuilder'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CatalogManager } from '@/components/glenair/CatalogManager'

export default function GlenairPage() {
  const {
    glenairCatalogs,
    currentCatalogId,
    fetchGlenairCatalogs,
    setCurrentCatalogId,
    resetGlenairBuilder
  } = useBOMStore()

  const [initializing, setInitializing] = useState(true)
  const [catalogDialogOpen, setCatalogDialogOpen] = useState(false)

  // Initialize: fetch catalogs and auto-seed/select default
  useEffect(() => {
    const initialize = async () => {
      setInitializing(true)
      try {
        // Fetch existing catalogs
        await fetchGlenairCatalogs()
        
        // Get current state after fetch
        const catalogs = useBOMStore.getState().glenairCatalogs
        
        // If no catalogs, seed the default
        if (catalogs.length === 0) {
          const response = await fetch('/api/glenair/seed', { method: 'POST' })
          const result = await response.json()
          
          if (result.success || result.catalog) {
            await fetchGlenairCatalogs()
            // Auto-select the default catalog
            const updatedCatalogs = useBOMStore.getState().glenairCatalogs
            if (updatedCatalogs.length > 0) {
              setCurrentCatalogId(updatedCatalogs[0].id)
            }
          }
        } else if (!currentCatalogId) {
          // Auto-select first catalog if none selected
          setCurrentCatalogId(catalogs[0].id)
        }
      } catch (error) {
        console.error('Failed to initialize Glenair:', error)
      } finally {
        setInitializing(false)
      }
    }
    
    initialize()
  }, [fetchGlenairCatalogs, setCurrentCatalogId, currentCatalogId])

  const handleCatalogSelect = (catalogId: string) => {
    setCurrentCatalogId(catalogId)
    resetGlenairBuilder()
    setCatalogDialogOpen(false)
  }

  const currentCatalog = glenairCatalogs.find(c => c.id === currentCatalogId)

  // Loading state
  if (initializing) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Loading Glenair catalog...</p>
          </div>
        </div>
      </div>
    )
  }

  // No catalog available
  if (!currentCatalogId || !currentCatalog) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/" className="flex items-center">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Glenair Part Builder</h1>
              <p className="text-muted-foreground">
                Build Glenair connector part numbers
              </p>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              No Glenair catalog available. Please upload a catalog to get started.
            </AlertDescription>
          </Alert>

          <CatalogManager
            onCatalogSelect={handleCatalogSelect}
            selectedCatalogId={currentCatalogId}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/" className="flex items-center">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Glenair Part Builder</h1>
              <p className="text-muted-foreground">
                Build Glenair connector part numbers
              </p>
            </div>
          </div>

          {/* Catalog Info & Settings */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {currentCatalog.name} v{currentCatalog.version}
            </Badge>
            
            <Dialog open={catalogDialogOpen} onOpenChange={setCatalogDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Catalog Settings</DialogTitle>
                  <DialogDescription>
                    Manage Glenair catalogs and upload new versions
                  </DialogDescription>
                </DialogHeader>
                <CatalogManager
                  onCatalogSelect={handleCatalogSelect}
                  selectedCatalogId={currentCatalogId}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Part Number Builder */}
        <PartNumberBuilder
          catalogId={currentCatalogId}
        />
      </div>
    </div>
  )
}
