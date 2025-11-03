# Pre-Packaging Checklist for BOM Management Framework

**Last Updated**: November 3, 2025  
**Version**: 1.0.0  
**Target**: Trial/Production Deployment

---

## ✅ Completed Items

### Critical Fixes
- [x] **Icons**: Updated package.json to use .png icons (electron-builder will auto-convert)
- [x] **Production Logging**: Disabled Prisma query logging in production
- [x] **Debug Logs**: Made CSV parser console logs conditional on DEBUG flag
- [x] **Build Test**: Confirmed Next.js production build succeeds
- [x] **TypeScript**: No compilation errors
- [x] **Database Path**: Configured to use %USERPROFILE%/BOM_SUITE/masterdb.db

### Features Complete
- [x] All Sprint features implemented (Export, Import, Performance)
- [x] Auto-add missing parts feature complete
- [x] Database management tools functional
- [x] Settings dialog implemented
- [x] Auto-updater configured with network share support
- [x] Database backup on update implemented

---

## 📋 Pre-Packaging Steps

### 1. Clean Build Environment
```bash
# Remove previous build artifacts
rmdir /s /q dist
rmdir /s /q .next

# Clean node_modules (optional but recommended)
rmdir /s /q node_modules
npm install
```

### 2. Update Version Number
```bash
# Edit package.json version field
# Current: "version": "1.0.0"
# Bump as needed: 1.0.1, 1.1.0, etc.
```

### 3. Environment Configuration
Verify `.env` file contains:
```env
DATABASE_URL="file:%USERPROFILE%/BOM_SUITE/masterdb.db"
NODE_ENV="production"
```

### 4. Build for Production
```bash
# Build Next.js production bundle
npm run build

# Verify build completed successfully
# Check for any warnings or errors
```

### 5. Package for Electron
```bash
# Package for Windows (current platform)
npm run electron-pack-win

# Or package for all platforms
npm run dist-all
```

### 6. Test Packaged Application
- [ ] Install from `dist/BOM Management Framework Setup 1.0.0.exe`
- [ ] Verify splash screen appears
- [ ] Verify app launches and loads on http://localhost:3002
- [ ] Test creating a new project
- [ ] Test importing CSV/Excel data
- [ ] Test exporting to XML/CSV/Excel
- [ ] Test database tools (backup/restore)
- [ ] Test settings dialog
- [ ] Verify database created at correct location
- [ ] Test closing and reopening (data persistence)

---

## 🔍 Quality Assurance Checks

### Functionality Testing
- [ ] **Project Management**
  - [ ] Create new project
  - [ ] Edit project details
  - [ ] Delete project
  - [ ] Switch between projects
  
- [ ] **BOM Management**
  - [ ] Add items manually
  - [ ] Edit items inline (Excel-like)
  - [ ] Delete items
  - [ ] Bulk select and delete
  - [ ] Sort by columns
  - [ ] Filter items
  
- [ ] **Import/Export**
  - [ ] Import CSV with valid data
  - [ ] Import Excel with valid data
  - [ ] Handle missing required fields
  - [ ] Detect duplicate part numbers
  - [ ] Auto-add missing parts to database
  - [ ] Export to Eplan XML
  - [ ] Export to CSV
  - [ ] Export to Excel
  
- [ ] **Database Management**
  - [ ] Export database to archive
  - [ ] Import database from archive
  - [ ] Launch Prisma Studio
  - [ ] View database location
  
- [ ] **Settings**
  - [ ] Save settings
  - [ ] Load settings on restart
  - [ ] Reset to defaults

### Performance Testing
- [ ] Import 100+ items - completes in < 5 seconds
- [ ] Search 500+ parts - results in < 500ms
- [ ] Export 100+ items - completes in < 3 seconds
- [ ] Database operations responsive
- [ ] No UI freezing or stuttering

### Error Handling
- [ ] Invalid CSV format shows clear error
- [ ] Missing required fields handled gracefully
- [ ] Database errors don't crash app
- [ ] Network errors handled (for updates)
- [ ] File access errors handled

### User Experience
- [ ] Loading states visible during operations
- [ ] Success messages clear and informative
- [ ] Error messages actionable
- [ ] Dialogs can be closed/cancelled
- [ ] Keyboard shortcuts work
- [ ] Theme switching works (if implemented)

---

## 🚀 Distribution Preparation

### Network Share Setup (If Using Auto-Update)
```
\\company-server\shared\bom-updates\
├── current\
│   ├── BOM Management Framework Setup 1.0.0.exe
│   ├── latest.yml
│   └── version.json
├── updates\
│   └── 1.0.0\
└── archive\
```

Deploy to network share:
```bash
npm run deploy-network "Initial trial release"
```

### Manual Distribution
If not using network share:
1. [ ] Copy installer from `dist/BOM Management Framework Setup 1.0.0.exe`
2. [ ] Create README with installation instructions
3. [ ] Include sample import files
4. [ ] Provide support contact information

---

## 📝 Release Notes Template

Create `RELEASE_NOTES.md`:

```markdown
# BOM Management Framework v1.0.0

**Release Date**: November 3, 2025  
**Type**: Trial Release

## Features
- Project-based BOM management
- Excel-like inline editing
- Multi-format import (CSV, Excel)
- Multi-format export (Eplan XML, CSV, Excel)
- Master parts database with auto-population
- Database backup and restore tools
- Automatic updates via network share

## Installation
1. Run `BOM Management Framework Setup 1.0.0.exe`
2. Follow installation wizard
3. Launch application from Start Menu or Desktop

## System Requirements
- Windows 10 or later
- 4GB RAM minimum
- 500MB disk space
- Network access (for updates)

## Known Issues
- None at this time

## Support
Contact: [Your support email/team]
```

---

## ⚠️ Known Limitations (For Trial Users)

Document these for trial users:
- Database stored locally (not multi-user)
- SQLite-based (not suitable for concurrent access)
- No authentication/user management
- Network updates require network share access
- Windows-only build (Mac/Linux available on request)

---

## 🔧 Troubleshooting Guide (Include with Distribution)

Common issues and solutions:

### App Won't Start
- Check Event Viewer for errors
- Verify .NET Framework installed
- Try running as Administrator

### Database Errors
- Delete `%USERPROFILE%\BOM_SUITE\masterdb.db` to start fresh
- Check folder permissions

### Import Fails
- Verify CSV/Excel has required columns:
  - Part Number
  - Description
  - Quantity
  - Unit (or will default to "EA")

### Updates Not Working
- Verify network share accessible
- Check Help → About for current version
- Manually download from network share if needed

---

## ✨ Post-Packaging Validation

After packaging, verify the following on a **clean test machine**:

### Installation Test
- [ ] Double-click installer
- [ ] Accept license/prompts
- [ ] Installation completes without errors
- [ ] Desktop shortcut created
- [ ] Start Menu entry created

### First Launch Test
- [ ] App opens without errors
- [ ] Default database created
- [ ] Default user created
- [ ] No console errors (press F12)

### Basic Workflow Test
1. [ ] Create project "Test Project 001"
2. [ ] Add location "Panel 1"
3. [ ] Import sample CSV
4. [ ] Export to Eplan XML
5. [ ] Close and reopen app
6. [ ] Verify project still exists

### Uninstall Test
- [ ] Uninstall via Control Panel
- [ ] Verify app removed
- [ ] Database preserved (or delete if desired)
- [ ] No orphaned files in Program Files

---

## 📦 Distribution Checklist

Before distributing to trial users:

- [ ] Installer tested on clean Windows 10 machine
- [ ] Installer tested on clean Windows 11 machine
- [ ] Sample import files included
- [ ] User guide/quick start created
- [ ] Release notes finalized
- [ ] Support contact information provided
- [ ] Feedback collection method established
- [ ] Trial period communicated (if applicable)
- [ ] Update mechanism tested (if applicable)

---

## 🎯 Success Criteria for Trial

Define what success looks like:
- [ ] Users can install without assistance
- [ ] Users can create and manage BOMs
- [ ] Users can import external data
- [ ] Users can export to Eplan XML successfully
- [ ] No critical bugs reported in first week
- [ ] Performance acceptable (no complaints about slowness)
- [ ] Positive feedback on UI/UX

---

## 📞 Support Plan

Establish support process:
- **Bug Reports**: [Email/ticketing system]
- **Feature Requests**: [Survey/feedback form]
- **Response Time**: [24 hours/48 hours]
- **Documentation**: [Link to user guide]
- **Updates**: [Weekly/monthly update schedule]

---

**Ready to Package?**

If all items above are complete and tested, you're ready to distribute for trial use!

**Final Command**:
```bash
npm run electron-pack-win
```

**Output**: `dist/BOM Management Framework Setup 1.0.0.exe`
