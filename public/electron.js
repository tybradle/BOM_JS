const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')

// Setup logging to file
const logDir = path.join(app.getPath('userData'), 'logs')
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}
const logFile = path.join(logDir, 'electron.log')
const logStream = fs.createWriteStream(logFile, { flags: 'a' })

// Override console.log to write to both console and file
const originalConsoleLog = console.log
const originalConsoleError = console.error
console.log = function(...args) {
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
  const timestamp = new Date().toISOString()
  logStream.write(`[${timestamp}] LOG: ${message}\n`)
  originalConsoleLog.apply(console, args)
}
console.error = function(...args) {
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
  const timestamp = new Date().toISOString()
  logStream.write(`[${timestamp}] ERROR: ${message}\n`)
  originalConsoleError.apply(console, args)
}

console.log('=== ELECTRON STARTING ===')
console.log('Log file:', logFile)

// Disable hardware acceleration to prevent GPU crashes
app.disableHardwareAcceleration()

// More robust development detection
const isExplicitDev = process.env.NODE_ENV === 'development'
const hasDevServer = fs.existsSync(path.join(__dirname, '../src'))
const isDev = isExplicitDev || (process.env.NODE_ENV !== 'production' && hasDevServer)

// Keep a global reference of the window object
let mainWindow
let splashScreen
let serverProcess

function createSplashScreen() {
  console.log('Creating splash screen...')
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
    console.log('Splash screen ready, showing...')
    splashScreen.show()
  })

  return splashScreen
}

function startServer() {
  return new Promise((resolve, reject) => {
    console.log('startServer called, isDev:', isDev)
    
    if (isDev) {
      console.log('Development mode detected, resolving to localhost:3002')
      resolve('http://localhost:3002')
      return
    }

    // Production mode: use standalone server
    // In packaged app: resources/app/.next/standalone/server.js
    // __dirname in packaged app points to resources/app/public
    // In electron-local mode: __dirname is public/, but .next is in parent (project root)
    const isPackaged = !isDev && __dirname.includes('resources')
    const basePath = isPackaged ? path.join(__dirname, '..') : path.join(__dirname, '..')
    const standaloneServerPath = path.join(basePath, '.next/standalone/server.js')
    const standaloneCwd = path.join(basePath, '.next/standalone')
    
    console.log('Checking for standalone server at:', standaloneServerPath)
    if (!fs.existsSync(standaloneServerPath)) {
      const errorMsg = `Standalone server not found at: ${standaloneServerPath}\n__dirname: ${__dirname}\nbasePath: ${basePath}`
      console.error(errorMsg)
      reject(new Error(errorMsg))
      return
    }

    console.log('Starting standalone Next.js server...')
    
    // Next.js standalone requires .next/static and public folders to be accessible
    // Copy them to the standalone directory if they don't exist
    const staticSource = path.join(basePath, '.next/static')
    const staticDest = path.join(standaloneCwd, '.next/static')
    const publicSource = path.join(basePath, 'public')
    const publicDest = path.join(standaloneCwd, 'public')
    
    // Create .next directory in standalone if needed
    const standaloneNextDir = path.join(standaloneCwd, '.next')
    if (!fs.existsSync(standaloneNextDir)) {
      fs.mkdirSync(standaloneNextDir, { recursive: true })
    }
    
    // Only copy static/public folders if they don't exist (first run optimization)
    // This prevents unnecessary I/O on every app launch
    if (fs.existsSync(staticSource) && !fs.existsSync(staticDest)) {
      console.log('First run: Copying static folder to standalone...')
      fs.cpSync(staticSource, staticDest, { recursive: true })
      console.log('Static folder copied successfully')
    } else if (fs.existsSync(staticDest)) {
      console.log('Static folder already exists, skipping copy')
    }
    
    if (fs.existsSync(publicSource) && !fs.existsSync(publicDest)) {
      console.log('First run: Copying public folder to standalone...')
      fs.cpSync(publicSource, publicDest, { recursive: true })
      console.log('Public folder copied successfully')
    } else if (fs.existsSync(publicDest)) {
      console.log('Public folder already exists, skipping copy')
    }
    
    // Use process.execPath to get Electron's Node.js in production
    const nodePath = process.execPath
    console.log('Using Node.js from:', nodePath)
    console.log('Server script:', standaloneServerPath)
    console.log('Working directory:', standaloneCwd)
    
    serverProcess = spawn(nodePath, [standaloneServerPath], {
      cwd: standaloneCwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: '3002',
        ELECTRON_RUN_AS_NODE: '1'
      }
    })

    serverProcess.on('error', (err) => {
      console.error('Failed to start server process:', err)
      reject(err)
    })

    serverProcess.stdout.on('data', (data) => {
      console.log(`Server stdout: ${data}`)
      // Next.js 15 outputs "✓ Ready in XXXms" instead of "Ready on http"
      if (data.toString().includes('Ready in') || data.toString().includes('Ready on http')) {
        console.log('Server ready signal detected')
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
  console.log('Creating main window...')
  
  // Create the browser window
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
    icon: path.join(__dirname, '../public/icon.png'),
    show: false,
    titleBarStyle: 'default'
  })

  try {
    console.log('Starting server...')
    const serverUrl = await startServer()
    console.log('Server URL:', serverUrl)
    
    // Load the app
    console.log('Loading URL:', serverUrl)
    await mainWindow.loadURL(serverUrl)
    console.log('URL loaded successfully')
    
    // Log page loading events
    mainWindow.webContents.on('did-start-loading', () => {
      console.log('Page started loading')
    })
    
    mainWindow.webContents.on('did-finish-load', () => {
      console.log('Page finished loading')
    })
    
    mainWindow.webContents.on('dom-ready', () => {
      console.log('DOM ready')
    })

    // Show window when ready to prevent visual flash
    let windowShown = false
    const showMainWindow = () => {
      if (windowShown) return
      windowShown = true
      
      console.log('Closing splash screen and showing main window')
      if (splashScreen) {
        splashScreen.close()
        splashScreen = null
      }
      mainWindow.show()
      mainWindow.focus()
      
      if (isDev) {
        mainWindow.webContents.openDevTools()
      }
    }
    
    mainWindow.once('ready-to-show', () => {
      console.log('Window ready-to-show event fired')
      setTimeout(showMainWindow, 500)
    })
    
    // Fallback: show window after 5 seconds even if ready-to-show doesn't fire
    setTimeout(() => {
      if (!windowShown) {
        console.log('Fallback: Forcing window to show after timeout')
        showMainWindow()
      }
    }, 5000)

    // Add error handling for page load failures
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('Failed to load page:', errorCode, errorDescription)
      // Show window anyway so user can see the error
      setTimeout(showMainWindow, 1000)
    })

  } catch (error) {
    console.error('Failed to start server:', error)
    if (splashScreen) {
      splashScreen.close()
    }
    mainWindow.close()
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
              detail: 'Version 1.0.0\\n\\nA comprehensive tool for Bill of Materials translation and management.\\n\\nBuilt with Next.js, Electron, and SQLite.',
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
  console.log('=== APP READY ===')
  console.log('isDev:', isDev)
  console.log('__dirname:', __dirname)
  
  createSplashScreen()
  console.log('Waiting 1 second before creating main window...')
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