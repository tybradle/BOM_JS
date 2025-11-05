'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { 
  Plus, 
  Download, 
  Upload, 
  FileText, 
  Database,
  Settings,
  Search,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  ArrowLeft,
  FolderOpen
} from 'lucide-react'
import Link from 'next/link'
import { useBOMStore } from '@/lib/store'
import { openProjectManager } from '@/lib/header-actions'
import { EditableBOMTable } from '@/components/editable-bom-table'
import { LocationTabs } from '@/components/LocationTabs'

// Check if we're in Electron
const isElectron = typeof window !== 'undefined' && 
  (window as any).process && 
  (window as any).process.type

export default function BOMProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  
  const {
    currentProject,
    bomItems,
    locations,
    currentLocationId,
    loading,
    error,
    searchTerm,
    selectedItems,
    fetchProject,
    fetchBOMItems,
    fetchLocations,
    addBOMItem,
    updateBOMItem,
    deleteBOMItem,
    exportBOM,
    setCurrentProject,
    setCurrentLocation,
    setSearchTerm,
    duplicateItems,
    createLocation,
    deleteLocation
  } = useBOMStore()

  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isDatabaseOpen, setIsDatabaseOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filters, setFilters] = useState({
    status: 'ALL',
    category: '',
    manufacturer: '',
    supplier: '',
    isSpare: 'ALL'
  })
  const [newItem, setNewItem] = useState({
    partNumber: '',
    description: '',
    quantity: 1,
    unit: 'PCS',
    manufacturer: '',
    supplier: '',
    category: ''
  })
  const [appVersion, setAppVersion] = useState('')

  const { toast } = useToast()

  useEffect(() => {
    // Get app version if in Electron
    if (isElectron && window.electronAPI) {
      window.electronAPI.getVersion().then(setAppVersion)
      
      // Set up menu event listeners
      window.electronAPI.onMenuAction((action: string) => {
        switch (action) {
          case 'menu-new-project':
            openProjectManager()
            break
          case 'menu-export-xml':
            if (currentProject) {
              handleExport('XML')
            }
            break
          default:
            break
        }
      })
    }
  }, [currentProject, currentLocationId, router])

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId)
    }
  }, [projectId, fetchProject])

  useEffect(() => {
    if (currentProject && currentProject.id === projectId) {
      fetchBOMItems(currentProject.id, currentLocationId || undefined)
      fetchLocations(currentProject.id)
    }
  }, [currentProject, projectId, currentLocationId, fetchBOMItems, fetchLocations])

  const handleAddItem = async () => {
    if (!currentProject || !currentLocationId || !newItem.partNumber || !newItem.description) return

    await addBOMItem(currentProject.id, {
      ...newItem,
      locationId: currentLocationId,
      status: 'ACTIVE' as const,
      isSpare: false
    })

    setNewItem({
      partNumber: '',
      description: '',
      quantity: 1,
      unit: 'PCS',
      manufacturer: '',
      supplier: '',
      category: ''
    })
    setIsAddItemOpen(false)

    toast({
      title: "Item added",
      description: "BOM item has been added successfully."
    })
  }

  const handleExport = async (format: 'XML' | 'JSON' | 'CSV') => {
    if (!currentProject) return

    try {
      const result = await exportBOM(currentProject.id, format)
      
      // Handle file save differently in Electron vs web
      if (isElectron && window.electronAPI) {
        const { filePath } = await window.electronAPI.showSaveDialog({
          defaultPath: result.filename,
          filters: [
            { name: format, extensions: [format.toLowerCase()] }
          ]
        })
        
        if (filePath) {
          // In a real implementation, you'd save the file here
          // For now, we'll create a download link
          const blob = new Blob([result.content], { 
            type: format === 'XML' ? 'application/xml' : 'text/plain' 
          })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = result.filename
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }
      } else {
        // Web download
        const blob = new Blob([result.content], { 
          type: format === 'XML' ? 'application/xml' : 'text/plain' 
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }

      toast({
        title: "Export successful",
        description: `BOM exported as ${format} file.`
      })
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export BOM. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleLocationAdd = async (name: string) => {
    if (!currentProject) return
    await createLocation(currentProject.id, name)
  }

  const handleLocationDelete = async (locationId: string) => {
    await deleteLocation(locationId)
  }

  const { updateLocation } = useBOMStore()

  const handleLocationUpdate = async (locationId: string, name: string, exportName?: string | null) => {
    if (!currentProject) return
    await updateLocation(locationId, name, exportName)
  }

  const handleRefreshData = async () => {
    if (!currentProject) return
    
    toast({
      title: "Refreshing data",
      description: "Updating project data...",
    })
    
    try {
      await fetchBOMItems(currentProject.id, currentLocationId || undefined)
      await fetchLocations(currentProject.id)
      
      toast({
        title: "Data refreshed",
        description: "Project data has been updated successfully."
      })
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleExportAllData = async () => {
    if (!currentProject) return
    
    try {
      const result = await exportBOM(currentProject.id, 'JSON')
      
      const blob = new Blob([result.content], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentProject.projectNumber}_all_data.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast({
        title: "Export successful",
        description: "All project data has been exported."
      })
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive"
      })
    }
  }

  const filteredItems = bomItems.filter(item => {
    // Search filter
    const matchesSearch = 
      item.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Status filter
    const matchesStatus = filters.status === 'ALL' || item.status === filters.status
    
    // Category filter
    const matchesCategory = !filters.category || 
      item.category?.toLowerCase().includes(filters.category.toLowerCase())
    
    // Manufacturer filter
    const matchesManufacturer = !filters.manufacturer || 
      item.manufacturer?.toLowerCase().includes(filters.manufacturer.toLowerCase())
    
    // Supplier filter
    const matchesSupplier = !filters.supplier || 
      item.supplier?.toLowerCase().includes(filters.supplier.toLowerCase())
    
    // Spare filter
    const matchesSpare = filters.isSpare === 'ALL' || 
      (filters.isSpare === 'YES' && item.isSpare) || 
      (filters.isSpare === 'NO' && !item.isSpare)
    
    return matchesSearch && matchesStatus && matchesCategory && 
           matchesManufacturer && matchesSupplier && matchesSpare
  })

  // If loading, show loading state
  if (loading && !currentProject) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle>Loading Project</CardTitle>
                <CardDescription>
                  Please wait while we load your project...
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // If error, show error state
  if (error && !currentProject) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle>Error</CardTitle>
                <CardDescription>
                  {error}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button onClick={() => openProjectManager()} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Projects
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // If no current project after loading, show not found
  if (!currentProject) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle>Project Not Found</CardTitle>
                <CardDescription>
                  The project you're looking for doesn't exist or has been deleted.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button onClick={() => openProjectManager()} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Projects
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => openProjectManager()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">BOM Management</h1>
              <p className="text-muted-foreground">
                {currentProject.name || `${currentProject.projectNumber} - ${currentProject.packageName}`}
                {isElectron && appVersion && ` - v${appVersion}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsDatabaseOpen(true)}>
              <Database className="w-4 h-4 mr-2" />
              Database
            </Button>
          </div>
        </div>

        <Separator />

        {/* Main BOM Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>BOM Package Management</CardTitle>
                <CardDescription>
                  Manage parts and components for this Package. Lists are separated by kitting locations.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Add BOM Item</DialogTitle>
                      <DialogDescription>
                        Add a new item to {locations.find(l => l.id === currentLocationId)?.name || 'the current location'}.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="part-number">Part Number *</Label>
                          <Input
                            id="part-number"
                            value={newItem.partNumber}
                            onChange={(e) => setNewItem({ ...newItem, partNumber: e.target.value })}
                            placeholder="e.g., PLC-001"
                          />
                        </div>

                        {/* moved Manufacturer up to be right after Part Number */}
                        <div>
                          <Label htmlFor="manufacturer">Manufacturer *</Label>
                          <Input
                            id="manufacturer"
                            value={newItem.manufacturer}
                            onChange={(e) => setNewItem({ ...newItem, manufacturer: e.target.value })}
                            placeholder="e.g., Siemens"
                          />
                        </div>

                        <div>
                          <Label htmlFor="quantity">Quantity *</Label>
                          <Input
                            id="quantity"
                            type="number"
                            value={newItem.quantity}
                            onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 1 })}
                            placeholder="1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="unit">Unit</Label>
                          <Select value={newItem.unit} onValueChange={(value) => setNewItem({ ...newItem, unit: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EA">Each</SelectItem>
                              <SelectItem value="SET">Set</SelectItem>
                              <SelectItem value="M">Meter</SelectItem>
                              <SelectItem value="FT">Foot</SelectItem>
                              <SelectItem value="BOX">Box</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-2">
                          <Label htmlFor="description">Description *</Label>
                          <Input
                            id="description"
                            value={newItem.description}
                            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                            placeholder="e.g., Programmable Logic Controller"
                          />
                        </div>

                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Input
                            id="category"
                            value={newItem.category}
                            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                            placeholder="e.g., Control Systems"
                          />
                        </div>
                        <div>
                          <Label htmlFor="supplier">Supplier</Label>
                          <Input
                            id="supplier"
                            value={newItem.supplier}
                            onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                            placeholder="e.g., Automation Supply Co."
                          />
                        </div>
                      </div>
                      <div className="mt-6">
                        <Button onClick={handleAddItem} className="w-full" disabled={loading || !currentLocationId}>
                          {loading ? 'Adding...' : 'Add Item'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                {/* Settings Dialog */}
                <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Settings</DialogTitle>
                      <DialogDescription>
                        Configure application settings and preferences.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Dark Mode</h4>
                            <p className="text-sm text-muted-foreground">Toggle dark mode theme</p>
                          </div>
                          <Button variant="outline" size="sm">
                            Coming Soon
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Auto-save</h4>
                            <p className="text-sm text-muted-foreground">Automatically save changes</p>
                          </div>
                          <Button variant="outline" size="sm">
                            Coming Soon
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Export Format</h4>
                            <p className="text-sm text-muted-foreground">Default export format</p>
                          </div>
                          <Select defaultValue="XML">
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="XML">XML</SelectItem>
                              <SelectItem value="JSON">JSON</SelectItem>
                              <SelectItem value="CSV">CSV</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button onClick={() => setIsSettingsOpen(false)}>
                          Close
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                {/* Database Dialog */}
                <Dialog open={isDatabaseOpen} onOpenChange={setIsDatabaseOpen}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Database Management</DialogTitle>
                      <DialogDescription>
                        Manage database operations and view statistics.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Projects</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{locations.length > 0 ? 1 : 0}</div>
                            <p className="text-xs text-muted-foreground">Total projects</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Locations</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{locations.length}</div>
                            <p className="text-xs text-muted-foreground">Total locations</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">BOM Items</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{bomItems.length}</div>
                            <p className="text-xs text-muted-foreground">Total items</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Current Location</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-sm font-medium truncate">
                              {locations.find(l => l.id === currentLocationId)?.name || 'None'}
                            </div>
                            <p className="text-xs text-muted-foreground">Active location</p>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="font-medium">Database Operations</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <Button variant="outline" className="w-full" disabled>
                            <Download className="w-4 h-4 mr-2" />
                            Backup Database
                          </Button>
                          <Button variant="outline" className="w-full" disabled>
                            <Upload className="w-4 h-4 mr-2" />
                            Restore Database
                          </Button>
                          <Button variant="outline" className="w-full" onClick={handleRefreshData}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh Data
                          </Button>
                          <Button variant="outline" className="w-full" onClick={handleExportAllData}>
                            <FileText className="w-4 h-4 mr-2" />
                            Export All Data
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button onClick={() => setIsDatabaseOpen(false)}>
                          Close
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Filter Dialog */}
                <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Filter BOM Items</DialogTitle>
                      <DialogDescription>
                        Apply filters to narrow down the BOM items displayed.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="filter-status">Status</Label>
                          <Select 
                            value={filters.status} 
                            onValueChange={(value) => setFilters({ ...filters, status: value })}
                          >
                            <SelectTrigger id="filter-status">
                              <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ALL">All Statuses</SelectItem>
                              <SelectItem value="ACTIVE">Active</SelectItem>
                              <SelectItem value="PENDING">Pending</SelectItem>
                              <SelectItem value="OBSOLETE">Obsolete</SelectItem>
                              <SelectItem value="DISCONTINUED">Discontinued</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="filter-spare">Spare Parts</Label>
                          <Select 
                            value={filters.isSpare} 
                            onValueChange={(value) => setFilters({ ...filters, isSpare: value })}
                          >
                            <SelectTrigger id="filter-spare">
                              <SelectValue placeholder="All items" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ALL">All Items</SelectItem>
                              <SelectItem value="YES">Spare Parts Only</SelectItem>
                              <SelectItem value="NO">Non-Spare Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-2">
                          <Label htmlFor="filter-category">Category</Label>
                          <Input
                            id="filter-category"
                            value={filters.category}
                            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                            placeholder="e.g., Control Systems"
                          />
                        </div>

                        <div className="col-span-2">
                          <Label htmlFor="filter-manufacturer">Manufacturer</Label>
                          <Input
                            id="filter-manufacturer"
                            value={filters.manufacturer}
                            onChange={(e) => setFilters({ ...filters, manufacturer: e.target.value })}
                            placeholder="e.g., Siemens"
                          />
                        </div>

                        <div className="col-span-2">
                          <Label htmlFor="filter-supplier">Supplier</Label>
                          <Input
                            id="filter-supplier"
                            value={filters.supplier}
                            onChange={(e) => setFilters({ ...filters, supplier: e.target.value })}
                            placeholder="e.g., Automation Supply Co."
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => {
                            setFilters({
                              status: 'ALL',
                              category: '',
                              manufacturer: '',
                              supplier: '',
                              isSpare: 'ALL'
                            })
                          }}
                        >
                          Clear Filters
                        </Button>
                        <Button 
                          className="flex-1"
                          onClick={() => setIsFilterOpen(false)}
                        >
                          Apply Filters
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Location Tabs */}
              <LocationTabs
                locations={locations}
                selectedLocationId={currentLocationId}
                onLocationSelect={setCurrentLocation}
                onLocationAdd={handleLocationAdd}
                onLocationDelete={handleLocationDelete}
                onLocationUpdate={handleLocationUpdate}
                loading={loading}
              />

              {/* Search and Filter */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search BOM items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button 
                  variant={
                    filters.status !== 'ALL' || 
                    filters.category || 
                    filters.manufacturer || 
                    filters.supplier || 
                    filters.isSpare !== 'ALL' 
                      ? 'default' 
                      : 'outline'
                  } 
                  size="sm" 
                  onClick={() => setIsFilterOpen(true)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                  {(filters.status !== 'ALL' || 
                    filters.category || 
                    filters.manufacturer || 
                    filters.supplier || 
                    filters.isSpare !== 'ALL') && (
                    <Badge variant="secondary" className="ml-2">
                      Active
                    </Badge>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={() => fetchBOMItems(currentProject.id, currentLocationId || undefined)}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {/* BOM Table */}
              {currentLocationId ? (
                <EditableBOMTable
                  items={filteredItems}
                  onItemUpdate={(itemId, field, value) => {
                    updateBOMItem(itemId, { [field]: value })
                  }}
                  onItemsDelete={(itemIds) => {
                    itemIds.forEach(id => deleteBOMItem(id))
                  }}
                  onItemsDuplicate={(itemIds) => {
                    duplicateItems(itemIds)
                  }}
                  onAddItemClick={() => setIsAddItemOpen(true)}
                  currentLocationName={locations.find(l => l.id === currentLocationId)?.name}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Please select a location to view BOM items.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}