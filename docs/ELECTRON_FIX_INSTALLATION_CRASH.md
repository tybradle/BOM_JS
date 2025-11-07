# Electron Packaging Fix - Installation Crash Issue

## Problem
The installed Windows version of the BOM Management Framework was crashing after the splash screen, while the unpacked version worked fine.

## Root Cause
The issue was caused by the production build using the default Next.js standalone server (`/.next/standalone/server.js`) which does NOT include the Socket.IO integration from our custom `server.ts`. The app expected Socket.IO endpoints at `/api/socketio` but they weren't available, causing the crash.

## Solution Implemented

### 1. Created Custom Server Build Script
- **File**: `scripts/build-server.js`
- **Purpose**: Compiles `server.ts` into a production-ready `dist-server/server.js` using esbuild
- **Features**:
  - Bundles the custom Next.js + Socket.IO server
  - Excludes external dependencies (Prisma, Sharp, Next.js internals)
  - Creates sourcemaps for debugging
  - Output: `dist-server/server.js`

### 2. Updated Build Process
- **File**: `package.json`
- **Changes**:
  - Added `build:server` script that runs `scripts/build-server.js`
  - Modified `electron-pack` and `electron-pack-win` to run `build:server` after `build`
  - Added `esbuild` as a dev dependency
  - Updated `files` array in `build` config to include:
    - `dist-server/**/*` (compiled custom server)
    - `node_modules/@prisma/**/*` (Prisma Client runtime)
    - `node_modules/.prisma/**/*` (Prisma generated files)

### 3. Updated Electron Startup Logic
- **File**: `public/electron.js`
- **Changes**:
  - Modified `startServer()` function to prioritize custom compiled server
  - Fallback hierarchy:
    1. Try `dist-server/server.js` (custom server with Socket.IO) - **PREFERRED**
    2. Fall back to `.next/standalone/server.js` (basic Next.js server) - **FALLBACK**
  - Added logging to show which server is being used
  - Updated path resolution for both packaged and local electron modes

## Testing Steps

### Step 1: Install esbuild
```cmd
npm install
```

### Step 2: Test the Build Script
```cmd
npm run build:server
```

**Expected Output:**
- Console should show: `✓ Server build completed successfully`
- Directory `dist-server/` should be created with `server.js` and `server.js.map`

### Step 3: Verify Server Build
Check that the compiled server exists:
```cmd
dir dist-server
```

You should see:
- `server.js` (the bundled server)
- `server.js.map` (sourcemap)

### Step 4: Build and Package for Windows
```cmd
npm run electron-pack-win
```

**Expected Output:**
- Next.js build completes
- Server build script runs and completes
- Electron builder packages the app
- Output in `dist/` directory

### Step 5: Test the Installed Version
1. Navigate to `dist/` directory
2. Find the installer (`.exe` file)
3. Run the installer
4. Launch the installed application
5. **Expected Behavior:**
   - Splash screen appears
   - After a few seconds, main window opens
   - App loads successfully without crashing
   - Check the logs to confirm custom server is being used

### Step 6: Verify Logs
**Location of logs:**
- Windows: `%APPDATA%/bom-management-framework/logs/electron.log`

**Expected log entries:**
```
=== ELECTRON STARTING ===
Checking for custom compiled server at: [path]/dist-server/server.js
✓ Found custom server (with Socket.IO support)
Starting server: [path]/dist-server/server.js
Server stdout: > Ready on http://127.0.0.1:3002
Server ready signal detected
```

### Step 7: Test Socket.IO Functionality
Once the app is running:
1. Open DevTools (F12)
2. Check Console for Socket.IO connection messages
3. Try importing/exporting data (uses Socket.IO for progress updates)
4. Verify no errors related to `/api/socketio` endpoint

## Troubleshooting

### If build:server fails:
- Check that esbuild is installed: `npm list esbuild`
- Try manual install: `npm install --save-dev esbuild`

### If the app still crashes:
1. Check the electron log file (see path above)
2. Look for error messages about:
   - "Custom server not found" → Server wasn't bundled correctly
   - "Server process exited with code X" → Server failed to start
   - Module errors → Missing dependencies

### If Socket.IO doesn't work:
1. Verify `dist-server/server.js` exists in the packaged app
2. Check logs to confirm custom server is being used (not standalone)
3. Test the unpacked version first: `dist/win-unpacked/BOM Management Framework.exe`

## Rollback Plan
If this fix doesn't work, you can revert by:
1. Remove the `build:server` script from package.json
2. Remove `dist-server/**/*` from the `files` array
3. Restore the original `electron.js` startServer function

## Files Modified
1. `package.json` - Added build:server script, updated electron-pack scripts, added esbuild dependency
2. `public/electron.js` - Updated startServer() to use compiled custom server
3. `scripts/build-server.js` - NEW FILE - Server compilation script

## Next Steps After Testing
1. If successful, document the new build process in PACKAGING_GUIDE.md
2. Update CI/CD pipelines to include `npm run build:server`
3. Consider adding a health check endpoint to verify Socket.IO is running
