'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useBOMStore } from '@/lib/store'
import { Settings, Sun, Moon, Monitor, Type, Layout, Bell, Download, Upload, FileSpreadsheet, FileText, FileImage, ArrowUpDown, ArrowUp, ArrowDown, Save, Trash2, Hash } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'


interface SettingsDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function SettingsDialog({ open: controlledOpen, onOpenChange }: SettingsDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('appearance')
  
  const { settings, settingsLoaded, updateSettings } = useBOMStore()
  
  // Use controlled or internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen

  // Initialize settings on mount
  useEffect(() => {
    if (!settingsLoaded) {
      // Settings will be loaded by the store
      return
    }
  }, [settingsLoaded])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Application Settings</DialogTitle>
          <DialogDescription>
            Customize your BOM Management experience with these preferences.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col flex-1">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Sun className="w-4 h-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="import-export" className="flex items-center gap-2">
              <Layout className="w-4 h-4" />
              Import/Export
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Table
            </TabsTrigger>
            <TabsTrigger value="user" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              User Profile
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Advanced
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-6" style={{ maxHeight: 'calc(85vh - 180px)' }}>
            <TabsContent value="appearance" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Sun className="w-5 h-5" />
                  Theme & Display
                </h3>
                <p className="text-sm text-muted-foreground">
                  Customize the visual appearance of the application.
                </p>
              </div>
              
              {/* Theme Selection */}
              <div className="space-y-3">
                <h4 className="font-medium">Theme</h4>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={settings?.appearance.theme === 'light' ? 'default' : 'outline'}
                    onClick={() => {
                      const currentAppearance = settings?.appearance || { theme: 'system', tableRowHeight: 'comfortable', fontSize: 'medium', toastPosition: 'top-right' }
                      updateSettings({ appearance: { ...currentAppearance, theme: 'light' } })
                    }}
                    className="flex items-center gap-2 justify-start"
                  >
                    <Sun className="w-4 h-4" />
                    Light
                  </Button>
                  <Button
                    variant={settings?.appearance.theme === 'dark' ? 'default' : 'outline'}
                    onClick={() => {
                      const currentAppearance = settings?.appearance || { theme: 'system', tableRowHeight: 'comfortable', fontSize: 'medium', toastPosition: 'top-right' }
                      updateSettings({ appearance: { ...currentAppearance, theme: 'dark' } })
                    }}
                    className="flex items-center gap-2 justify-start"
                  >
                    <Moon className="w-4 h-4" />
                    Dark
                  </Button>
                  <Button
                    variant={settings?.appearance.theme === 'system' ? 'default' : 'outline'}
                    onClick={() => {
                      const currentAppearance = settings?.appearance || { theme: 'system', tableRowHeight: 'comfortable', fontSize: 'medium', toastPosition: 'top-right' }
                      updateSettings({ appearance: { ...currentAppearance, theme: 'system' } })
                    }}
                    className="flex items-center gap-2 justify-start"
                  >
                    <Monitor className="w-4 h-4" />
                    System
                  </Button>
                </div>
              </div>

              {/* Font Size */}
              <div className="space-y-3">
                <h4 className="font-medium">Font Size</h4>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={settings?.appearance.fontSize === 'small' ? 'default' : 'outline'}
                    onClick={() => {
                      const currentAppearance = settings?.appearance || { theme: 'system', tableRowHeight: 'comfortable', fontSize: 'medium', toastPosition: 'top-right' }
                      updateSettings({ appearance: { ...currentAppearance, fontSize: 'small' } })
                    }}
                    className="flex items-center gap-2 justify-start"
                  >
                    <Type className="w-4 h-4" />
                    Small
                  </Button>
                  <Button
                    variant={settings?.appearance.fontSize === 'medium' ? 'default' : 'outline'}
                    onClick={() => {
                      const currentAppearance = settings?.appearance || { theme: 'system', tableRowHeight: 'comfortable', fontSize: 'medium', toastPosition: 'top-right' }
                      updateSettings({ appearance: { ...currentAppearance, fontSize: 'medium' } })
                    }}
                    className="flex items-center gap-2 justify-start"
                  >
                    <Type className="w-4 h-4" />
                    Medium
                  </Button>
                  <Button
                    variant={settings?.appearance.fontSize === 'large' ? 'default' : 'outline'}
                    onClick={() => {
                      const currentAppearance = settings?.appearance || { theme: 'system', tableRowHeight: 'comfortable', fontSize: 'medium', toastPosition: 'top-right' }
                      updateSettings({ appearance: { ...currentAppearance, fontSize: 'large' } })
                    }}
                    className="flex items-center gap-2 justify-start"
                  >
                    <Type className="w-4 h-4" />
                    Large
                  </Button>
                </div>
              </div>

              {/* Table Row Height */}
              <div className="space-y-3">
                <h4 className="font-medium">Table Row Height</h4>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={settings?.appearance.tableRowHeight === 'compact' ? 'default' : 'outline'}
                    onClick={() => {
                      const currentAppearance = settings?.appearance || { theme: 'system', tableRowHeight: 'comfortable', fontSize: 'medium', toastPosition: 'top-right' }
                      updateSettings({ appearance: { ...currentAppearance, tableRowHeight: 'compact' } })
                    }}
                    className="flex items-center gap-2 justify-start"
                  >
                    <Layout className="w-4 h-4" />
                    Compact
                  </Button>
                  <Button
                    variant={settings?.appearance.tableRowHeight === 'comfortable' ? 'default' : 'outline'}
                    onClick={() => {
                      const currentAppearance = settings?.appearance || { theme: 'system', tableRowHeight: 'comfortable', fontSize: 'medium', toastPosition: 'top-right' }
                      updateSettings({ appearance: { ...currentAppearance, tableRowHeight: 'comfortable' } })
                    }}
                    className="flex items-center gap-2 justify-start"
                  >
                    <Layout className="w-4 h-4" />
                    Comfortable
                  </Button>
                  <Button
                    variant={settings?.appearance.tableRowHeight === 'spacious' ? 'default' : 'outline'}
                    onClick={() => {
                      const currentAppearance = settings?.appearance || { theme: 'system', tableRowHeight: 'comfortable', fontSize: 'medium', toastPosition: 'top-right' }
                      updateSettings({ appearance: { ...currentAppearance, tableRowHeight: 'spacious' } })
                    }}
                    className="flex items-center gap-2 justify-start"
                  >
                    <Layout className="w-4 h-4" />
                    Spacious
                  </Button>
                </div>
              </div>

              {/* Toast Position */}
              <div className="space-y-3">
                <h4 className="font-medium">Toast Position</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={settings?.appearance.toastPosition === 'top-right' ? 'default' : 'outline'}
                    onClick={() => {
                      const currentAppearance = settings?.appearance || { theme: 'system', tableRowHeight: 'comfortable', fontSize: 'medium', toastPosition: 'top-right' }
                      updateSettings({ appearance: { ...currentAppearance, toastPosition: 'top-right' } })
                    }}
                    className="flex items-center gap-2 justify-start"
                  >
                    <Bell className="w-4 h-4" />
                    Top Right
                  </Button>
                  <Button
                    variant={settings?.appearance.toastPosition === 'bottom-right' ? 'default' : 'outline'}
                    onClick={() => {
                      const currentAppearance = settings?.appearance || { theme: 'system', tableRowHeight: 'comfortable', fontSize: 'medium', toastPosition: 'top-right' }
                      updateSettings({ appearance: { ...currentAppearance, toastPosition: 'bottom-right' } })
                    }}
                    className="flex items-center gap-2 justify-start"
                  >
                    <Bell className="w-4 h-4" />
                    Bottom Right
                  </Button>
                  <Button
                    variant={settings?.appearance.toastPosition === 'top-center' ? 'default' : 'outline'}
                    onClick={() => {
                      const currentAppearance = settings?.appearance || { theme: 'system', tableRowHeight: 'comfortable', fontSize: 'medium', toastPosition: 'top-right' }
                      updateSettings({ appearance: { ...currentAppearance, toastPosition: 'top-center' } })
                    }}
                    className="flex items-center gap-2 justify-start"
                  >
                    <Bell className="w-4 h-4" />
                    Top Center
                  </Button>
                  <Button
                    variant={settings?.appearance.toastPosition === 'bottom-left' ? 'default' : 'outline'}
                    onClick={() => {
                      const currentAppearance = settings?.appearance || { theme: 'system', tableRowHeight: 'comfortable', fontSize: 'medium', toastPosition: 'top-right' }
                      updateSettings({ appearance: { ...currentAppearance, toastPosition: 'bottom-left' } })
                    }}
                    className="flex items-center gap-2 justify-start"
                  >
                    <Bell className="w-4 h-4" />
                    Bottom Left
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="import-export" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Import & Export Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Configure default behaviors for data import and export operations.
                </p>
              </div>
              
              {/* Import Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Import Settings
                  </CardTitle>
                  <CardDescription>
                    Set default behavior when importing data from external sources.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Missing Parts Checkbox */}
                  <div className="flex items-start space-x-3 space-y-0">
                    <Checkbox
                      id="addMissingParts"
                      checked={settings?.importExport?.import?.addMissingPartsToDatabase || false}
                      onCheckedChange={(checked) => {
                        const currentImportExport = settings?.importExport || {
                          import: { addMissingPartsToDatabase: true, defaultUnit: 'EA', defaultCurrency: 'USD' },
                          export: { defaultFormat: 'EPLAN', includeEmptyFields: false, autoDownload: true }
                        }
                        updateSettings({
                          importExport: {
                            ...currentImportExport,
                            import: {
                              ...currentImportExport.import,
                              addMissingPartsToDatabase: checked as boolean
                            }
                          }
                        })
                      }}
                    />
                    <div className="space-y-1 leading-none">
                      <Label htmlFor="addMissingParts" className="font-medium">
                        Add missing parts to database
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically add new parts to the database during import if they don't already exist.
                      </p>
                    </div>
                  </div>
                  
                  {/* Default Unit Input */}
                  <div className="space-y-2">
                    <Label htmlFor="defaultUnit" className="font-medium">
                      Default Unit
                    </Label>
                    <Input
                      id="defaultUnit"
                      placeholder="e.g., EA, PCS, KGS"
                      value={settings?.importExport?.import?.defaultUnit || ''}
                      onChange={(e) => {
                        const currentImportExport = settings?.importExport || {
                          import: { addMissingPartsToDatabase: true, defaultUnit: 'EA', defaultCurrency: 'USD' },
                          export: { defaultFormat: 'EPLAN', includeEmptyFields: false, autoDownload: true }
                        }
                        updateSettings({
                          importExport: {
                            ...currentImportExport,
                            import: {
                              ...currentImportExport.import,
                              defaultUnit: e.target.value
                            }
                          }
                        })
                      }}
                    />
                    <p className="text-sm text-muted-foreground">
                      Default unit of measure for imported items (e.g., EA, PCS, KGS, LBS).
                    </p>
                  </div>
                  
                  {/* Default Currency Input */}
                  <div className="space-y-2">
                    <Label htmlFor="defaultCurrency" className="font-medium">
                      Default Currency
                    </Label>
                    <Input
                      id="defaultCurrency"
                      placeholder="e.g., USD, EUR, CAD"
                      value={settings?.importExport?.import?.defaultCurrency || ''}
                      onChange={(e) => {
                        const currentImportExport = settings?.importExport || {
                          import: { addMissingPartsToDatabase: true, defaultUnit: 'EA', defaultCurrency: 'USD' },
                          export: { defaultFormat: 'EPLAN', includeEmptyFields: false, autoDownload: true }
                        }
                        updateSettings({
                          importExport: {
                            ...currentImportExport,
                            import: {
                              ...currentImportExport.import,
                              defaultCurrency: e.target.value
                            }
                          }
                        })
                      }}
                    />
                    <p className="text-sm text-muted-foreground">
                      Default currency code for imported prices (e.g., USD, EUR, CAD).
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Export Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Export Settings
                  </CardTitle>
                  <CardDescription>
                    Configure default export format and options.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Default Format Radio Group */}
                  <div className="space-y-3">
                    <Label className="font-medium">Default Format</Label>
                    <RadioGroup
                      value={settings?.importExport?.export?.defaultFormat || 'EPLAN'}
                      onValueChange={(value: 'EPLAN' | 'CSV' | 'EXCEL') => {
                        const currentImportExport = settings?.importExport || {
                          import: { addMissingPartsToDatabase: true, defaultUnit: 'EA', defaultCurrency: 'USD' },
                          export: { defaultFormat: 'EPLAN', includeEmptyFields: false, autoDownload: true }
                        }
                        updateSettings({
                          importExport: {
                            ...currentImportExport,
                            export: {
                              ...currentImportExport.export,
                              defaultFormat: value
                            }
                          }
                        })
                      }}
                    >
                      <div className="flex items-center space-x-3 space-y-0">
                        <RadioGroupItem value="EPLAN" id="format-eplan" />
                        <Label htmlFor="format-eplan" className="flex items-center gap-2 cursor-pointer">
                          <FileImage className="w-4 h-4" />
                          EPLAN
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 space-y-0">
                        <RadioGroupItem value="CSV" id="format-csv" />
                        <Label htmlFor="format-csv" className="flex items-center gap-2 cursor-pointer">
                          <FileText className="w-4 h-4" />
                          CSV
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 space-y-0">
                        <RadioGroupItem value="EXCEL" id="format-excel" />
                        <Label htmlFor="format-excel" className="flex items-center gap-2 cursor-pointer">
                          <FileSpreadsheet className="w-4 h-4" />
                          Excel
                        </Label>
                      </div>
                    </RadioGroup>
                    <p className="text-sm text-muted-foreground">
                      The default format for all export operations.
                    </p>
                  </div>
                  
                  {/* Include Empty Fields Checkbox */}
                  <div className="flex items-start space-x-3 space-y-0">
                    <Checkbox
                      id="includeEmptyFields"
                      checked={settings?.importExport?.export?.includeEmptyFields || false}
                      onCheckedChange={(checked) => {
                        const currentImportExport = settings?.importExport || {
                          import: { addMissingPartsToDatabase: true, defaultUnit: 'EA', defaultCurrency: 'USD' },
                          export: { defaultFormat: 'EPLAN', includeEmptyFields: false, autoDownload: true }
                        }
                        updateSettings({
                          importExport: {
                            ...currentImportExport,
                            export: {
                              ...currentImportExport.export,
                              includeEmptyFields: checked as boolean
                            }
                          }
                        })
                      }}
                    />
                    <div className="space-y-1 leading-none">
                      <Label htmlFor="includeEmptyFields" className="font-medium">
                        Include empty fields
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Include columns with empty or null values in the export.
                      </p>
                    </div>
                  </div>
                  
                  {/* Auto-Download Checkbox */}
                  <div className="flex items-start space-x-3 space-y-0">
                    <Checkbox
                      id="autoDownload"
                      checked={settings?.importExport?.export?.autoDownload || true}
                      onCheckedChange={(checked) => {
                        const currentImportExport = settings?.importExport || {
                          import: { addMissingPartsToDatabase: true, defaultUnit: 'EA', defaultCurrency: 'USD' },
                          export: { defaultFormat: 'EPLAN', includeEmptyFields: false, autoDownload: true }
                        }
                        updateSettings({
                          importExport: {
                            ...currentImportExport,
                            export: {
                              ...currentImportExport.export,
                              autoDownload: checked as boolean
                            }
                          }
                        })
                      }}
                    />
                    <div className="space-y-1 leading-none">
                      <Label htmlFor="autoDownload" className="font-medium">
                        Auto-download exported files
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically download exported files instead of showing preview.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="table" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Type className="w-5 h-5" />
                  Table Behavior
                </h3>
                <p className="text-sm text-muted-foreground">
                  Customize how tables behave and display data.
                </p>
              </div>
              
              {/* Default Sorting */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowUpDown className="w-5 h-5" />
                    Default Sorting
                  </CardTitle>
                  <CardDescription>
                    Set the default sort column and direction when opening a table.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Sort Column */}
                    <div className="space-y-2">
                      <Label htmlFor="sortColumn" className="font-medium">
                        Sort Column
                      </Label>
                      <Select
                        value={settings?.table?.defaultSortColumn || 'partNumber'}
                        onValueChange={(value) => {
                          const currentTable = settings?.table || {
                            defaultSortColumn: 'partNumber',
                            defaultSortDirection: 'asc',
                            autoSaveDelay: 500,
                            confirmBeforeDelete: true,
                            showRowNumbers: false
                          }
                          updateSettings({
                            table: {
                              ...currentTable,
                              defaultSortColumn: value
                            }
                          })
                        }}
                      >
                        <SelectTrigger id="sortColumn">
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="partNumber">Part Number</SelectItem>
                          <SelectItem value="description">Description</SelectItem>
                          <SelectItem value="manufacturer">Manufacturer</SelectItem>
                          <SelectItem value="category">Category</SelectItem>
                          <SelectItem value="quantity">Quantity</SelectItem>
                          <SelectItem value="unitPrice">Unit Price</SelectItem>
                          <SelectItem value="status">Status</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Sort Direction */}
                    <div className="space-y-2">
                      <Label className="font-medium">
                        Sort Direction
                      </Label>
                      <div className="flex gap-2">
                        <Button
                          variant={settings?.table?.defaultSortDirection === 'asc' ? 'default' : 'outline'}
                          onClick={() => {
                            const currentTable = settings?.table || {
                              defaultSortColumn: 'partNumber',
                              defaultSortDirection: 'asc',
                              autoSaveDelay: 500,
                              confirmBeforeDelete: true,
                              showRowNumbers: false
                            }
                            updateSettings({
                              table: {
                                ...currentTable,
                                defaultSortDirection: 'asc'
                              }
                            })
                          }}
                          className="flex-1 flex items-center gap-2 justify-center"
                        >
                          <ArrowUp className="w-4 h-4" />
                          Ascending
                        </Button>
                        <Button
                          variant={settings?.table?.defaultSortDirection === 'desc' ? 'default' : 'outline'}
                          onClick={() => {
                            const currentTable = settings?.table || {
                              defaultSortColumn: 'partNumber',
                              defaultSortDirection: 'asc',
                              autoSaveDelay: 500,
                              confirmBeforeDelete: true,
                              showRowNumbers: false
                            }
                            updateSettings({
                              table: {
                                ...currentTable,
                                defaultSortDirection: 'desc'
                              }
                            })
                          }}
                          className="flex-1 flex items-center gap-2 justify-center"
                        >
                          <ArrowDown className="w-4 h-4" />
                          Descending
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Editing Behavior */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Save className="w-5 h-5" />
                    Editing Behavior
                  </CardTitle>
                  <CardDescription>
                    Control how cell edits are saved and how long to wait before auto-saving.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Auto-Save Delay */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="autoSaveDelay" className="font-medium">
                        Auto-Save Delay
                      </Label>
                      <span className="text-sm text-muted-foreground">
                        {settings?.table?.autoSaveDelay || 500}ms
                      </span>
                    </div>
                    <Slider
                      id="autoSaveDelay"
                      min={0}
                      max={2000}
                      step={100}
                      value={[settings?.table?.autoSaveDelay || 500]}
                      onValueChange={(value) => {
                        const currentTable = settings?.table || {
                          defaultSortColumn: 'partNumber',
                          defaultSortDirection: 'asc',
                          autoSaveDelay: 500,
                          confirmBeforeDelete: true,
                          showRowNumbers: false
                        }
                        updateSettings({
                          table: {
                            ...currentTable,
                            autoSaveDelay: value[0]
                          }
                        })
                      }}
                      className="w-full"
                    />
                    <p className="text-sm text-muted-foreground">
                      Delay in milliseconds before automatically saving cell changes. Set to 0 for immediate save.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Delete Behavior */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trash2 className="w-5 h-5" />
                    Delete Behavior
                  </CardTitle>
                  <CardDescription>
                    Control confirmation prompts before deleting items.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start space-x-3 space-y-0">
                    <Checkbox
                      id="confirmDelete"
                      checked={settings?.table?.confirmBeforeDelete !== false}
                      onCheckedChange={(checked) => {
                        const currentTable = settings?.table || {
                          defaultSortColumn: 'partNumber',
                          defaultSortDirection: 'asc',
                          autoSaveDelay: 500,
                          confirmBeforeDelete: true,
                          showRowNumbers: false
                        }
                        updateSettings({
                          table: {
                            ...currentTable,
                            confirmBeforeDelete: checked as boolean
                          }
                        })
                      }}
                    />
                    <div className="space-y-1 leading-none">
                      <Label htmlFor="confirmDelete" className="font-medium">
                        Confirm before deleting items
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Show a confirmation dialog before permanently deleting BOM items.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Display Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="w-5 h-5" />
                    Display Options
                  </CardTitle>
                  <CardDescription>
                    Customize what information is displayed in tables.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start space-x-3 space-y-0">
                    <Checkbox
                      id="showRowNumbers"
                      checked={settings?.table?.showRowNumbers || false}
                      onCheckedChange={(checked) => {
                        const currentTable = settings?.table || {
                          defaultSortColumn: 'partNumber',
                          defaultSortDirection: 'asc',
                          autoSaveDelay: 500,
                          confirmBeforeDelete: true,
                          showRowNumbers: false
                        }
                        updateSettings({
                          table: {
                            ...currentTable,
                            showRowNumbers: checked as boolean
                          }
                        })
                      }}
                    />
                    <div className="space-y-1 leading-none">
                      <Label htmlFor="showRowNumbers" className="font-medium">
                        Show row numbers
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Display sequential row numbers in the first column of all tables.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="user" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">User Profile</h3>
                <p className="text-sm text-muted-foreground">
                  Manage your profile information and preferences.
                </p>
              </div>
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>User profile settings coming soon...</p>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Advanced Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Advanced configuration options for power users.
                </p>
              </div>
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Advanced settings coming soon...</p>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}