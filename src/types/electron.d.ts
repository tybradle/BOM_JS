/**
 * TypeScript type definitions for Electron IPC API
 * Exposed via contextBridge in preload.js
 */

interface ElectronAPI {
  // App info
  getVersion: () => Promise<string>
  
  // File dialogs
  showSaveDialog: (options: {
    defaultPath?: string
    filters?: Array<{ name: string; extensions: string[] }>
  }) => Promise<{ filePath?: string; canceled: boolean }>
  
  showOpenDialog: (options: {
    properties?: string[]
    filters?: Array<{ name: string; extensions: string[] }>
  }) => Promise<{ filePaths: string[]; canceled: boolean }>
  
  getAppPath: (name: string) => Promise<string>
  
  // File operations
  writeFile: (filePath: string, data: ArrayBuffer | Uint8Array | Buffer | string) => Promise<{ success: boolean; error?: string }>
  
  // Menu events
  onMenuAction: (callback: (action: string) => void) => void
  removeAllListeners: (channel: string) => void
}

interface Window {
  electronAPI?: ElectronAPI
}
