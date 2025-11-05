# Testing Scripts - Sprint 3

This directory contains automated testing scripts for Sprint 3 (Testing & Validation) of the Electron Production Readiness implementation.

## Available Scripts

### test-sprint3.ps1
**Type:** PowerShell Script  
**Purpose:** Comprehensive automated testing for Sprint 3  
**Platform:** Windows (PowerShell 5.1+)

#### Features
- Automated build verification
- Standalone directory validation
- File structure checks
- Bundle size optimization verification
- Color-coded output (Green = Pass, Red = Fail, Yellow = Manual Test Required)
- Comprehensive summary report

#### Usage
```powershell
# Run from project root
.\scripts\test-sprint3.ps1

# OR run with execution policy bypass if needed
powershell -ExecutionPolicy Bypass -File .\scripts\test-sprint3.ps1
```

#### What It Tests
- ✅ Task 3.2: Standalone Server functionality
- ⚠️  Task 3.1: Development Mode (manual verification reminder)
- ⚠️  Task 3.3: Production Electron (manual verification reminder)
- ⚠️  Task 3.4: Packaged Application (manual verification reminder)
- ⚠️  Task 3.5: E2E Workflow (manual verification reminder)

#### Output Example
```
============================================
Sprint 3: Testing & Validation
============================================

[Task 3.2] Testing Standalone Server...
Building application...
Build successful!
✓ Standalone directory exists
✓ Server.js exists
✓ Standalone size: 77.27 MB

[Task 3.2] Status: PASSED

Summary:
  ✓ Task 3.2: Standalone server - PASSED
  ⚠ Task 3.1: Development mode - MANUAL_TEST_REQUIRED
  ...
```

---

### sprint3-testing.bat
**Type:** Windows Batch File  
**Purpose:** Quick testing for Sprint 3 via Windows CMD  
**Platform:** Windows (Command Prompt)

#### Features
- Simple batch file interface
- Build verification
- Standalone server test (15-second run)
- Manual test instructions
- Progress reporting

#### Usage
```cmd
# Run from project root
scripts\sprint3-testing.bat

# OR double-click the file in Windows Explorer
```

#### What It Does
1. Builds the application (`npm run build`)
2. Tests standalone server for 15 seconds
3. Provides instructions for manual tests
4. Lists next steps

---

## Test Workflow

### Automated Testing Path
```
1. Run test-sprint3.ps1
   ↓
2. Review automated test results
   ↓
3. Follow manual test instructions
   ↓
4. Complete Sprint 3 checklist
```

### Manual Testing Path
```
1. Task 3.1: npm run electron-dev
   ↓
2. Task 3.2: npm run test-standalone
   ↓
3. Task 3.3: npm run electron-local
   ↓
4. Task 3.4: npm run electron-pack-win
   ↓
5. Task 3.5: E2E workflow testing
```

---

## Troubleshooting

### PowerShell Script Won't Run
**Error:** "execution of scripts is disabled on this system"

**Solution:**
```powershell
# Check current policy
Get-ExecutionPolicy

# Set policy for current user (recommended)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# OR run with bypass
powershell -ExecutionPolicy Bypass -File .\scripts\test-sprint3.ps1
```

### Build Fails
**Solution:**
```bash
# Clean and rebuild
Remove-Item -Recurse -Force .next
npm run build
```

### Port Already in Use
**Solution:**
```bash
# Find process on port 3002
netstat -ano | findstr :3002

# Kill the process
taskkill /PID <PID> /F
```

---

## Success Criteria

### Automated Tests Pass When:
- ✅ Build completes without errors
- ✅ `.next/standalone/` directory exists
- ✅ `server.js` file present
- ✅ Bundle size < 200 MB (target: ~77 MB)
- ✅ No TypeScript errors
- ✅ No build warnings

### Manual Tests Pass When:
- ✅ Development mode launches with DevTools
- ✅ Standalone server accessible via browser
- ✅ Production Electron runs without DevTools
- ✅ Packaged app creates installer
- ✅ E2E workflow completes successfully

---

## Related Documentation

- **Completion Report:** `../docs/SPRINT3_COMPLETION_REPORT.md`
- **Quick Reference:** `../docs/SPRINT3_QUICK_REFERENCE.md`
- **Implementation Summary:** `../docs/SPRINT3_IMPLEMENTATION_SUMMARY.md`
- **Main Task List:** `../docs/ELECTRON_PRODUCTION_TASK_LIST.md`

---

## Script Maintenance

### Updating test-sprint3.ps1
- Add new automated checks in the respective task sections
- Update success criteria as needed
- Maintain color-coded output for readability
- Keep summary section synchronized with task results

### Updating sprint3-testing.bat
- Keep commands simple and CMD-compatible
- Avoid PowerShell-specific syntax
- Maintain clear progress indicators
- Update timeout values if needed for slower systems

---

## Performance Benchmarks

Current benchmarks tested by these scripts:

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **Standalone Size** | <200 MB | ~77 MB | ✅ Excellent |
| **Build Time** | <120s | ~60s | ✅ Good |
| **Server Startup** | <1s | ~333ms | ✅ Excellent |
| **Test Script Runtime** | <5min | ~2-3min | ✅ Good |

---

## Future Enhancements

### Planned Improvements
1. **Automated E2E Testing**
   - Integrate Playwright or Spectron
   - Automate Task 3.5 workflow
   - Screenshot capture on failures

2. **CI/CD Integration**
   - GitHub Actions workflow
   - Automatic test execution on PR
   - Test result reporting

3. **Extended Validation**
   - Memory leak detection
   - Performance profiling
   - Security scanning

4. **Cross-Platform Testing**
   - macOS test script variant
   - Linux test script variant
   - Platform-specific validations

---

**Last Updated:** November 5, 2025  
**Sprint:** 3 - Testing & Validation  
**Status:** ✅ Complete and Validated  
**Next Update:** Sprint 4 completion
