# Update Strategy for BOM Management Framework Desktop App

**Date**: October 30, 2025  
**Current Version**: 1.0.0  
**Target**: Standalone Electron Desktop Application

---

## The Challenge

In **development**, you have hot reload - code changes appear instantly. In **production**, the app is a compiled, packaged binary. Users won't see changes until they get a new version.

---

## Update Options for Electron Apps

### Option 1: **electron-updater** (Recommended) ✅

**Best for**: Professional apps with regular updates, automatic update delivery

**How It Works**:
1. User opens app → Checks for updates in background
2. New version found → Downloads silently or prompts user
3. Update downloaded → Prompts "Restart to update" or auto-restarts
4. App relaunches with new version

**Pros**:
- ✅ Automatic update checks
- ✅ Code signing supported (Windows/Mac)
- ✅ Delta updates (only changed files)
- ✅ Rollback capability
- ✅ Professional user experience
- ✅ Works with GitHub Releases (free hosting)

**Cons**:
- ❌ Requires update server or GitHub releases
- ❌ Initial setup complexity
- ❌ Needs code signing certificates for Mac (optional for Windows)

---

### Option 2: **Manual Download from Website**

**Best for**: Infrequent updates, simple deployment, offline/internal tools

**How It Works**:
1. You build new version → Upload installer to website/network share
2. Users visit website → Download new installer
3. Run installer → Overwrites old version

**Pros**:
- ✅ Simple to understand
- ✅ Full control over process
- ✅ No dependencies
- ✅ Works for air-gapped/offline environments

**Cons**:
- ❌ Manual user action required
- ❌ Users may not know updates exist
- ❌ Friction (must download + run installer)
- ❌ Users might skip updates

---

### Option 3: **GitHub Releases + Manual Check**

**Best for**: Small teams, internal tools, beta releases

**How It Works**:
1. User clicks "Check for Updates" in app menu
2. App fetches latest release from GitHub API
3. If newer version exists → Shows dialog with download link
4. User downloads manually

**Pros**:
- ✅ Free hosting (GitHub Releases)
- ✅ Simple implementation
- ✅ No auto-update complexity
- ✅ User controls when to update

**Cons**:
- ❌ Users must remember to check
- ❌ Extra steps to download/install
- ❌ Not fully automatic

---

## Recommended Implementation: electron-updater with GitHub Releases

Given your existing setup with GitHub publish configuration, this is the best path forward.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                        │
│                                                               │
│  Releases/                                                    │
│  ├── v1.0.0/                                                  │
│  │   ├── BOM-Management-Framework-Setup-1.0.0.exe            │
│  │   ├── latest.yml (metadata for Windows)                   │
│  │   └── BOM-Management-Framework-1.0.0.AppImage             │
│  └── v1.1.0/  ← New release                                  │
│      ├── BOM-Management-Framework-Setup-1.1.0.exe            │
│      ├── latest.yml                                           │
│      └── BOM-Management-Framework-1.1.0.AppImage             │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    User's Installed App (v1.0.0)
                              ↓
              Checks GitHub on startup (background)
                              ↓
                 Finds v1.1.0 available
                              ↓
         ┌──────────────────────────────────────┐
         │  Update available: v1.1.0            │
         │  Release notes: - New import feature │
         │                 - Bug fixes          │
         │                                      │
         │  [Download Update] [Remind Later]   │
         └──────────────────────────────────────┘
                              ↓
            Downloads update in background
                              ↓
         ┌──────────────────────────────────────┐
         │  Update ready to install             │
         │  [Restart Now] [Restart Later]      │
         └──────────────────────────────────────┘
```

---

## Step-by-Step Implementation

### 1. Install electron-updater

```bash
npm install electron-updater
```

### 2. Update package.json

Your `package.json` already has the publish config! Just verify:

```json
"build": {
  "publish": {
    "provider": "github",
    "owner": "tybradle",          // ← Your GitHub username
    "repo": "BOM_JS"               // ← Your repo name
  }
}
```

### 3. Update electron.js to Include Auto-Updater

Add this to `public/electron.js`:

```javascript
const { autoUpdater } = require('electron-updater')
const log = require('electron-log')

// Configure logging
autoUpdater.logger = log
autoUpdater.logger.transports.file.level = 'info'

// Configure auto-updater
autoUpdater.autoDownload = false  // Don't auto-download, ask user first
autoUpdater.autoInstallOnAppQuit = true

// Check for updates when app is ready
app.on('ready', () => {
  // ... existing splash screen code ...
  
  // Check for updates 3 seconds after launch (give app time to load)
  setTimeout(() => {
    if (!isDev) {
      checkForUpdates()
    }
  }, 3000)
})

// Update check function
function checkForUpdates() {
  autoUpdater.checkForUpdates()
}

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
  log.info('Checking for updates...')
})

autoUpdater.on('update-available', (info) => {
  log.info('Update available:', info.version)
  
  // Ask user if they want to download
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Available',
    message: `Version ${info.version} is available.`,
    detail: 'Would you like to download it now? The update will be installed when you restart the app.',
    buttons: ['Download', 'Later'],
    defaultId: 0,
    cancelId: 1
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.downloadUpdate()
      
      // Show downloading dialog
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Downloading Update',
        message: 'The update is being downloaded in the background.',
        buttons: ['OK']
      })
    }
  })
})

autoUpdater.on('update-not-available', (info) => {
  log.info('Update not available:', info.version)
  // Don't show dialog on startup, only if user manually checks
})

autoUpdater.on('error', (err) => {
  log.error('Update error:', err)
  // Silent fail - don't bother user with update errors
})

autoUpdater.on('download-progress', (progressObj) => {
  log.info(`Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`)
  // Could send to renderer to show progress bar
})

autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded:', info.version)
  
  // Prompt user to restart
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Ready',
    message: 'Update has been downloaded.',
    detail: 'The app will restart to apply the update.',
    buttons: ['Restart Now', 'Later'],
    defaultId: 0,
    cancelId: 1
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall(false, true)
    }
  })
})

// Add menu item for manual update check
function createMenu() {
  const template = [
    // ... existing menu items ...
    {
      label: 'Help',
      submenu: [
        {
          label: 'Check for Updates...',
          click: () => {
            // Manual check - show result even if no update
            autoUpdater.checkForUpdates().then((updateCheckResult) => {
              if (!updateCheckResult || !updateCheckResult.updateInfo) {
                dialog.showMessageBox(mainWindow, {
                  type: 'info',
                  title: 'No Updates',
                  message: 'You are running the latest version.',
                  buttons: ['OK']
                })
              }
            })
          }
        },
        { type: 'separator' },
        {
          label: 'About',
          // ... existing about code ...
        }
      ]
    }
  ]
  
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
```

### 4. Add electron-log Dependency

```bash
npm install electron-log
```

### 5. Update Build Scripts for Publishing

Add new script to `package.json`:

```json
"scripts": {
  "publish-release": "npm run build && electron-builder --publish always"
}
```

---

## Release Workflow

### When You Want to Release an Update

#### Step 1: Update Version Number

```bash
npm version patch   # 1.0.0 → 1.0.1 (bug fixes)
npm version minor   # 1.0.0 → 1.1.0 (new features)
npm version major   # 1.0.0 → 2.0.0 (breaking changes)
```

This updates `package.json` and creates a git tag.

#### Step 2: Build and Publish to GitHub

```bash
npm run publish-release
```

This will:
1. Build the Next.js app
2. Package with electron-builder
3. Upload installers to GitHub Releases
4. Generate `latest.yml` metadata file

#### Step 3: Create GitHub Release (if not auto-created)

1. Go to GitHub → Releases → Draft new release
2. Tag: v1.1.0 (matches package.json version)
3. Title: "Version 1.1.0"
4. Description: Release notes (what's new)
5. Attach binaries (electron-builder does this automatically)
6. Publish release

#### Step 4: Users Get Update Automatically

- Next time users open the app, they'll see update prompt
- They download and install with 2 clicks

---

## Version Numbering Strategy

Use **Semantic Versioning** (semver):

```
MAJOR.MINOR.PATCH

1.0.0 → Initial release
1.0.1 → Bug fix (backward compatible)
1.1.0 → New feature (backward compatible)
2.0.0 → Breaking change (incompatible API)
```

**Examples**:
- Added auto-add missing parts feature → `1.1.0`
- Fixed import crash bug → `1.0.1`
- Rewrote database (incompatible) → `2.0.0`

---

## Database Migration Strategy

**Critical for Updates**: Your app uses SQLite. When you update the database schema, old app versions won't work.

### Option A: Prisma Migrations (Recommended)

1. **Development**: Make schema changes
2. **Create Migration**: `npm run db:migrate`
3. **Include in Release**: Ship migration files
4. **On App Start**: Run migrations automatically

Add to `electron.js`:

```javascript
const { execSync } = require('child_process')

async function runDatabaseMigrations() {
  try {
    const dbPath = isDev 
      ? path.join(__dirname, '../db/custom.db')
      : path.join(app.getPath('userData'), 'db/custom.db')
    
    // Run Prisma migrations
    execSync('npx prisma migrate deploy', {
      env: { DATABASE_URL: `file:${dbPath}` },
      cwd: isDev ? path.join(__dirname, '..') : process.resourcesPath
    })
    
    log.info('Database migrations completed')
  } catch (error) {
    log.error('Migration failed:', error)
  }
}

app.whenReady().then(async () => {
  await runDatabaseMigrations()
  createSplashScreen()
  setTimeout(createWindow, 1000)
})
```

### Option B: Version Check + Manual Migration

```javascript
// Check database version on startup
const currentDbVersion = await db.setting.findUnique({ where: { key: 'db_version' } })

if (currentDbVersion.value !== expectedVersion) {
  // Run migration scripts
  await migrateFrom(currentDbVersion.value)
  await db.setting.update({ where: { key: 'db_version' }, data: { value: expectedVersion } })
}
```

---

## Testing Updates Locally

### 1. Build Production App

```bash
npm run electron-pack-win
```

### 2. Test Update Flow

```bash
# Build version 1.0.0
npm version 1.0.0
npm run electron-pack-win

# Install and run
dist/BOM-Management-Framework-Setup-1.0.0.exe

# Build version 1.0.1 with changes
npm version 1.0.1
npm run publish-release  # Publishes to GitHub

# Open version 1.0.0 → Should prompt for update
```

### 3. Test Without Publishing

Set `autoUpdater` to use local server:

```javascript
if (isDev) {
  autoUpdater.updateConfigPath = path.join(__dirname, 'dev-app-update.yml')
}
```

Create `dev-app-update.yml`:

```yaml
provider: generic
url: http://localhost:5000/updates
```

---

## Alternative: Simple Update Notification

If auto-updater is too complex, here's a simpler approach:

### Check GitHub API for Latest Release

```javascript
// In electron.js
const fetch = require('node-fetch')

async function checkForUpdatesSimple() {
  try {
    const response = await fetch('https://api.github.com/repos/tybradle/BOM_JS/releases/latest')
    const release = await response.json()
    const latestVersion = release.tag_name.replace('v', '')
    const currentVersion = app.getVersion()
    
    if (latestVersion > currentVersion) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Available',
        message: `Version ${latestVersion} is available!`,
        detail: `You are running version ${currentVersion}.\\n\\nClick "Download" to get the latest version.`,
        buttons: ['Download', 'Later'],
        defaultId: 0,
        cancelId: 1
      }).then((result) => {
        if (result.response === 0) {
          shell.openExternal(release.html_url)
        }
      })
    }
  } catch (error) {
    log.error('Update check failed:', error)
  }
}
```

---

## Production Deployment Checklist

### Before First Release

- [ ] Set GitHub repo in `package.json` publish config
- [ ] Generate GitHub Personal Access Token with `repo` scope
- [ ] Set `GH_TOKEN` environment variable: `$env:GH_TOKEN="your-token"`
- [ ] Test build locally: `npm run electron-pack-win`
- [ ] Test installer works
- [ ] Verify database location (user data directory)
- [ ] Test uninstall/reinstall preserves data

### For Each Update

- [ ] Update version: `npm version patch/minor/major`
- [ ] Update CHANGELOG.md with release notes
- [ ] Test changes in dev mode
- [ ] Build production: `npm run build`
- [ ] Test packaged app locally
- [ ] Commit and push changes
- [ ] Publish to GitHub: `npm run publish-release`
- [ ] Verify release appears on GitHub
- [ ] Test update from previous version
- [ ] Announce update to users

---

## Code Signing (Optional but Recommended)

### Windows

**Why**: Prevents "Unknown Publisher" warnings

**How**:
1. Get code signing certificate (~$100/year from DigiCert, Sectigo, etc.)
2. Add to `package.json`:

```json
"win": {
  "certificateFile": "cert/windows-cert.pfx",
  "certificatePassword": "your-password",
  "signingHashAlgorithms": ["sha256"],
  "target": ["nsis"]
}
```

### macOS

**Why**: Required for distribution outside App Store

**How**:
1. Enroll in Apple Developer Program ($99/year)
2. Create certificates in Xcode
3. Add to `package.json`:

```json
"mac": {
  "identity": "Developer ID Application: Your Name (TEAM_ID)"
}
```

---

## Recommended Setup for Your Use Case

Based on your project (industrial automation, likely internal use):

### **Hybrid Approach**

1. **Use electron-updater** with GitHub Releases for convenience
2. **Keep manual download option** for air-gapped/offline environments
3. **Automatic checks** on startup, but user controls install
4. **Database migrations** run automatically on first launch after update

### Configuration

```json
"build": {
  "publish": {
    "provider": "github",
    "owner": "tybradle",
    "repo": "BOM_JS",
    "releaseType": "release"
  }
}
```

### Update Strategy

- **Patch releases** (bug fixes): Weekly/as needed
- **Minor releases** (new features): Monthly
- **Major releases** (breaking changes): Quarterly

---

## Summary

| Method | Effort | User Experience | Best For |
|--------|--------|-----------------|----------|
| electron-updater | Medium | ⭐⭐⭐⭐⭐ Automatic | Professional apps |
| GitHub API + Manual | Low | ⭐⭐⭐ Notification | Internal tools |
| Manual Download | Very Low | ⭐⭐ Manual | Rare updates |

**Recommendation**: Start with **GitHub API + Manual notification** (simpler), then upgrade to **electron-updater** if you release updates frequently.

---

## Next Steps

1. Choose update strategy (electron-updater recommended)
2. Set up GitHub releases
3. Implement update checking in `electron.js`
4. Test with version bump (1.0.0 → 1.0.1)
5. Document release process for your team

---

**Questions to Answer**:
- How often will you release updates? (Weekly? Monthly?)
- Do users need internet access? (Auto-update requires it)
- Will you code sign? (Recommended for Windows, required for Mac)
- Air-gapped environments? (Need manual installer option)
