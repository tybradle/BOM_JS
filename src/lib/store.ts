import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { DatabaseArchiveEntry } from '@/types/database'
import type { AppSettings } from '@/types/settings'
import { DEFAULT_SETTINGS, mergeWithDefaults } from '@/types/settings'
import { applyTheme, cleanupThemeListeners } from '@/lib/theme'

export interface BOMItem {
  id: string
  partNumber: string
  description: string
  secondaryDescription?: string // Maps to P_ARTICLE_DESCR2
  quantity: number
  unit: string
  unitPrice?: number // Maps to P_ARTICLE_SALESPRICE_1
  manufacturer?: string
  supplier?: string
  category?: string
  referenceDesignator?: string // Maps to P_ARTICLE_DEVTAG
  isSpare: boolean // Maps to P_ARTICLE_SPARE
  status: 'ACTIVE' | 'OBSOLETE' | 'PENDING' | 'DISCONTINUED'
  order: number
  createdAt: string
  updatedAt: string
}

export interface BOMProject {
  id: string
  projectNumber: string
  packageName: string
  name?: string
  description?: string
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
  version: string
  authorId: string
  author?: {
    id: string
    name: string
    email: string
  }
  itemCount: number
  createdAt: string
  updatedAt: string
}

export interface DatabaseImportResult {
  message: string
  backup: string | null
  validation: {
    tables: string[]
    integrity: string
  }
}

export interface MasterPartsImportResult {
  success: boolean
  format: string
  summary: {
    totalParsed: number
    imported: number
    updated: number
    errors: number
    duration: string
  }
}

export interface DatabaseExportProgress {
  stage: 'validating' | 'reading' | 'compressing' | 'finalizing' | 'completed' | 'error'
  progress: number // 0-100
  message: string
  details?: string
}

interface Location {
  id: string
  name: string
  exportName?: string | null
  order: number
  projectId: string
  itemCount: number
  createdAt: string
  updatedAt: string
}

interface BOMStore {
  // State
  projects: BOMProject[]
  currentProject: BOMProject | null
  locations: Location[]
  currentLocationId: string | null
  bomItems: BOMItem[]
  loading: boolean
  error: string | null
  
  // Settings State
  settings: AppSettings | null
  settingsLoaded: boolean
  
  // UI State
  searchTerm: string
  selectedItems: string[]
  editingCell: { itemId: string; field: string } | null
  
  // Export Progress State
  exportProgress: DatabaseExportProgress | null
  
  // Setters
  setProjects: (projects: BOMProject[]) => void
  setCurrentProject: (project: BOMProject | null) => void
  setLocations: (locations: Location[]) => void
  setCurrentLocationId: (locationId: string | null) => void
  setCurrentLocation: (locationId: string | null) => void
  setBOMItems: (items: BOMItem[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSearchTerm: (term: string) => void
  setSelectedItems: (items: string[]) => void
  setEditingCell: (cell: { itemId: string; field: string } | null) => void
  setExportProgress: (progress: DatabaseExportProgress | null) => void
  
  // API Actions
  fetchProjects: () => Promise<void>
  fetchProject: (projectId: string) => Promise<void>
  createProject: (data: { projectNumber: string; packageName: string; name?: string; description?: string; authorId?: string }) => Promise<void>
  deleteProject: (projectId: string) => Promise<void>
  fetchLocations: (projectId: string) => Promise<void>
  createLocation: (projectId: string, name: string) => Promise<void>
  updateLocation: (locationId: string, name: string, exportName?: string | null) => Promise<void>
  deleteLocation: (locationId: string) => Promise<void>
  fetchBOMItems: (projectId: string, locationId?: string) => Promise<void>
  addBOMItem: (projectId: string, item: Omit<BOMItem, 'id' | 'createdAt' | 'updatedAt' | 'order'> & { locationId: string }) => Promise<void>
  updateBOMItem: (itemId: string, updates: Partial<BOMItem>) => Promise<void>
  deleteBOMItem: (itemId: string) => Promise<void>
  exportBOM: (projectId: string, format: 'XML' | 'JSON' | 'CSV') => Promise<{ content: string; filename: string }>
  importBOM: (projectId: string, items: any[], format: string) => Promise<void>
  downloadDatabaseArchive: () => Promise<{ blob: Blob; filename: string }>
  downloadDatabaseArchiveWithProgress: (onProgress?: (progress: DatabaseExportProgress) => void) => Promise<{ blob: Blob; filename: string }>
  uploadDatabaseArchive: (file: File) => Promise<DatabaseImportResult>
  
  // Database archive management
  launchPrismaStudio: () => Promise<{ url: string }>
  fetchDatabaseArchives: () => Promise<DatabaseArchiveEntry[]>
  importDatabaseArchivePath: (archivePath: string) => Promise<DatabaseImportResult>
  createDatabaseArchive: (description: string) => Promise<{ success: boolean; filename: string; path: string; size: number; description: string; createdAt: string }>
  deleteDatabaseArchive: (archivePath: string) => Promise<{ success: boolean; message: string; deletedPath: string }>
  restoreDatabaseArchive: (archivePath: string, createBackup?: boolean) => Promise<{ success: boolean; message: string; backupPath?: string; restoredFrom: string }>
  uploadMasterParts: (file: File, clearExisting?: boolean) => Promise<MasterPartsImportResult>
  
  // Settings Actions
  fetchSettings: () => Promise<void>
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>
  resetSettings: () => Promise<void>
  
  // Excel-like Actions
  updateCell: (itemId: string, field: string, value: any) => void
  bulkUpdate: (itemIds: string[], updates: Partial<BOMItem>) => void
  duplicateItems: (itemIds: string[]) => void
  reorderItems: (fromIndex: number, toIndex: number) => void
}

export const useBOMStore = create<BOMStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      projects: [],
      currentProject: null,
      locations: [],
      currentLocationId: null,
      bomItems: [],
      loading: false,
      error: null,
       settings: null,
       settingsLoaded: false,
       searchTerm: '',
       selectedItems: [],
       editingCell: null,
       exportProgress: null,
      
      // Setters
      setProjects: (projects) => set({ projects }),
      setCurrentProject: (project) => set({ currentProject: project }),
      setLocations: (locations) => set({ locations }),
      setCurrentLocationId: (locationId) => set({ currentLocationId: locationId }),
  setCurrentLocation: (locationId) => set({ currentLocationId: locationId }),
       setBOMItems: (items) => set({ bomItems: items }),
       setLoading: (loading) => set({ loading }),
       setError: (error) => set({ error }),
       setSearchTerm: (term) => set({ searchTerm: term }),
       setExportProgress: (progress) => set({ exportProgress: progress }),
      setSelectedItems: (items) => set({ selectedItems: items }),
      setEditingCell: (cell) => set({ editingCell: cell }),
      
      // API Actions
      fetchProjects: async () => {
        set({ loading: true, error: null })
        try {
          const response = await fetch('/api/projects')
          if (!response.ok) throw new Error('Failed to fetch projects')
          const data = await response.json()
          // Map _count.items to itemCount for consistency
          const projects = (data.projects || data).map((p: any) => ({
            ...p,
            itemCount: p._count?.items || 0
          }))
          set({ 
            projects,
            loading: false 
          })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false })
        }
      },

      fetchProject: async (projectId) => {
        set({ loading: true, error: null })
        try {
          const response = await fetch(`/api/projects/${projectId}`)
          if (!response.ok) throw new Error('Failed to fetch project')
          const project = await response.json()
          set({ 
            currentProject: project,
            loading: false 
          })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false })
        }
      },
      
      createProject: async (data) => {
        set({ loading: true, error: null })
        try {
          const response = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          })
          if (!response.ok) throw new Error('Failed to create project')
          const newProject = await response.json()
          // Map _count.items to itemCount for consistency
          const mappedProject = {
            ...newProject,
            itemCount: newProject._count?.items || 0
          }
          set(state => ({ 
            projects: [mappedProject, ...state.projects],
            loading: false 
          }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false })
        }
      },

      deleteProject: async (projectId) => {
        set({ loading: true, error: null })
        try {
          const response = await fetch(`/api/projects/${projectId}`, {
            method: 'DELETE'
          })
          if (!response.ok) throw new Error('Failed to delete project')
          
          set(state => ({
            projects: state.projects.filter(p => p.id !== projectId),
            currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
            loading: false
          }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false })
          throw error
        }
      },

      fetchLocations: async (projectId) => {
        set({ loading: true, error: null })
        try {
          const response = await fetch(`/api/projects/${projectId}/locations`)
          if (!response.ok) throw new Error('Failed to fetch locations')
          const locations = await response.json()
          set({ locations, loading: false })
          
          // Auto-select first location if none selected
          const { currentLocationId } = get()
          if (!currentLocationId && locations.length > 0) {
            set({ currentLocationId: locations[0].id })
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false })
        }
      },

      createLocation: async (projectId, name) => {
        set({ loading: true, error: null })
        try {
          const response = await fetch(`/api/projects/${projectId}/locations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
          })
          if (!response.ok) throw new Error('Failed to create location')
          const newLocation = await response.json()
          set(state => ({ 
            locations: [...state.locations, newLocation],
            currentLocationId: newLocation.id,
            loading: false 
          }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false })
          throw error
        }
      },

      updateLocation: async (locationId, name, exportName) => {
        set({ loading: true, error: null })
        try {
          const { currentProject } = get()
          if (!currentProject) throw new Error('No current project')
          
          const response = await fetch(`/api/projects/${currentProject.id}/locations/${locationId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, exportName })
          })
          if (!response.ok) throw new Error('Failed to update location')
          const updatedLocation = await response.json()
          
          set(state => ({
            locations: state.locations.map(loc => 
              loc.id === locationId ? updatedLocation : loc
            ),
            loading: false
          }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false })
          throw error
        }
      },

      deleteLocation: async (locationId) => {
        set({ loading: true, error: null })
        try {
          const { currentProject } = get()
          if (!currentProject) throw new Error('No current project')
          
          const response = await fetch(`/api/projects/${currentProject.id}/locations/${locationId}`, {
            method: 'DELETE'
          })
          if (!response.ok) throw new Error('Failed to delete location')
          
          set(state => {
            const newLocations = state.locations.filter(loc => loc.id !== locationId)
            const newCurrentLocationId = state.currentLocationId === locationId 
              ? (newLocations.length > 0 ? newLocations[0].id : null)
              : state.currentLocationId
            
            return {
              locations: newLocations,
              currentLocationId: newCurrentLocationId,
              loading: false
            }
          })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false })
          throw error
        }
      },
      
      fetchBOMItems: async (projectId, locationId) => {
        set({ loading: true, error: null })
        try {
          const url = locationId 
            ? `/api/projects/${projectId}/items?locationId=${locationId}`
            : `/api/projects/${projectId}/items`
          const response = await fetch(url)
          if (!response.ok) throw new Error('Failed to fetch BOM items')
          const items = await response.json()
          set({ bomItems: items, loading: false })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false })
        }
      },
      
      addBOMItem: async (projectId, item) => {
        set({ loading: true, error: null })
        try {
          const response = await fetch(`/api/projects/${projectId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
          })
          if (!response.ok) throw new Error('Failed to add BOM item')
          const newItem = await response.json()
          set(state => ({ 
            bomItems: [...state.bomItems, newItem],
            // Update project item count
            projects: state.projects.map(p => 
              p.id === projectId ? { ...p, itemCount: p.itemCount + 1 } : p
            ),
            currentProject: state.currentProject?.id === projectId 
              ? { ...state.currentProject, itemCount: state.currentProject.itemCount + 1 }
              : state.currentProject,
            loading: false 
          }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false })
        }
      },
      
      updateBOMItem: async (itemId, updates) => {
        try {
          const { currentProject } = get()
          if (!currentProject) throw new Error('No current project')
          
          const response = await fetch(`/api/projects/${currentProject.id}/items/${itemId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
          })
          if (!response.ok) throw new Error('Failed to update BOM item')
          const updatedItem = await response.json()
          set(state => ({
            bomItems: state.bomItems.map(item => 
              item.id === itemId ? updatedItem : item
            )
          }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unknown error' })
        }
      },
      
      deleteBOMItem: async (itemId) => {
        try {
          const { currentProject } = get()
          if (!currentProject) throw new Error('No current project')
          
          const response = await fetch(`/api/projects/${currentProject.id}/items/${itemId}`, {
            method: 'DELETE'
          })
          if (!response.ok) throw new Error('Failed to delete BOM item')
          set(state => ({
            bomItems: state.bomItems.filter(item => item.id !== itemId),
            selectedItems: state.selectedItems.filter(id => id !== itemId),
            // Update project item count
            projects: state.projects.map(p => 
              p.id === currentProject.id ? { ...p, itemCount: Math.max(0, p.itemCount - 1) } : p
            ),
            currentProject: { ...currentProject, itemCount: Math.max(0, currentProject.itemCount - 1) }
          }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unknown error' })
        }
      },
      
      exportBOM: async (projectId, format) => {
        try {
          const response = await fetch(`/api/projects/${projectId}/export`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ format })
          })
          if (!response.ok) throw new Error('Failed to export BOM')
          return await response.json()
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unknown error' })
          throw error
        }
      },
      
      importBOM: async (projectId, items, format) => {
        set({ loading: true, error: null })
        try {
          const response = await fetch('/api/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId, items, format })
          })
          if (!response.ok) throw new Error('Failed to import BOM')
          const result = await response.json()
          await get().fetchBOMItems(projectId)
          // Refresh projects to get updated item counts
          await get().fetchProjects()
          set({ loading: false })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false })
        }
      },
      
      downloadDatabaseArchive: async () => {
        try {
          const response = await fetch('/api/database/export', {
            method: 'GET'
          })

          if (!response.ok) {
            let message = 'Failed to export database'
            try {
              const data = await response.json()
              message = data?.error ?? message
            } catch {
              // Ignore JSON parsing errors
            }
            throw new Error(message)
          }

          const contentDisposition = response.headers.get('content-disposition') || ''
          const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
          const filename = filenameMatch?.[1] ?? 'bom-database-backup.zip'
          const blob = await response.blob()

          return { blob, filename }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to export database'
          set({ error: message })
          throw error
        }
      },

      downloadDatabaseArchiveWithProgress: async (onProgress?: (progress: DatabaseExportProgress) => void) => {
        try {
          const response = await fetch('/api/database/export/progress', {
            method: 'GET'
          })

          if (!response.ok) {
            let message = 'Failed to export database'
            try {
              const data = await response.json()
              message = data?.error ?? message
            } catch {
              // Ignore JSON parsing errors
            }
            throw new Error(message)
          }

          const reader = response.body?.getReader()
          const decoder = new TextDecoder()

          if (!reader) {
            throw new Error('No response body reader available')
          }

          let blob: Blob | null = null
          let filename: string = 'bom-database-backup.zip'

          try {
            while (true) {
              const { done, value } = await reader.read()
              
              if (done) break

              const chunk = decoder.decode(value, { stream: true })
              const lines = chunk.split('\n')

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6))
                    
                    if (data.type === 'download') {
                      // Convert base64 back to blob
                      const binaryString = atob(data.data)
                      const bytes = new Uint8Array(binaryString.length)
                      for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i)
                      }
                      blob = new Blob([bytes], { type: 'application/zip' })
                      filename = data.filename
                    } else if (onProgress) {
                      onProgress(data as DatabaseExportProgress)
                    }
                  } catch (parseError) {
                    console.warn('Failed to parse SSE data:', parseError)
                  }
                }
              }
            }
          } finally {
            reader.releaseLock()
          }

          if (!blob) {
            throw new Error('No download data received')
          }

          return { blob, filename }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to export database'
          set({ error: message })
          throw error
        }
      },

      uploadDatabaseArchive: async (file) => {
        try {
          const formData = new FormData()
          formData.append('file', file)

          const response = await fetch('/api/database/import', {
            method: 'POST',
            body: formData
          })

          const data = await response.json()

          if (!response.ok) {
            const message = data?.error ?? 'Failed to import database'
            throw new Error(message)
          }

          return data as DatabaseImportResult
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to import database'
          set({ error: message })
          throw error
        }
      },

      launchPrismaStudio: async () => {
        try {
          const response = await fetch('/api/database/studio', {
            method: 'POST'
          })

          const data = await response.json()

          if (!response.ok) {
            const message = data?.error ?? 'Failed to launch Prisma Studio'
            throw new Error(message)
          }

          return data as { url: string }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to launch Prisma Studio'
          set({ error: message })
          throw error
        }
      },

      fetchDatabaseArchives: async () => {
        try {
          const response = await fetch('/api/database/archives', {
            method: 'GET'
          })

          const data = await response.json()

          if (!response.ok) {
            const message = data?.error ?? 'Failed to fetch database archives'
            throw new Error(message)
          }

          return (data.archives ?? []) as DatabaseArchiveEntry[]
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch database archives'
          set({ error: message })
          throw error
        }
      },

      importDatabaseArchivePath: async (archivePath) => {
        try {
          const formData = new FormData()
          formData.append('archivePath', archivePath)

          const response = await fetch('/api/database/import', {
            method: 'POST',
            body: formData
          })

          const data = await response.json()

          if (!response.ok) {
            const message = data?.error ?? 'Failed to import database archive'
            throw new Error(message)
          }

          return data as DatabaseImportResult
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to import database archive'
          set({ error: message })
          throw error
        }
      },

      createDatabaseArchive: async (description) => {
        try {
          const response = await fetch('/api/database/create-archive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description })
          })

          const data = await response.json()

          if (!response.ok) {
            const message = data?.error ?? 'Failed to create database archive'
            throw new Error(message)
          }

          return data as { success: boolean; filename: string; path: string; size: number; description: string; createdAt: string }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create database archive'
          set({ error: message })
          throw error
        }
      },

      deleteDatabaseArchive: async (archivePath) => {
        try {
          const response = await fetch(`/api/database/delete-archive?path=${encodeURIComponent(archivePath)}`, {
            method: 'DELETE'
          })

          const data = await response.json()

          if (!response.ok) {
            const message = data?.error ?? 'Failed to delete database archive'
            throw new Error(message)
          }

          return data as { success: boolean; message: string; deletedPath: string }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to delete database archive'
          set({ error: message })
          throw error
        }
      },

      restoreDatabaseArchive: async (archivePath, createBackup = true) => {
        try {
          const response = await fetch('/api/database/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ archivePath, createBackup })
          })

          const data = await response.json()

          if (!response.ok) {
            const message = data?.error ?? 'Failed to restore database archive'
            throw new Error(message)
          }

          return data as { success: boolean; message: string; backupPath?: string; restoredFrom: string }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to restore database archive'
          set({ error: message })
          throw error
        }
      },

      uploadMasterParts: async (file, clearExisting = false) => {
        try {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('clearExisting', String(clearExisting))

          const response = await fetch('/api/parts/import', {
            method: 'POST',
            body: formData
          })

          if (!response.ok) {
            const errorData = await response.json()
            const message = errorData.error || errorData.message || 'Failed to import master parts'
            throw new Error(message)
          }

          const data = await response.json()
          
          if (!data.success) {
            throw new Error(data.error || 'Import failed')
          }

          return data as MasterPartsImportResult
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to upload master parts'
          set({ error: message })
          throw error
        }
      },

      // Settings Actions
      fetchSettings: async () => {
        try {
          // First, try to load from localStorage
          const localSettings = localStorage.getItem('app-settings')
          if (localSettings) {
            try {
              const parsed = JSON.parse(localSettings)
              const merged = mergeWithDefaults(parsed)
              set({ settings: merged, settingsLoaded: true })
            } catch (e) {
              console.error('Failed to parse localStorage settings:', e)
            }
          }

          // Then fetch from server (will update if different)
          const response = await fetch('/api/settings')
          if (!response.ok) {
            throw new Error('Failed to fetch settings from server')
          }

          const serverSettings = await response.json()
          
          // Update both state and localStorage
          localStorage.setItem('app-settings', JSON.stringify(serverSettings))
          set({ settings: serverSettings, settingsLoaded: true })
          
          // Apply theme immediately
          if (serverSettings?.appearance) {
            applyTheme(serverSettings.appearance.theme)
          }
        } catch (error) {
          console.error('Error fetching settings:', error)
          // Use defaults if both localStorage and server fail
          const defaults = DEFAULT_SETTINGS
          set({ settings: defaults, settingsLoaded: true })
        }
      },

      updateSettings: async (updates: Partial<AppSettings>) => {
        try {
          const { settings } = get()
          const currentSettings = settings || DEFAULT_SETTINGS

          // Optimistically update UI
          const updatedSettings = mergeWithDefaults({
            ...currentSettings,
            ...updates
          })
          
          set({ settings: updatedSettings })
          localStorage.setItem('app-settings', JSON.stringify(updatedSettings))
          
          // Apply theme immediately if appearance settings changed
          if (updates.appearance?.theme) {
            applyTheme(updatedSettings.appearance.theme)
          }

          // Debounced server sync (500ms)
          const syncToServer = async () => {
            const response = await fetch('/api/settings', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates)
            })

            if (!response.ok) {
              throw new Error('Failed to save settings to server')
            }

            const savedSettings = await response.json()
            set({ settings: savedSettings })
            localStorage.setItem('app-settings', JSON.stringify(savedSettings))
          }

          // Use setTimeout for debouncing
          if ((window as any)._settingsSyncTimeout) {
            clearTimeout((window as any)._settingsSyncTimeout)
          }
          (window as any)._settingsSyncTimeout = setTimeout(syncToServer, 500)
        } catch (error) {
          console.error('Error updating settings:', error)
          set({ error: error instanceof Error ? error.message : 'Failed to update settings' })
        }
      },

      resetSettings: async () => {
        try {
          // Reset to defaults
          const defaults = DEFAULT_SETTINGS
          set({ settings: defaults })
          localStorage.setItem('app-settings', JSON.stringify(defaults))
          
          // Apply default theme
          applyTheme(defaults.appearance.theme)

          // Save to server
          const response = await fetch('/api/settings', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(defaults)
          })

          if (!response.ok) {
            throw new Error('Failed to reset settings on server')
          }

          const savedSettings = await response.json()
          set({ settings: savedSettings })
        } catch (error) {
          console.error('Error resetting settings:', error)
          set({ error: error instanceof Error ? error.message : 'Failed to reset settings' })
        }
      },

      // Excel-like Actions
      updateCell: (itemId, field, value) => {
        set(state => ({
          bomItems: state.bomItems.map(item =>
            item.id === itemId ? { ...item, [field]: value } : item
          )
        }))
        
        // Also update via API
        get().updateBOMItem(itemId, { [field]: value })
      },
      
      bulkUpdate: (itemIds, updates) => {
        set(state => ({
          bomItems: state.bomItems.map(item =>
            itemIds.includes(item.id) ? { ...item, ...updates } : item
          )
        }))
        
        // Update each item via API
        itemIds.forEach(itemId => {
          get().updateBOMItem(itemId, updates)
        })
      },
      
      duplicateItems: (itemIds) => {
        const { bomItems } = get()
        const itemsToDuplicate = bomItems.filter(item => itemIds.includes(item.id))
        const duplicatedItems = itemsToDuplicate.map(item => ({
          ...item,
          id: `temp-${Date.now()}-${Math.random()}`,
          partNumber: `${item.partNumber}-COPY`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }))
        
        set(state => ({
          bomItems: [...state.bomItems, ...duplicatedItems]
        }))
      },
      
      reorderItems: (fromIndex, toIndex) => {
        set(state => {
          const newItems = [...state.bomItems]
          const [movedItem] = newItems.splice(fromIndex, 1)
          newItems.splice(toIndex, 0, movedItem)
          
          // Update order values
          return {
            bomItems: newItems.map((item, index) => ({
              ...item,
              order: index
            }))
          }
        })
      }
    }),
    {
      name: 'bom-store'
    }
  )
)