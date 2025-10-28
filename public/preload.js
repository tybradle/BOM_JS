const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // File dialogs
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  getAppPath: (name) => ipcRenderer.invoke('get-app-path', name),
  
  // Menu events
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-new-project', callback)
    ipcRenderer.on('menu-open-project', callback)
    ipcRenderer.on('menu-import-csv', callback)
    ipcRenderer.on('menu-export-xml', callback)
  },
  
  // Remove all listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
})