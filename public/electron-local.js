const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')

// Keep a global reference of window object
let mainWindow
let splashScreen
let serverProcess

function createSplashScreen() {
  splashScreen = new BrowserWindow({
    width: 400,
    height: 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    center: true,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  splashScreen.loadFile(path.join(__dirname, 'splash.html'))
  splashScreen.once('ready-to-show', () => {
    splashScreen.show()
  })

  return splashScreen
}

function getLocalAppUrl() {
  // For electron-local.js, always use production mode
  const isDev = false
  
  console.log('electron-local.js: forcing production mode')
  console.log('NODE_ENV:', process.env.NODE_ENV)
  
  if (isDev) {
    console.log('Using development server: http://localhost:3002')
    return 'http://localhost:3002'
  }

  // Always use standalone server in production
  const standaloneServerPath = path.join(__dirname, '../.next/standalone/server.js')
  
  if (fs.existsSync(standaloneServerPath)) {
    console.log('Starting standalone server for production...')
    // Start server and return URL
    return startStandaloneServer()
  }

  throw new Error('Standalone server not found. Please run "npm run build" first.')
}

function startStandaloneServer() {
  return new Promise((resolve, reject) => {
    console.log('Starting standalone Next.js server...')
    serverProcess = spawn('node', [path.join(__dirname, '../.next/standalone/server.js')], {
      cwd: path.join(__dirname, '../.next/standalone'),
      stdio: 'pipe',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: '3002'
      }
    })

    serverProcess.stdout.on('data', (data) => {
      console.log(`Server stdout: ${data}`)
      if (data.toString().includes('Ready on http')) {
        resolve('http://localhost:3002')
      }
    })

    serverProcess.stderr.on('data', (data) => {
      console.error(`Server stderr: ${data}`)
    })

    serverProcess.on('close', (code) => {
      console.log(`Server process exited with code ${code}`)
      if (code !== 0) {
        reject(new Error(`Server process exited with code ${code}`))
      }
    })

    // Give server time to start
    setTimeout(() => {
      resolve('http://localhost:3002')
    }, 10000)
  })
}

async function createWindow() {
  // Create browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icon.png'),
    show: false,
    titleBarStyle: 'default'
  })

  try {
    const appUrl = getLocalAppUrl()
    console.log('Loading app from:', appUrl)
    
    // Load app
    await mainWindow.loadURL(appUrl)

    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
      setTimeout(() => {
        if (splashScreen) {
          splashScreen.close()
          splashScreen = null
        }
        mainWindow.show()
        mainWindow.focus()
        
        if (process.env.NODE_ENV === 'development') {
          mainWindow.webContents.openDevTools()
        }
      }, 2000) // 2 second splash screen
    })
  } catch (error) {
    console.error('Failed to load app:', error)
    if (splashScreen) {
      splashScreen.close()
    }
    
    // Show error dialog
    dialog.showMessageBox({
      type: 'error',
      title: 'Failed to Start Application',
      message: 'Could not load the application',
      detail: error.message,
      buttons: ['OK']
    })
    
    app.quit()
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null
    if (serverProcess) {
      serverProcess.kill()
    }
  })

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Create application menu
  createMenu()

  return mainWindow
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-project')
          }
        },
        {
          label: 'Open Project',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('menu-open-project')
          }
        },
        { type: 'separator' },
        {
          label: 'Import CSV',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            mainWindow.webContents.send('menu-import-csv')
          }
        },
        {
          label: 'Export XML',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow.webContents.send('menu-export-xml')
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Force Reload', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { label: 'Toggle Developer Tools', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Actual Size', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Toggle Fullscreen', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { label: 'Minimize', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        { label: 'Close', accelerator: 'CmdOrCtrl+W', role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About BOM Management Framework',
              message: 'BOM Management Framework',
              detail: 'Version 1.0.0\n\nA comprehensive tool for Bill of Materials translation and management.\n\nBuilt with Next.js, Electron, and SQLite.',
              buttons: ['OK']
            })
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// App event handlers
app.whenReady().then(() => {
  createSplashScreen()
  setTimeout(createWindow, 1000)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault()
    shell.openExternal(navigationUrl)
  })
})

// Handle app protocol for file associations
app.setAsDefaultProtocolClient('bom-framework')

// IPC handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options)
  return result
})

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options)
  return result
})

ipcMain.handle('get-app-path', (event, name) => {
  return app.getPath(name)
})

ipcMain.handle('write-file', async (event, filePath, data) => {
  try {
    // Convert data to Buffer if it's an ArrayBuffer or Uint8Array
    let buffer
    if (data instanceof ArrayBuffer) {
      buffer = Buffer.from(data)
    } else if (data instanceof Uint8Array) {
      buffer = Buffer.from(data)
    } else if (Buffer.isBuffer(data)) {
      buffer = data
    } else {
      // Assume it's a string
      buffer = Buffer.from(data)
    }
    
    await fs.promises.writeFile(filePath, buffer)
    return { success: true }
  } catch (error) {
    console.error('File write error:', error)
    return { 
      success: false, 
      error: error.message || 'Failed to write file' 
    }
  }
})