# Electron Packaging Debug Session - November 7, 2025

## Initial Problem
When running `npm run electron-pack-win`, the build succeeded but the packaged application failed to run correctly on first installation, showing multiple errors across different stages of debugging.

## Error Progression & Solutions

### Issue 1: tsx Dependency Scanning Error
**Error:**
```
ENOENT: no such file or directory, scandir 'node_modules\tsx\node_modules\@esbuild\aix-ppc64'
```

**Root Cause:**
- `tsx` was incorrectly placed in `dependencies` instead of `devDependencies`
- electron-builder was trying to scan and package tsx's platform-specific esbuild binaries
- The `beforePack` hook wasn't executing due to incorrect export format

**Solution:**
1. Fixed `scripts/electron-builder-hook.js` export format:
   - Changed `exports.default` → `module.exports`
2. Moved `tsx` from `dependencies` to `devDependencies` in `package.json`
3. beforePack hook now properly hides 11 dev dependencies during packaging

**Commit:** 46a8f3e - "Fix electron-builder tsx scanning error: move tsx to devDependencies"

---

### Issue 2: TypeScript Installation Prompt on First Run
**Error:**
```
Installing devDependencies (npm): - typescript
```

**Root Cause:**
- `next.config.ts` (TypeScript config file) caused Next.js to attempt installing TypeScript at runtime
- This only happened on first run in production environment

**Solution:**
- Converted `next.config.ts` to `next.config.js` (JavaScript)
- Removed type imports, used JSDoc `@type` comment instead
- Changed `export default` to `module.exports`

---

### Issue 3: Prisma Client MODULE_NOT_FOUND
**Error:**
```
Error: Cannot find module '.prisma/client/default'
```

**Root Cause:**
- Prisma Client generates code at build time in `node_modules/.prisma/` and `node_modules/@prisma/client/`
- These generated folders weren't being copied by electron-builder
- electron-builder's auto-detection doesn't handle Prisma's unusual structure

**Solution:**
- Added Prisma folders as `extraResources` in `package.json`:
  ```json
  "extraResources": [
    {
      "from": "node_modules/.prisma",
      "to": "node_modules/.prisma"
    },
    {
      "from": "node_modules/@prisma/client",
      "to": "node_modules/@prisma/client"
    }
  ]
  ```

---

### Issue 4: DATABASE_URL Environment Variable Not Found
**Error:**
```
Environment variable not found: DATABASE_URL
```

**Root Cause:**
- `.env` file wasn't being packaged with the application
- Prisma needs `DATABASE_URL` to connect to the database

**Partial Solution:**
- Added `.env` to the `files` array in `package.json`
- This allowed Prisma to read the environment variable, but revealed the next issue

---

### Issue 5: Unable to Open Database File
**Error:**
```
Error code 14: Unable to open the database file
```

**Root Cause:**
- The `.env` file contained a relative path: `DATABASE_URL="file:./db/custom.db"`
- In production, the database should be at `C:\Users\tybradley\BOM_SUITE\custom.db` (NOT in a `db` subfolder)
- The working directory in packaged Electron apps differs from development
- No database file existed at the production location

**Solution:**
1. Modified `public/electron.js` to set `DATABASE_URL` programmatically:
   ```javascript
   const bomSuiteDir = 'C:\\Users\\tybradley\\BOM_SUITE'
   const dbPath = path.join(bomSuiteDir, 'custom.db')
   
   // Create the BOM_SUITE directory if it doesn't exist
   if (!fs.existsSync(bomSuiteDir)) {
     fs.mkdirSync(bomSuiteDir, { recursive: true })
   }
   
   process.env.DATABASE_URL = `file:${dbPath}`
   ```

2. Copied existing development database to production location:
   ```powershell
   Copy-Item ".\prisma\db\custom.db" "C:\Users\tybradley\BOM_SUITE\custom.db"
   ```

**Commit:** 7ec6b64 - "Fix Electron production database path and packaging"

---

## Final Configuration

### package.json Changes
```json
{
  "dependencies": {
    // tsx removed from here
  },
  "devDependencies": {
    "tsx": "^4.20.3"  // Moved here
  },
  "build": {
    "asar": false,
    "files": [
      "!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}",
      "!**/{.git,.hg,.svn,CVS,RCS,SCCS,__pycache__,thumbs.db,.DS_Store,Thumbs.db,.gitignore,.gitattributes}",
      "!**/{appveyor.yml,.travis.yml,circle.yml,.eslintrc,.eslintrc.json}",
      "!**/{README,readme,LICENSE,license,CHANGELOG,changelog,CONTRIBUTING}",
      "!**/._*",
      ".next/**/*",
      "dist-server/**/*",
      "public/**/*",
      "db/**/*",
      "prisma/**/*",
      "next.config.js",
      ".env"
    ],
    "extraResources": [
      {
        "from": ".next/static",
        "to": ".next/static"
      },
      {
        "from": "public",
        "to": "public"
      },
      {
        "from": "node_modules/.prisma",
        "to": "node_modules/.prisma"
      },
      {
        "from": "node_modules/@prisma/client",
        "to": "node_modules/@prisma/client"
      }
    ],
    "beforePack": "./scripts/electron-builder-hook.js"
  }
}
```

### electron.js Production Database Path
- **Development:** `./db/custom.db` (relative to project root)
- **Production:** `C:\Users\tybradley\BOM_SUITE\custom.db` (user data directory)
- Database directory is created automatically if it doesn't exist
- DATABASE_URL is set before server loads, so Prisma can connect immediately

---

## Verification

### Successful Launch Indicators
```
=== ELECTRON STARTING ===
DATABASE_URL set to: file:C:\Users\tybradley\BOM_SUITE\custom.db
Server module loaded successfully
> Ready on http://127.0.0.1:3002
> Socket.IO server running at ws://127.0.0.1:3002/api/socketio

prisma:query SELECT `main`.`User`.`id`, ... FROM `main`.`User` WHERE 1=1 LIMIT ? OFFSET ?
prisma:query INSERT INTO `main`.`User` ... 
prisma:query SELECT `main`.`BOMProject`.`id`, ... FROM `main`.`BOMProject` ...
```

### Key Success Metrics
- ✅ No TypeScript installation prompt on first run
- ✅ Prisma Client loads without MODULE_NOT_FOUND errors
- ✅ Database connection established successfully
- ✅ Prisma queries execute (SELECT, INSERT work correctly)
- ✅ Default user auto-created if none exists
- ✅ Projects fetched and displayed
- ✅ Window opens and shows content

---

## Lessons Learned

1. **Dev Dependencies Matter**: Tools like `tsx`, `esbuild`, and `typescript` should NEVER be in production dependencies for Electron apps, as electron-builder will try to package them unnecessarily.

2. **Prisma Requires Special Handling**: Prisma's generated code structure (`.prisma/` and `@prisma/client/`) doesn't follow standard npm package conventions, requiring explicit `extraResources` configuration.

3. **Config File Extensions Matter**: Using TypeScript config files (`next.config.ts`) in production can trigger unexpected runtime dependency installation. Prefer JavaScript config files for production builds.

4. **Environment Variables in Packaged Apps**: `.env` files work differently in packaged Electron apps. For critical values like database paths, set them programmatically in the main process before loading the server.

5. **Database Location Strategy**: Production databases should be in user data directories (not in app installation directory) to:
   - Persist across app updates
   - Avoid permissions issues
   - Follow platform conventions

6. **beforePack Hook Gotchas**: Export format matters - use `module.exports` not `exports.default` for electron-builder hooks.

---

## Architecture Notes

This project has a complex stack that contributes to packaging challenges:
- **Next.js 15** (web framework) running in Electron (desktop)
- **Custom server.ts** with Socket.IO (not standard Next.js server)
- **Prisma ORM** with SQLite (code generation at build time)
- **ASAR disabled** (required for Next.js file access)
- **Server runs in main process** (not spawned as child process)

The complexity comes from combining:
1. Web framework designed for server deployment
2. Desktop packaging designed for simple apps
3. ORM with build-time code generation
4. Real-time features requiring custom server

Future v2.0 consideration: Evaluate simpler alternatives like Tauri + REST API, or pure Electron without Next.js.

---

## Related Documentation
- See `docs/DEPLOYMENT_GUIDE.md` for database path configuration
- See `docs/DATABASE_MANAGEMENT.md` for BOM_SUITE directory structure
- See `PACKAGING_GUIDE.md` for electron-builder configuration details
- See `.github/copilot-instructions.md` for project architecture overview
