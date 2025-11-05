# BOM Management Framework - Deployment Guide

**Document Purpose:** Complete production deployment and packaging guidance  
**Last Updated:** November 5, 2025  
**Deployment Strategy:** Next.js Standalone Mode + Electron (Production Ready)

---

## 🚀 Deployment Overview

The BOM Management Framework is optimized for production deployment as an Electron desktop application using Next.js standalone mode.

### Deployment Strategy: Next.js Standalone Mode ✅
**Implemented:** Sprints 1-3 (November 4-5, 2025)

**Benefits:**
- ✅ **85% size reduction** (77 MB vs 500+ MB)
- ✅ **333ms server startup** (3x faster)
- ✅ **Production optimized** with minimal dependencies
- ✅ **Offline-capable** desktop application

### Deployment Scenarios
1. **Electron Desktop App** (Primary/Recommended)
   - Packaged for Windows, macOS, Linux
   - Fully offline-capable
   - Native OS integration
   - Size: ~150-200 MB installer

2. **Web Application** (Alternative)
   - Standard Next.js deployment
   - Requires server hosting
   - Not recommended for primary use case

3. **Local Development**
   - Hot reload development server
   - Testing and debugging

---

## 📋 Prerequisites

### System Requirements

#### Development Environment
- **Node.js:** 18.x or higher
- **npm:** 9.x or higher
- **Git:** For version control
- **OS:** Windows 10+, macOS 10.15+, Ubuntu 18.04+

#### Production Environment
- **Node.js:** 18.x LTS or higher
- **Memory:** 4GB RAM minimum (8GB recommended)
- **Storage:** 1GB free space (plus database storage)
- **Network:** Internet connection for initial setup

### Required Tools
```bash
# Verify Node.js installation
node --version  # Should be 18.x or higher

# Verify npm installation
npm --version   # Should be 9.x or higher

# Verify Git installation
git --version
```

---

## 🛠️ Environment Configuration

### Environment Variables

#### Development (.env.local)
```env
# Database
DATABASE_URL="file:./db/custom.db"

# Server Configuration
NODE_ENV="development"
PORT=3002

# File Upload Paths
UPLOAD_DIR="./uploads"
TEMP_DIR="./temp"

# Electron Development
ELECTRON_DEV=true
```

#### Production (.env.production)
```env
# Database
DATABASE_URL="file:./db/custom.db"

# Server Configuration
NODE_ENV="production"
PORT=3002

# File Upload Paths (use absolute paths in production)
UPLOAD_DIR="%USERPROFILE%/BOM_SUITE/uploads"
TEMP_DIR="%USERPROFILE%/BOM_SUITE/temp"

# Security
NEXT_TELEMETRY_DISABLED=1

# Performance
ENABLE_CACHE=true
CACHE_SIZE=500
CACHE_TTL=300000
```

### Environment-Aware Configuration
```typescript
// src/lib/env.ts
export const config = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isElectron: typeof window !== 'undefined' && window.process?.type === 'renderer',
  
  database: {
    url: process.env.DATABASE_URL || 'file:./db/custom.db'
  },
  
  paths: {
    uploads: process.env.UPLOAD_DIR || './uploads',
    temp: process.env.TEMP_DIR || './temp'
  },
  
  server: {
    port: parseInt(process.env.PORT || '3002'),
    baseURL: getBaseURL()
  }
}

function getBaseURL(): string {
  if (config.isElectron && config.isProduction) {
    return 'http://localhost:3002'
  }
  return ''
}
```

---

## 🌐 Web Application Deployment

### Build Process

#### 1. Prepare Application
```bash
# Install dependencies
npm install

# Apply database schema
npm run db:push
npm run db:generate

# Run tests
npm test  # If tests exist
```

#### 2. Production Build
```bash
# Build Next.js application
npm run build

# Verify build output
ls -la .next/
```

#### 3. Start Production Server
```bash
# Start production server
npm run start

# Or use PM2 for process management
pm2 start ecosystem.config.js
```

### PM2 Configuration (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'bom-framework',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/bom-framework',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

### Nginx Configuration (Optional)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # File upload size limit
    client_max_body_size 50M;
    
    # Static file caching
    location /_next/static {
        proxy_pass http://localhost:3002;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

---

## 🖥️ Electron Desktop Application

### Build Configuration

#### package.json Scripts
```json
{
  "scripts": {
    "electron-dev": "concurrently \"npm run dev\" \"wait-on http://localhost:3002 && electron .\"",
    "electron-pack": "npm run build && electron-builder",
    "electron-pack-win": "npm run build && electron-builder --win",
    "electron-pack-mac": "npm run build && electron-builder --mac",
    "electron-pack-linux": "npm run build && electron-builder --linux"
  }
}
```

#### electron-builder Configuration
```json
{
  "build": {
    "appId": "com.ats.bom-framework",
    "productName": "BOM Management Framework",
    "directories": {
      "output": "dist"
    },
    "files": [
      ".next/**/*",
      "public/**/*",
      "node_modules/**/*",
      "package.json"
    ],
    "extraResources": [
      {
        "from": "db/",
        "to": "db/"
      }
    ],
    "win": {
      "target": "nsis",
      "icon": "public/icon.png"
    },
    "mac": {
      "target": "dmg",
      "icon": "public/icon.png"
    },
    "linux": {
      "target": "AppImage",
      "icon": "public/icon.png"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}
```

### Build Process

#### Windows Build
```bash
# Install Electron Builder
npm install --save-dev electron-builder

# Build Windows installer
npm run electron-pack-win

# Output: dist/BOM Management Framework Setup 1.0.0.exe
```

#### macOS Build
```bash
# Build macOS app
npm run electron-pack-mac

# Output: dist/BOM Management Framework-1.0.0.dmg
```

#### Linux Build
```bash
# Build Linux AppImage
npm run electron-pack-linux

# Output: dist/BOM Management Framework-1.0.0.AppImage
```

### Code Signing (Optional)

#### Windows Code Signing
```json
{
  "build": {
    "win": {
      "certificateFile": "path/to/certificate.p12",
      "certificatePassword": "password",
      "publisherName": "ATS Automation Tooling Systems Inc"
    }
  }
}
```

#### macOS Code Signing
```bash
# Sign and notarize macOS app
electron-builder --mac --publish=always
```

---

## 🗄️ Database Setup

### SQLite Database

#### Initial Setup
```bash
# Create database directory
mkdir -p db

# Apply schema
npx prisma db push

# Generate Prisma client
npx prisma generate

# (Optional) Seed with sample data
npm run db:seed
```

#### Database Migration
```bash
# After schema changes
npx prisma db push      # Apply changes without migration file
# OR
npx prisma migrate dev  # Create migration file (for production)

# Regenerate client
npx prisma generate
```

#### Database Backup
```bash
# Backup database
cp db/custom.db db/custom.backup.db

# Or use SQLite backup command
sqlite3 db/custom.db ".backup db/custom.backup.db"
```

### Production Database Considerations

#### File Permissions
```bash
# Set appropriate permissions
chmod 644 db/custom.db
chmod 755 db/
```

#### Database Location
```typescript
// Production database path
const getDatabasePath = () => {
  if (process.platform === 'win32') {
    return path.join(process.env.USERPROFILE || '', 'BOM_SUITE', 'custom.db')
  }
  return path.join(process.env.HOME || '', 'BOM_SUITE', 'custom.db')
}
```

---

## 📁 File System Setup

### Directory Structure
```
bom-framework/
├── db/                    # Database files
│   ├── custom.db          # Main database
│   └── custom.backup.db   # Backup database
├── uploads/               # User uploaded files
├── temp/                  # Temporary files
├── logs/                  # Application logs
├── exports/               # Generated export files
└── archives/              # Database archives
```

### Production Directory Creation
```bash
# Create production directories
mkdir -p "%USERPROFILE%/BOM_SUITE/uploads"
mkdir -p "%USERPROFILE%/BOM_SUITE/temp"
mkdir -p "%USERPROFILE%/BOM_SUITE/logs"
mkdir -p "%USERPROFILE%/BOM_SUITE/exports"
mkdir -p "%USERPROFILE%/BOM_SUITE/archives"

# Set permissions
icacls "%USERPROFILE%/BOM_SUITE" /grant Users:(OI)(CI)F
```

### Path Resolution
```typescript
// src/lib/database/paths.ts
import path from 'path'
import os from 'os'

export const paths = {
  // Base directory
  base: process.env.BOM_SUITE_PATH || getDefaultBasePath(),
  
  // Database
  database: () => path.join(getDefaultBasePath(), 'custom.db'),
  
  // Upload directories
  uploads: () => path.join(getDefaultBasePath(), 'uploads'),
  temp: () => path.join(getDefaultBasePath(), 'temp'),
  
  // Export directories
  exports: () => path.join(getDefaultBasePath(), 'exports'),
  archives: () => path.join(getDefaultBasePath(), 'archives'),
  
  // Logs
  logs: () => path.join(getDefaultBasePath(), 'logs')
}

function getDefaultBasePath(): string {
  if (process.platform === 'win32') {
    return process.env.USERPROFILE || path.join(os.homedir(), 'BOM_SUITE')
  }
  return path.join(os.homedir(), 'BOM_SUITE')
}
```

---

## 🔒 Security Configuration

### Environment Security

#### Secure Environment Variables
```bash
# Use .env files for local development
# Use system environment variables for production

# Windows
setx DATABASE_URL "file:./db/custom.db"
setx NODE_ENV "production"

# Linux/macOS
export DATABASE_URL="file:./db/custom.db"
export NODE_ENV="production"
```

#### File Upload Security
```typescript
// src/lib/security/file-validation.ts
export const validateFileUpload = (file: File) => {
  // Allowed MIME types
  const allowedTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
  
  // File size limit (10MB)
  const maxSize = 10 * 1024 * 1024
  
  // File extension validation
  const allowedExtensions = ['.csv', '.xls', '.xlsx']
  const fileExtension = path.extname(file.name).toLowerCase()
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type')
  }
  
  if (file.size > maxSize) {
    throw new Error('File size exceeds limit')
  }
  
  if (!allowedExtensions.includes(fileExtension)) {
    throw new Error('Invalid file extension')
  }
  
  return true
}
```

### Network Security

#### CORS Configuration
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ]
  },
}
```

---

## 📊 Performance Optimization

### Production Build Optimization

#### Next.js Configuration
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  
  // Image optimization
  images: {
    domains: [],
    unoptimized: true
  },
  
  // Build optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react']
  },
  
  // Compression
  compress: true,
  
  // Output configuration
  output: 'standalone'
}

module.exports = nextConfig
```

#### Memory Management
```typescript
// src/lib/performance/memory-manager.ts
export class MemoryManager {
  private static instance: MemoryManager
  private memoryThreshold = 500 * 1024 * 1024 // 500MB
  
  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager()
    }
    return MemoryManager.instance
  }
  
  checkMemoryUsage(): boolean {
    const usage = process.memoryUsage()
    return usage.heapUsed < this.memoryThreshold
  }
  
  forceGarbageCollection(): void {
    if (global.gc) {
      global.gc()
    }
  }
  
  getMemoryStats() {
    return process.memoryUsage()
  }
}
```

### Caching Strategy

#### Production Cache Configuration
```typescript
// src/lib/cache/production-cache.ts
import LRU from 'lru-cache'

export const productionCache = new LRU({
  max: 1000,              // Increased for production
  ttl: 1000 * 60 * 10,   // 10 minutes TTL
  updateAgeOnGet: true,
  sizeCalculation: (value) => JSON.stringify(value).length,
  maxSize: 100 * 1024 * 1024 // 100MB max size
})
```

---

## 🔍 Monitoring and Logging

### Application Logging

#### Winston Configuration
```typescript
// src/lib/logging/logger.ts
import winston from 'winston'

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'bom-framework' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}
```

### Health Monitoring

#### Health Check Endpoint
```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server'
import { performanceMonitor } from '@/lib/performance-monitor'
import { logger } from '@/lib/logging/logger'

export async function GET() {
  try {
    const memory = process.memoryUsage()
    const uptime = process.uptime()
    const stats = performanceMonitor.getStats()
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      memory: {
        used: Math.round(memory.heapUsed / 1024 / 1024),
        total: Math.round(memory.heapTotal / 1024 / 1024),
        external: Math.round(memory.external / 1024 / 1024)
      },
      performance: stats
    })
  } catch (error) {
    logger.error('Health check failed:', error)
    return NextResponse.json(
      { status: 'unhealthy', error: 'Health check failed' },
      { status: 500 }
    )
  }
}
```

---

## 🚨 Troubleshooting

### Common Deployment Issues

#### Port Conflicts
```bash
# Check port usage
netstat -ano | findstr :3002

# Kill process on port
taskkill /PID <PID> /F

# Or use npm script
npm run kill-port
```

#### Database Connection Issues
```bash
# Check database file permissions
ls -la db/custom.db

# Recreate database
rm -f db/custom.db
npm run db:push
npm run db:generate
```

#### Electron Build Issues
```bash
# Clear build cache
rm -rf dist
rm -rf .next

# Rebuild
npm run build
npm run electron-pack
```

### Performance Issues

#### Memory Leaks
```bash
# Monitor memory usage
node --inspect app.js

# Check heap dumps
node --heap-prof app.js
```

#### Slow Database Queries
```typescript
// Enable query logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

// Analyze slow queries
prisma.$on('query', (e) => {
  if (e.duration > 1000) {
    console.log('Slow query detected:', e.query)
    console.log('Duration:', e.duration + 'ms')
  }
})
```

---

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database schema applied
- [ ] Production build successful
- [ ] All tests passing
- [ ] Security scan completed
- [ ] Performance benchmarks met
- [ ] Backup procedures tested
- [ ] Monitoring configured

### Production Deployment
- [ ] Application deployed to server
- [ ] Database initialized
- [ ] File permissions set
- [ ] Services started
- [ ] Health checks passing
- [ ] Load balancer configured (if applicable)
- [ ] SSL certificates installed (if applicable)
- [ ] DNS records updated (if applicable)

### Post-Deployment
- [ ] Application monitoring active
- [ ] Error logging configured
- [ ] Performance metrics collected
- [ ] User acceptance testing completed
- [ ] Documentation updated
- [ ] Backup schedule configured
- [ ] Rollback plan tested

---

## 🔄 Maintenance

### Regular Maintenance Tasks

#### Daily
- [ ] Check application logs for errors
- [ ] Monitor performance metrics
- [ ] Verify backup completion

#### Weekly
- [ ] Review security logs
- [ ] Check disk space usage
- [ ] Update dependencies (if needed)

#### Monthly
- [ ] Security vulnerability scan
- [ ] Performance optimization review
- [ ] Database maintenance (VACUUM, ANALYZE)

### Update Process

#### Application Updates
```bash
# 1. Backup current version
cp -r /opt/bom-framework /opt/bom-framework.backup

# 2. Update code
git pull origin main

# 3. Update dependencies
npm install --production

# 4. Apply database migrations
npm run db:push

# 5. Restart application
pm2 restart bom-framework
```

#### Database Updates
```bash
# 1. Backup database
sqlite3 db/custom.db ".backup db/custom.backup.$(date +%Y%m%d).db"

# 2. Apply schema changes
npx prisma db push

# 3. Verify integrity
sqlite3 db/custom.db "PRAGMA integrity_check;"
```

---

**Status:** ✅ **DEPLOYMENT GUIDE COMPLETE**  
**Last Updated:** November 4, 2025  
**Purpose:** Production deployment and maintenance procedures

---

*This document consolidates information from: PRODUCTION_DEPLOYMENT.md, PRODUCTION_FIXES_SUMMARY.md, ELECTRON_PACKAGING_VERIFICATION.md, PACKAGING_GUIDE.md*