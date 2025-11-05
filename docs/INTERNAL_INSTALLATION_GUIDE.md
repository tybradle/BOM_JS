# BOM Management Framework - Internal Installation Guide

**Version:** 1.0.0  
**Date:** November 5, 2025  
**Target:** ATS Internal Users

---

## 📦 Installation Methods

### Method 1: Direct Execution (Recommended for Testing)

1. **Locate the Application**
   - Find the unpacked application folder: `dist\win-unpacked\`
   - Executable: `BOM Management Framework.exe`

2. **First Run**
   - Double-click `BOM Management Framework.exe`
   - **Windows Security Warning:** You will see "Windows protected your PC"
     - Click **"More info"**
     - Click **"Run anyway"**
   - This warning only appears once per installation location

3. **Create Shortcut (Optional)**
   - Right-click `BOM Management Framework.exe`
   - Select **"Send to"** → **"Desktop (create shortcut)"**

---

### Method 2: Full Installation (Recommended for Production)

1. **Run Installer**
   - Locate: `dist\BOM Management Framework Setup 1.0.0.exe`
   - Double-click to start installation wizard
   - **Windows Security Warning:** Same as Method 1 (click "More info" → "Run anyway")

2. **Installation Steps**
   - Choose installation directory (default: `C:\Program Files\BOM Management Framework`)
   - Select "Create desktop shortcut" (recommended)
   - Click **"Install"**

3. **Launch Application**
   - Use desktop shortcut or Start Menu
   - First launch will take ~5-10 seconds (copying static assets)
   - Subsequent launches: ~2-3 seconds

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Windows protected your PC" Warning

**Cause:** Application is not code-signed (common for internal tools)

**Solution:**
1. Click **"More info"** link
2. Click **"Run anyway"** button
3. Warning will not appear again for this application

---

### Issue 2: Antivirus Blocks Application

**Cause:** Some antivirus software flags unsigned executables

**Solution:**
1. Add exception in your antivirus:
   - File: `BOM Management Framework.exe`
   - Folder: Installation directory
2. Contact IT if you cannot add exceptions

---

### Issue 3: Application Doesn't Start

**Possible Causes & Solutions:**

1. **Port 3002 is in use**
   - Check if another application is using port 3002
   - Close other instances of BOM Framework
   - Restart your computer

2. **Corrupted installation**
   - Uninstall completely
   - Delete folder: `%APPDATA%\bom-management-framework`
   - Reinstall

3. **Missing dependencies**
   - Ensure Windows is up to date
   - Install Visual C++ Redistributables (usually pre-installed)

---

### Issue 4: Slow Startup

**Expected Behavior:**
- **First launch:** 5-10 seconds (copies static files)
- **Subsequent launches:** 2-3 seconds

**If slower than expected:**
1. Check system resources (Task Manager)
2. Check antivirus isn't scanning the app folder
3. Run from SSD instead of network drive if possible

---

## 📍 File Locations

### Application Files
- **Installation:** `C:\Program Files\BOM Management Framework\`
- **User Data:** `%APPDATA%\bom-management-framework\`
- **Database:** `%APPDATA%\bom-management-framework\custom.db`
- **Logs:** `%APPDATA%\bom-management-framework\logs\electron.log`

### Accessing User Data Folder
1. Press `Win + R`
2. Type: `%APPDATA%\bom-management-framework`
3. Press Enter

---

## 🔧 Troubleshooting

### View Log Files

If you encounter issues, check the log file:

1. Press `Win + R`
2. Type: `%APPDATA%\bom-management-framework\logs`
3. Open `electron.log` in Notepad
4. Share last 50 lines with IT support

### Reset Application

To completely reset the application:

1. Uninstall application
2. Delete folder: `%APPDATA%\bom-management-framework`
3. Reinstall
4. **WARNING:** This deletes all your projects and data!

### Backup Your Data

To backup your BOM projects:

1. Open application
2. Click Settings icon (top right)
3. Click **"Database Tools"**
4. Click **"Export Database"**
5. Save to safe location (network drive recommended)

---

## 💻 System Requirements

### Minimum Requirements
- **OS:** Windows 10 or later (64-bit)
- **RAM:** 4 GB
- **Disk Space:** 500 MB free
- **Display:** 1280x800 minimum resolution

### Recommended Requirements
- **OS:** Windows 10/11 (64-bit)
- **RAM:** 8 GB or more
- **Disk Space:** 1 GB free
- **Display:** 1920x1080 or higher

---

## 📞 Support

### Internal Support Contacts
- **Developer:** Tyler Bradley
- **IT Support:** [Your IT Department]
- **Email:** [Support Email]

### Before Contacting Support

1. Check this guide for known issues
2. Try restarting the application
3. Check log file: `%APPDATA%\bom-management-framework\logs\electron.log`
4. Note exact error message or behavior
5. Note when the issue started

### Information to Provide
- Windows version
- Application version (shown in About dialog)
- Steps to reproduce the issue
- Error messages or screenshots
- Contents of log file (last 50 lines)

---

## 🎯 Quick Start Guide

### First Time Use

1. **Launch Application**
   - Desktop shortcut or Start Menu

2. **Create Your First Project**
   - Click **"New Project"** button
   - Enter package name and project number
   - Click **"Create"**

3. **Add Location**
   - Click **"+ New Location"** tab
   - Enter location name (e.g., "Control Panel")

4. **Import BOM Items**
   - Click **"Import"** button
   - Select CSV file
   - Review preview
   - Click **"Import"**

5. **Export to Eplan**
   - Click **"Export"** button
   - Select **"Eplan XML"** format
   - Choose save location
   - Click **"Export"**

---

## 📋 Known Limitations

### Current Version (1.0.0)
- Single user only (no collaboration features)
- Local database (SQLite)
- Windows only
- No auto-update feature

### Performance Notes
- Designed for data-entry/table operations
- Software rendering (GPU disabled for stability)
- Optimized for datasets up to ~5000 items per project

---

## 🔄 Updates

### How to Update

**Manual Update Process:**
1. Export your database (backup!)
2. Uninstall current version
3. Install new version
4. Import your database backup

**Future:** Auto-update feature planned for v1.1

---

## ✅ Installation Verification

After installation, verify everything works:

- [ ] Application launches without errors
- [ ] Can create new project
- [ ] Can add location
- [ ] Can import CSV file
- [ ] Can export XML file
- [ ] Can save and close application
- [ ] Can reopen and see saved data

If all checked, installation successful! 🎉

---

**Document Version:** 1.0  
**Last Updated:** November 5, 2025  
**For:** Internal ATS Use Only
