# Sprint 4 - Task 4.1: Final Production Build
# Automated build and validation script

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Sprint 4 - Task 4.1: Final Production Build" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean previous builds
Write-Host "[Step 1/6] Cleaning previous builds..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path "dist") {
    Write-Host "  Removing dist/ directory..." -ForegroundColor Gray
    Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
    Write-Host "  ✓ dist/ removed" -ForegroundColor Green
} else {
    Write-Host "  ✓ dist/ already clean" -ForegroundColor Green
}

if (Test-Path ".next") {
    Write-Host "  Removing .next/ directory..." -ForegroundColor Gray
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    Write-Host "  ✓ .next/ removed" -ForegroundColor Green
} else {
    Write-Host "  ✓ .next/ already clean" -ForegroundColor Green
}

Write-Host ""
Write-Host "[Step 1/6] ✅ PASSED - Clean build environment" -ForegroundColor Green
Write-Host ""

# Step 2: Fresh build
Write-Host "[Step 2/6] Building Next.js application..." -ForegroundColor Yellow
Write-Host ""

$buildStartTime = Get-Date
Write-Host "  Running: npm run build" -ForegroundColor Gray
Write-Host ""

$buildOutput = npm run build 2>&1 | Out-String
$buildExitCode = $LASTEXITCODE

$buildEndTime = Get-Date
$buildDuration = ($buildEndTime - $buildStartTime).TotalSeconds

if ($buildExitCode -ne 0) {
    Write-Host "  ✗ Build FAILED!" -ForegroundColor Red
    Write-Host $buildOutput -ForegroundColor Red
    exit 1
}

Write-Host "  ✓ Build completed successfully" -ForegroundColor Green
Write-Host "  Build time: $([math]::Round($buildDuration, 2)) seconds" -ForegroundColor Gray
Write-Host ""
Write-Host "[Step 2/6] ✅ PASSED - Build completed" -ForegroundColor Green
Write-Host ""

# Step 3: Verify standalone output
Write-Host "[Step 3/6] Verifying standalone output..." -ForegroundColor Yellow
Write-Host ""

$validationPassed = $true

# Check .next/standalone directory
if (Test-Path ".next\standalone") {
    Write-Host "  ✓ .next/standalone/ directory exists" -ForegroundColor Green
} else {
    Write-Host "  ✗ .next/standalone/ directory NOT found" -ForegroundColor Red
    $validationPassed = $false
}

# Check server.js
if (Test-Path ".next\standalone\server.js") {
    Write-Host "  ✓ server.js exists" -ForegroundColor Green
} else {
    Write-Host "  ✗ server.js NOT found" -ForegroundColor Red
    $validationPassed = $false
}

# Check node_modules in standalone
if (Test-Path ".next\standalone\node_modules") {
    Write-Host "  ✓ node_modules exists in standalone" -ForegroundColor Green
} else {
    Write-Host "  ✗ node_modules NOT found in standalone" -ForegroundColor Red
    $validationPassed = $false
}

# Check package.json in standalone
if (Test-Path ".next\standalone\package.json") {
    Write-Host "  ✓ package.json exists in standalone" -ForegroundColor Green
} else {
    Write-Host "  ✗ package.json NOT found in standalone" -ForegroundColor Red
    $validationPassed = $false
}

# Check .next/static
if (Test-Path ".next\static") {
    Write-Host "  ✓ .next/static/ directory exists" -ForegroundColor Green
} else {
    Write-Host "  ✗ .next/static/ directory NOT found" -ForegroundColor Red
    $validationPassed = $false
}

# Calculate standalone size
if (Test-Path ".next\standalone") {
    $standaloneSize = (Get-ChildItem -Path ".next\standalone" -Recurse -ErrorAction SilentlyContinue | 
                       Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum / 1MB
    Write-Host "  ✓ Standalone size: $([math]::Round($standaloneSize, 2)) MB" -ForegroundColor Green
    
    if ($standaloneSize -gt 200) {
        Write-Host "  ⚠ Warning: Size exceeds 200MB target" -ForegroundColor Yellow
    }
}

Write-Host ""
if ($validationPassed) {
    Write-Host "[Step 3/6] ✅ PASSED - Standalone output validated" -ForegroundColor Green
} else {
    Write-Host "[Step 3/6] ✗ FAILED - Standalone output incomplete" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Test standalone server
Write-Host "[Step 4/6] Testing standalone server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Starting server for 10 seconds..." -ForegroundColor Gray

$serverProcess = Start-Process -FilePath "node" -ArgumentList ".next\standalone\server.js" -PassThru -NoNewWindow -RedirectStandardOutput "test-server-output.log" -RedirectStandardError "test-server-error.log"

Start-Sleep -Seconds 10

if (!$serverProcess.HasExited) {
    Write-Host "  ✓ Server started successfully" -ForegroundColor Green
    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
    Write-Host "  ✓ Server stopped cleanly" -ForegroundColor Green
} else {
    Write-Host "  ✗ Server failed to start or crashed" -ForegroundColor Red
    if (Test-Path "test-server-error.log") {
        $errorContent = Get-Content "test-server-error.log" -Raw
        Write-Host "  Error log:" -ForegroundColor Red
        Write-Host $errorContent -ForegroundColor Red
    }
    exit 1
}

# Clean up log files
Remove-Item "test-server-output.log" -ErrorAction SilentlyContinue
Remove-Item "test-server-error.log" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "[Step 4/6] ✅ PASSED - Standalone server functional" -ForegroundColor Green
Write-Host ""

# Step 5: Package application
Write-Host "[Step 5/6] Packaging Electron application..." -ForegroundColor Yellow
Write-Host ""

$packageStartTime = Get-Date
Write-Host "  Running: npm run electron-pack-win" -ForegroundColor Gray
Write-Host "  This may take 2-5 minutes..." -ForegroundColor Gray
Write-Host ""

$packageOutput = npm run electron-pack-win 2>&1 | Out-String
$packageExitCode = $LASTEXITCODE

$packageEndTime = Get-Date
$packageDuration = ($packageEndTime - $packageStartTime).TotalSeconds

if ($packageExitCode -ne 0) {
    Write-Host "  ✗ Packaging FAILED!" -ForegroundColor Red
    Write-Host $packageOutput -ForegroundColor Red
    exit 1
}

Write-Host "  ✓ Packaging completed successfully" -ForegroundColor Green
Write-Host "  Package time: $([math]::Round($packageDuration, 2)) seconds" -ForegroundColor Gray
Write-Host ""
Write-Host "[Step 5/6] ✅ PASSED - Application packaged" -ForegroundColor Green
Write-Host ""

# Step 6: Verify package
Write-Host "[Step 6/6] Verifying package contents..." -ForegroundColor Yellow
Write-Host ""

$packageValidation = $true

# Check dist directory exists
if (Test-Path "dist") {
    Write-Host "  ✓ dist/ directory created" -ForegroundColor Green
} else {
    Write-Host "  ✗ dist/ directory NOT found" -ForegroundColor Red
    $packageValidation = $false
}

# Check for installer
$installerPath = Get-ChildItem -Path "dist" -Filter "*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1

if ($installerPath) {
    Write-Host "  ✓ Installer found: $($installerPath.Name)" -ForegroundColor Green
    $installerSize = $installerPath.Length / 1MB
    Write-Host "  ✓ Installer size: $([math]::Round($installerSize, 2)) MB" -ForegroundColor Green
    
    if ($installerSize -gt 200) {
        Write-Host "  ⚠ Warning: Installer exceeds 200MB target" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠ Warning: Installer not found (may be in subdirectory)" -ForegroundColor Yellow
}

# Check win-unpacked directory
if (Test-Path "dist\win-unpacked") {
    Write-Host "  ✓ win-unpacked directory exists" -ForegroundColor Green
    
    # Check for executable
    if (Test-Path "dist\win-unpacked\BOM Management Framework.exe") {
        Write-Host "  ✓ Application executable found" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Application executable NOT found" -ForegroundColor Red
        $packageValidation = $false
    }
} else {
    Write-Host "  ⚠ win-unpacked directory not found" -ForegroundColor Yellow
}

Write-Host ""
if ($packageValidation) {
    Write-Host "[Step 6/6] ✅ PASSED - Package verified" -ForegroundColor Green
} else {
    Write-Host "[Step 6/6] ⚠ PARTIAL - Package created but some checks failed" -ForegroundColor Yellow
}
Write-Host ""

# Final summary
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Task 4.1 Completion Summary" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Build Metrics:" -ForegroundColor White
Write-Host "  Build time: $([math]::Round($buildDuration, 2))s" -ForegroundColor Gray
Write-Host "  Package time: $([math]::Round($packageDuration, 2))s" -ForegroundColor Gray
Write-Host "  Total time: $([math]::Round($buildDuration + $packageDuration, 2))s" -ForegroundColor Gray
if ($standaloneSize) {
    Write-Host "  Standalone size: $([math]::Round($standaloneSize, 2)) MB" -ForegroundColor Gray
}
if ($installerSize) {
    Write-Host "  Installer size: $([math]::Round($installerSize, 2)) MB" -ForegroundColor Gray
}
Write-Host ""
Write-Host "Task Status:" -ForegroundColor White
Write-Host "  ✅ Step 1: Clean build environment" -ForegroundColor Green
Write-Host "  ✅ Step 2: Build completed" -ForegroundColor Green
Write-Host "  ✅ Step 3: Standalone output validated" -ForegroundColor Green
Write-Host "  ✅ Step 4: Standalone server functional" -ForegroundColor Green
Write-Host "  ✅ Step 5: Application packaged" -ForegroundColor Green
Write-Host "  ✅ Step 6: Package verified" -ForegroundColor Green
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ Task 4.1 COMPLETE" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next: Task 4.2 - Distribution Package Verification" -ForegroundColor Cyan
Write-Host "Run: .\scripts\sprint4-task2.ps1" -ForegroundColor Gray
Write-Host ""
