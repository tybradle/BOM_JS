# BOM Management Framework - Packaging Guide

**Version:** 1.0.0  
**Last Updated:** November 5, 2025  
**Platform:** Windows (macOS and Linux instructions included)

---

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Detailed Build Process](#detailed-build-process)
5. [Package Verification](#package-verification)
6. [Distribution](#distribution)
7. [Installation Guide](#installation-guide)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Configuration](#advanced-configuration)

---

## Overview

The BOM Management Framework uses **Next.js Standalone Mode** with **Electron** for optimal desktop distribution. This approach provides:

- ✅ **85% size reduction** compared to full node_modules packaging
- ✅ **Fast startup** (~333ms server initialization)
- ✅ **Production optimized** with only required dependencies
- ✅ **Cross-platform** support (Windows, macOS, Linux)

### Build Architecture
```
Next.js Build (Standalone)
    ↓
.next/standalone/
    ├── server.js (compiled server)
    ├── node_modules/ (minimal ~77MB)
    └── package.json
    ↓
Electron Packaging
    ↓
Distributable Application
```

---

## Prerequisites

### Required Software
- **Node.js**: 18+ (LTS recommended)
- **npm**: 9+ (comes with Node.js)
- **Git**: For version control

### Windows-Specific
- **Windows SDK**: Required for code signing (optional)
- **NSIS**: Included with electron-builder

### Disk Space
- **Development**: ~2 GB (node_modules + builds)
- **Build Output**: ~200-250 MB per platform
- **Temporary Build Files**: ~500 MB

---

## Quick Start

### Windows Build
```bash
# Build and package for Windows
npm run electron-pack-win
```

### All Platforms
```bash
# Build for Windows, macOS, and Linux
npm run dist-all
```

### Output Location
```
dist/
├── BOM Management Framework Setup 1.0.0.exe  # Windows installer
├── BOM Management Framework-1.0.0.dmg        # macOS installer
├── BOM Management Framework-1.0.0.AppImage   # Linux AppImage
└── win-unpacked/                              # Unpacked Windows app
```

---

## Detailed Build Process

### Step 1: Pre-Build Checklist

1. **Clean Environment**
   ```bash
   # Remove previous builds
   Remove-Item -Recurse -Force dist, .next
   
   # Verify clean state
   Get-ChildItem dist, .next -ErrorAction SilentlyContinue
   ```

2. **Verify Dependencies**
   ```bash
   # Ensure all dependencies installed
   npm install
   
   # Check for vulnerabilities
   npm audit
   ```

3. **Update Version** (if needed)
   ```json
   // package.json
   {
     "version": "1.0.0"  // Update as needed
   }
   ```

### Step 2: Build Next.js Application

```bash
# Build in standalone mode
npm run build
```

**Expected Output:**
```
✓ Compiled successfully
✓ Generating static pages
✓ Collecting build traces
✓ Finalizing standalone build

Build size:
  .next/standalone/    ~77 MB
  .next/static/        ~15 MB
```

**Verification:**
```bash
# Check standalone output
Test-Path .next\standalone\server.js  # Should be True
Test-Path .next\standalone\node_modules  # Should be True

# Test standalone server
npm run test-standalone
```

### Step 3: Package with Electron

```bash
# Windows
npm run electron-pack-win

# macOS (from macOS)
npm run electron-pack-mac

# Linux (from Linux)
npm run electron-pack-linux

# All platforms (requires appropriate OS)
npm run dist-all
```

**Build Time:** 2-5 minutes depending on system performance

**Progress Indicators:**
```
• electron-builder version=26.0.12
• loaded configuration file=package.json
• description is missed in the package.json
• writing effective config file=dist\builder-effective-config.yaml
• packaging platform=win32 arch=x64 electron=38.3.0
• building target=nsis
• building block map blockMapFile=dist\BOM Management Framework Setup 1.0.0.exe.blockmap
```

### Step 4: Verify Build

Run automated verification:
```bash
.\scripts\sprint4-task2.ps1
```

Manual verification:
```bash
# Check installer exists
Test-Path "dist\BOM Management Framework Setup 1.0.0.exe"

# Check unpacked app
Test-Path "dist\win-unpacked\BOM Management Framework.exe"

# Test unpacked app
cd dist\win-unpacked
.\BOM Management Framework.exe
```

---

## Package Verification

### Automated Verification

```bash
# Run comprehensive verification
.\scripts\sprint4-task2.ps1
```

**Checks Performed:**
- ✅ Installer created
- ✅ Installer size validation
- ✅ Unpacked application structure
- ✅ Required resources included
- ✅ Application launches successfully
- ✅ Clean shutdown behavior

### Manual Verification Checklist

#### Installer Validation
- [ ] Installer file exists
- [ ] Size is 150-250 MB
- [ ] File name matches version
- [ ] No corruption (can be extracted)

#### Application Validation
- [ ] Application launches without errors
- [ ] Splash screen appears
- [ ] Main window loads within 5 seconds
- [ ] Database initializes correctly
- [ ] All features accessible

#### Feature Testing
- [ ] Create new project
- [ ] Add BOM items
- [ ] Import CSV file
- [ ] Export to XML
- [ ] Database backup/restore
- [ ] Settings persistence

---

## Distribution

### Package Types

#### Windows
1. **NSIS Installer** (`.exe`)
   - One-click installation
   - Desktop shortcut creation
   - Start Menu integration
   - Uninstaller included
   - Size: ~150-200 MB

2. **Unpacked Application** (`win-unpacked/`)
   - Portable version
   - No installation required
   - Useful for testing
   - Size: ~200-250 MB

#### macOS
1. **DMG Installer** (`.dmg`)
   - Drag-and-drop installation
   - Application signature
   - Size: ~150-200 MB

2. **ZIP Archive** (`.zip`)
   - Compressed application
   - Manual installation

#### Linux
1. **AppImage** (`.AppImage`)
   - Portable, no installation
   - Works on most distros
   - Size: ~150-200 MB

2. **DEB Package** (`.deb`)
   - Debian/Ubuntu installer
   - APT integration

### Distribution Channels

#### Internal Distribution
1. **Network Share**
   ```
   \\shared\software\BOM-Framework\v1.0.0\
   ├── BOM Management Framework Setup 1.0.0.exe
   ├── INSTALL.md
   └── RELEASE_NOTES.md
   ```

2. **Internal Portal**
   - Upload to company software portal
   - Include installation instructions
   - Provide release notes

#### External Distribution
1. **Website Download**
   - Host on company website
   - Provide download link
   - Include system requirements

2. **GitHub Releases**
   - Create release on GitHub
   - Attach installers
   - Provide changelog

### File Naming Convention
```
BOM Management Framework Setup [version].exe
BOM Management Framework-[version].dmg
BOM Management Framework-[version].AppImage
```

---

## Installation Guide

### For End Users

#### Windows Installation

1. **Download Installer**
   - Get `BOM Management Framework Setup 1.0.0.exe`
   - Verify file size (~150-200 MB)

2. **Run Installer**
   - Double-click the installer
   - Click "Next" on welcome screen
   - Accept license agreement (if configured)
   - Choose installation location
   - Default: `C:\Program Files\BOM Management Framework`

3. **Installation Options**
   - ✅ Create Desktop Shortcut
   - ✅ Create Start Menu Entry
   - ✅ Add to PATH (optional)

4. **Complete Installation**
   - Click "Install"
   - Wait for installation (1-2 minutes)
   - Click "Finish"

5. **First Launch**
   - Click desktop shortcut or Start Menu entry
   - Application initializes (5-10 seconds)
   - Database created in user directory
   - Welcome screen appears

#### System Requirements
- **Operating System**: Windows 10/11 (64-bit)
- **Processor**: Intel Core i3 or equivalent
- **RAM**: 4 GB minimum, 8 GB recommended
- **Disk Space**: 500 MB for application
- **Display**: 1280x800 minimum resolution
- **Network**: Not required (fully offline)

#### Data Storage Locations

**Application Files:**
```
C:\Program Files\BOM Management Framework\
├── BOM Management Framework.exe
├── resources\
│   ├── app.asar
│   ├── .next\
│   └── public\
└── uninstall.exe
```

**User Data:**
```
%USERPROFILE%\AppData\Roaming\BOM Management Framework\
├── Database\
│   └── bom.db
├── Exports\
├── Logs\
└── Settings\
```

#### Uninstallation

1. **Via Control Panel**
   - Open "Add or Remove Programs"
   - Find "BOM Management Framework"
   - Click "Uninstall"
   - Follow prompts

2. **Via Start Menu**
   - Find "BOM Management Framework" folder
   - Click "Uninstall BOM Management Framework"

3. **Clean Uninstall**
   - Uninstall application
   - Delete user data folder (optional):
     ```
     %USERPROFILE%\AppData\Roaming\BOM Management Framework\
     ```

---

## Troubleshooting

### Build Issues

#### Issue: Build Fails with TypeScript Errors
**Solution:**
```bash
# Clean and rebuild
Remove-Item -Recurse -Force .next
npm run build
```

#### Issue: Standalone Directory Not Created
**Solution:**
```json
// Verify next.config.ts
{
  "output": "standalone"  // Must be present
}
```

#### Issue: Packaging Fails - "Cannot find module"
**Solution:**
```bash
# Ensure build completed
npm run build

# Verify standalone output
Test-Path .next\standalone\server.js

# Then package
npm run electron-pack-win
```

### Package Issues

#### Issue: Installer Size Too Large (>300 MB)
**Causes:**
- Full node_modules included
- Development dependencies included

**Solution:**
```json
// Verify package.json build config
{
  "build": {
    "files": [
      ".next/standalone/**/*",  // Should use standalone
      ".next/static/**/*",
      "public/**/*"
    ]
  }
}
```

#### Issue: Application Won't Launch After Install
**Troubleshooting:**
1. Check Windows Event Viewer for errors
2. Try unpacked version first
3. Verify antivirus isn't blocking
4. Check file permissions

#### Issue: Blank Window on Launch
**Causes:**
- Server not starting
- Port conflict
- Missing resources

**Solution:**
```bash
# Test standalone server first
cd .next\standalone
node server.js

# Check for errors in console
```

### Runtime Issues

#### Issue: Database Not Created
**Solution:**
```
Check user permissions for:
%USERPROFILE%\AppData\Roaming\BOM Management Framework\
```

#### Issue: Import/Export Not Working
**Solution:**
```
Verify file system permissions
Try running as administrator (once)
```

---

## Advanced Configuration

### Code Signing (Windows)

#### Setup
1. **Obtain Certificate**
   - Purchase from Certificate Authority
   - Or use self-signed for internal distribution

2. **Configure electron-builder**
   ```json
   {
     "build": {
       "win": {
         "certificateFile": "cert/certificate.pfx",
         "certificatePassword": "password",
         "signingHashAlgorithms": ["sha256"]
       }
     }
   }
   ```

3. **Build Signed Package**
   ```bash
   npm run electron-pack-win
   ```

### Custom Branding

#### Application Icon
1. **Create Icons**
   - Windows: `.ico` format (256x256)
   - macOS: `.icns` format
   - Linux: `.png` format (512x512)

2. **Update Configuration**
   ```json
   {
     "build": {
       "win": {
         "icon": "public/icon.ico"
       }
     }
   }
   ```

#### Splash Screen
- Edit: `public/splash.html`
- Size: 400x300px recommended
- Format: HTML with inline CSS

### Build Optimization

#### Reduce Bundle Size
```json
// next.config.ts
{
  "output": "standalone",
  "compiler": {
    "removeConsole": true  // Remove console.logs in production
  }
}
```

#### Performance Tuning
```json
// electron.js
{
  "webPreferences": {
    "nodeIntegration": false,
    "contextIsolation": true,
    "preload": path.join(__dirname, 'preload.js')
  }
}
```

---

## Testing Checklist

### Pre-Release Testing

- [ ] Clean build completes without errors
- [ ] Standalone server starts successfully
- [ ] Package created with correct size
- [ ] Installer runs without errors
- [ ] Application launches correctly
- [ ] All features functional:
  - [ ] Project creation
  - [ ] BOM item management
  - [ ] CSV import
  - [ ] XML export
  - [ ] Database backup
  - [ ] Settings persistence
- [ ] Clean uninstall process
- [ ] No leftover files after uninstall

### Performance Testing
- [ ] Launch time < 5 seconds
- [ ] BOM with 500+ items loads < 2 seconds
- [ ] Export completes < 3 seconds
- [ ] Memory usage < 500 MB
- [ ] No memory leaks after 30 minutes use

---

## Release Preparation

### Version Bump
```bash
# Update version in package.json
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0
```

### Create Release Notes
See [RELEASE_NOTES.md](RELEASE_NOTES.md) template

### Git Tagging
```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

---

## Support Resources

### Documentation
- [README.md](../README.md) - Getting started
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Deployment details
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues

### Scripts
- `scripts/sprint4-task1.ps1` - Automated build
- `scripts/sprint4-task2.ps1` - Package verification (removed during cleanup)
- `scripts/test-sprint3.ps1` - Testing validation (removed during cleanup)

### Contact
For packaging issues or questions, contact the development team.

---

**Document Version:** 1.0  
**Last Reviewed:** November 5, 2025  
**Status:** Production Ready ✅
