# BOM Management Framework - Packaging Guide

This guide explains how to package your BOM Management Framework as a distributable desktop application using Electron.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- All dependencies installed (`npm install`)

### Build for Development
```bash
# Run in development mode with Electron
npm run electron-dev
```

### Build for Distribution
```bash
# Build for current platform
npm run electron-pack

# Build for all platforms
npm run dist-all

# Platform-specific builds
npm run electron-pack-win    # Windows
npm run electron-pack-mac    # macOS  
npm run electron-pack-linux  # Linux
```

## 📦 Distribution Files

After building, you'll find executables in the `dist/` directory:

### Windows
- `BOM Management Framework Setup x.x.x.exe` - Installer
- `BOM Management Framework x.x.x.exe` - Portable version

### macOS
- `BOM Management Framework-x.x.x.dmg` - Disk image installer
- `BOM Management Framework.app` - Application bundle

### Linux
- `BOM Management Framework-x.x.x.AppImage` - Portable AppImage
- `bom-management-framework_x.x.x_amd64.deb` - Debian package

## 🛠️ Configuration

### Package Configuration
The packaging configuration is in `package.json` under the `build` section:

```json
{
  "build": {
    "appId": "com.company.bom-management-framework",
    "productName": "BOM Management Framework",
    "directories": {
      "output": "dist"
    },
    "files": [
      "build/**/*",
      "node_modules/**/*",
      "public/electron.js",
      "public/preload.js",
      "public/splash.html",
      "db/**/*",
      "prisma/**/*"
    ],
    "extraResources": [
      {
        "from": "db",
        "to": "db"
      }
    ]
  }
}
```

### Customization Options

#### App Information
- Update `appId` with your company's reverse domain name
- Change `productName` to customize the application name
- Modify version in `package.json`

#### Icons
- Add `public/icon.ico` for Windows
- Add `public/icon.icns` for macOS  
- Add `public/icon.png` for Linux (512x512px recommended)

#### Installer Options
- Windows: NSIS installer with custom options
- macOS: DMG with code signing support
- Linux: AppImage and DEB packages

## 🔧 Build Process

### Step 1: Build Next.js App
```bash
npm run build
```
This creates a static build in the `build/` directory.

### Step 2: Package with Electron Builder
```bash
electron-builder
```
This packages the app with the specified configuration.

### Step 3: Distribute
The resulting files in `dist/` are ready for distribution.

## 📋 Platform-Specific Notes

### Windows
- Requires Windows 10 or later
- Includes both installer and portable versions
- Auto-updater support can be added

### macOS
- Requires macOS 10.15 or later
- Code signing requires Apple Developer account
- Notarization recommended for distribution

### Linux
- Tested on Ubuntu 20.04+ and CentOS 8+
- AppImage works on most Linux distributions
- DEB package for Debian/Ubuntu systems

## 🔐 Security Considerations

### Code Signing (Optional but Recommended)
```bash
# macOS
electron-builder --mac --publish=never --identity="Developer ID Application: Your Name"

# Windows (requires certificate)
electron-builder --win --publish=never --certificateFile="path/to/certificate.p12"
```

### Auto-Updater (Optional)
Configure update server in `package.json`:
```json
{
  "publish": {
    "provider": "github",
    "owner": "your-username",
    "repo": "bom-management-framework"
  }
}
```

## 🚨 Troubleshooting

### Common Issues

#### Build Fails
- Ensure all dependencies are installed
- Check Node.js version (18+ required)
- Verify `next build` completes successfully

#### Large File Size
- Exclude unnecessary files in `build.files`
- Use `npm prune --production` before building
- Consider asset optimization

#### Database Issues
- SQLite database is included in `extraResources`
- Database permissions are handled automatically
- Database location: App data directory

#### Icon Missing
- Add platform-specific icons to `public/` directory
- Use PNG for Linux, ICO for Windows, ICNS for macOS
- Recommended size: 512x512px

### Debug Mode
Run in development to debug issues:
```bash
npm run electron-dev
```

## 📱 Distribution Methods

### Direct Distribution
- Upload executables to file sharing service
- Include installation instructions
- Provide support contact information

### App Stores (Optional)
- Microsoft Store (Windows)
- Mac App Store (macOS)
- Snap Store (Linux)

### Enterprise Distribution
- Windows Group Policy
- macOS MDM solutions
- Linux package repositories

## 🔄 Updates

### Manual Updates
Users download and install new versions manually.

### Auto-Updates (Optional)
Configure automatic updates using electron-updater:
```bash
npm install electron-updater
```

## 📊 Analytics (Optional)

Add usage analytics to understand adoption:
```bash
npm install @electron/remote
```

## 🎯 Best Practices

1. **Test on all target platforms** before distribution
2. **Sign your applications** for better security
3. **Include documentation** with the distributable
4. **Provide support channels** for users
5. **Version management** - use semantic versioning
6. **Backup configuration** before major updates

## 📞 Support

For packaging issues:
1. Check the [Electron Builder documentation](https://www.electron.build/)
2. Review the [troubleshooting guide](https://www.electron.build/troubleshooting)
3. Check GitHub issues for similar problems

## 🎉 Ready to Distribute!

Once you've successfully built your application, you're ready to distribute your BOM Management Framework to users. The application includes:

- ✅ Standalone desktop application
- ✅ Local SQLite database
- ✅ No external dependencies required
- ✅ Cross-platform compatibility
- ✅ Professional installer experience

Your users can now run the BOM Management Framework locally without needing to install Node.js or any development tools!