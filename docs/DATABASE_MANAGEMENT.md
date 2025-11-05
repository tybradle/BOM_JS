# BOM Management Framework - Database Management

**Document Purpose:** Database operations, import/export procedures, and maintenance  
**Last Updated:** November 4, 2025

---

## 🗄️ Database Overview

### Database Technology
- **Engine:** SQLite 3.x
- **ORM:** Prisma 6.x
- **Location:** File-based for portability
- **Default Path:** `db/custom.db` (development) or `%USERPROFILE%/BOM_SUITE/custom.db` (production)

### Database Schema
```sql
-- Core Tables
BOMProject        -- Project metadata and configuration
Location          -- Physical/logical locations within projects  
BOMItem           -- Individual BOM components with specifications
MasterPart         -- Centralized parts database
BOMExport         -- Export history and tracking
UserSettings      -- Application preferences (JSON storage)

-- Relationships
BOMProject (1) ──── (N) Location
Location (1) ──── (N) BOMItem
BOMProject (1) ──── (N) BOMExport
MasterPart (standalone) -- Referenced by BOMItem
```

---

## 📁 Database Operations

### Schema Management

#### Apply Schema Changes
```bash
# Apply changes without migration file (recommended for development)
npx prisma db push

# Generate Prisma client after schema changes
npx prisma generate

# View current schema
npx prisma db pull
```

#### Database Migration (Production)
```bash
# Create migration file
npx prisma migrate dev --name <migration-name>

# Apply migration in production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

#### Schema Validation
```bash
# Validate schema against database
npx prisma db validate

# Check for migration drift
npx prisma migrate status
```

### Database Initialization

#### Fresh Database Setup
```bash
# Create database directory
mkdir -p db

# Apply schema
npx prisma db push

# Generate client
npx prisma generate

# (Optional) Seed with sample data
npm run db:seed
```

#### Production Database Setup
```bash
# Create production directory structure
mkdir -p "%USERPROFILE%/BOM_SUITE/db"

# Set appropriate permissions
icacls "%USERPROFILE%/BOM_SUITE" /grant Users:(OI)(CI)F

# Initialize database
npx prisma db push
npx prisma generate
```

---

## 📥 Database Import Procedures

### Master Parts Import

#### XML File Import (Recommended)
```bash
# Import from Eplan PartsManagement XML
curl -X POST http://localhost:3002/api/parts/import \
  -F "file=@parts.xml" \
  -F "clearExisting=false"

# Response format
{
  "success": true,
  "summary": {
    "totalParsed": 55190,
    "imported": 50000,
    "updated": 5190,
    "errors": 0,
    "duration": "15.91s"
  }
}
```

#### JSON Import (Testing)
```bash
# Import from JSON array
curl -X POST http://localhost:3002/api/parts/import \
  -H "Content-Type: application/json" \
  -d '{
    "parts": [
      {
        "partNumber": "TEST-001",
        "manufacturer": "Test Mfr",
        "description": "Test Part",
        "unitPrice": 10.50
      }
    ],
    "clearExisting": false
  }'
```

#### Import Validation
```typescript
// Before import, validate XML structure
const validatePartsXML = (filePath: string) => {
  const parser = sax.parser(true)
  let partCount = 0
  let errors = []
  
  parser.onopentag = (node) => {
    if (node.name === 'Part') partCount++
  }
  
  parser.onerror = (error) => {
    errors.push(error.message)
  }
  
  // Parse file synchronously for validation
  const content = fs.readFileSync(filePath, 'utf8')
  parser.write(content).close()
  
  return {
    isValid: errors.length === 0,
    partCount,
    errors
  }
}
```

### BOM Data Import

#### CSV/Excel Import
```bash
# Import BOM items to specific location
curl -X POST http://localhost:3002/api/projects/[projectId]/items/import \
  -F "file=@bom-data.csv" \
  -F "locationId=location-id" \
  -F "addToDatabase=true"
```

#### Import Preview Workflow
1. **File Upload:** User selects CSV/Excel file
2. **Parsing:** File parsed with header normalization
3. **Validation:** Required fields checked, duplicates detected
4. **Database Check:** Missing parts identified
5. **Preview:** Color-coded table with validation results
6. **Import:** Valid items imported, missing parts added to database

---

## 📤 Database Export Procedures

### Database Backup

#### Web Application Export
```bash
# Export database as ZIP archive
curl -X GET http://localhost:3002/api/database/export \
  -o database-backup.zip

# Response includes:
# - custom.db (SQLite database file)
# - metadata.json (export timestamp, version, record counts)
```

#### Electron Desktop Export
```typescript
// Native file save in Electron
const exportDatabase = async () => {
  if (window.electronAPI) {
    // Show native save dialog
    const { filePath, canceled } = await window.electronAPI.showSaveDialog({
      title: 'Export Database',
      defaultPath: 'bom-database-backup.zip',
      filters: [
        { name: 'ZIP Archives', extensions: ['zip'] }
      ]
    })
    
    if (!canceled && filePath) {
      // Get database content from API
      const response = await fetch('/api/database/export')
      const blob = await response.blob()
      const buffer = await blob.arrayBuffer()
      
      // Write file using Electron API
      const result = await window.electronAPI.writeFile(filePath, buffer)
      
      if (result.success) {
        toast.success(`Database exported to ${filePath}`)
      } else {
        toast.error(`Export failed: ${result.error}`)
      }
    }
  } else {
    // Web fallback - blob download
    window.open('/api/database/export')
  }
}
```

### Automated Backups

#### Backup Script
```typescript
// scripts/backup-database.ts
import fs from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import AdmZip from 'adm-zip'

const backupDatabase = async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = process.env.BACKUP_DIR || './backups'
  const dbPath = './db/custom.db'
  
  // Create backup directory
  await fs.promises.mkdir(backupDir, { recursive: true })
  
  // Create ZIP archive
  const zip = new AdmZip()
  zip.addLocalFile(dbPath, 'custom.db')
  
  // Add metadata
  const metadata = {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    checksum: createHash('md5').update(fs.readFileSync(dbPath)).digest('hex'),
    recordCounts: await getRecordCounts()
  }
  zip.addFile('metadata.json', JSON.stringify(metadata, null, 2))
  
  // Write backup file
  const backupPath = path.join(backupDir, `bom-backup-${timestamp}.zip`)
  zip.writeZip(backupPath)
  
  console.log(`Database backed up to: ${backupPath}`)
  
  // Cleanup old backups (keep last 10)
  await cleanupOldBackups(backupDir, 10)
}

const getRecordCounts = async () => {
  const db = getPrismaClient()
  return {
    projects: await db.bOMProject.count(),
    locations: await db.location.count(),
    bomItems: await db.bOMItem.count(),
    masterParts: await db.masterPart.count(),
    exports: await db.bOMExport.count()
  }
}
```

#### Scheduled Backup (Windows Task Scheduler)
```batch
@echo off
cd /d "C:\path\to\bom-framework"
node scripts/backup-database.ts
```

---

## 🔧 Database Maintenance

### Performance Optimization

#### Database Indexing
```sql
-- Check current indexes
PRAGMA index_list('custom.db');

-- Analyze query performance
EXPLAIN QUERY PLAN SELECT * FROM BOMItem WHERE locationId = 'xxx' AND partNumber LIKE '%test%';

-- Rebuild indexes
REINDEX;

-- Analyze table statistics
ANALYZE;
```

#### Database Vacuuming
```bash
# Run VACUUM to optimize database
sqlite3 db/custom.db "VACUUM;"

# Check database integrity
sqlite3 db/custom.db "PRAGMA integrity_check;"

# Get database size
sqlite3 db/custom.db ".schema" | wc -c
```

#### Cache Management
```typescript
// Clear search cache after database changes
export const clearSearchCache = () => {
  searchCache.clear()
  performanceMonitor.resetCacheStats()
  console.log('Search cache cleared')
}

// Call after bulk operations
await importBOMItems(data)
clearSearchCache()
```

### Data Cleanup

#### Orphaned Records Cleanup
```typescript
// Remove orphaned BOM items
const cleanupOrphanedItems = async () => {
  const db = getPrismaClient()
  
  // Find items with invalid locations
  const orphanedItems = await db.bOMItem.findMany({
    where: {
      location: null
    }
  })
  
  if (orphanedItems.length > 0) {
    await db.bOMItem.deleteMany({
      where: {
        id: { in: orphanedItems.map(item => item.id) }
      }
    })
    console.log(`Cleaned up ${orphanedItems.length} orphaned BOM items`)
  }
}
```

#### Export History Cleanup
```typescript
// Remove old export records (keep last 90 days)
const cleanupExportHistory = async () => {
  const db = getPrismaClient()
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 90)
  
  const deleted = await db.bOMExport.deleteMany({
    where: {
      createdAt: { lt: cutoffDate }
    }
  })
  
  console.log(`Cleaned up ${deleted.count} old export records`)
}
```

---

## 📊 Database Monitoring

### Performance Metrics

#### Query Performance Monitoring
```typescript
// Monitor slow queries
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' },
    { emit: 'event', level: 'error' },
  ],
})

prisma.$on('query', (e) => {
  if (e.duration > 200) {
    console.log('Slow Query Detected:')
    console.log('Query:', e.query)
    console.log('Duration:', e.duration + 'ms')
    console.log('Timestamp:', e.timestamp)
    
    // Log to file for analysis
    fs.appendFileSync('logs/slow-queries.log', 
      `${new Date().toISOString()} - ${e.duration}ms - ${e.query}\n`
    )
  }
})
```

#### Database Size Monitoring
```typescript
// Monitor database size and growth
const monitorDatabaseSize = () => {
  const dbPath = getDatabasePath()
  const stats = fs.statSync(dbPath)
  const sizeInMB = stats.size / 1024 / 1024
  
  console.log(`Database size: ${sizeInMB.toFixed(2)} MB`)
  
  // Alert if database gets too large
  if (sizeInMB > 500) {
    console.warn('Database size exceeds 500MB - consider archiving')
  }
  
  return {
    size: stats.size,
    sizeInMB,
    lastModified: stats.mtime
  }
}
```

### Health Checks

#### Database Health Endpoint
```typescript
// src/app/api/database/health/route.ts
export async function GET() {
  try {
    const db = getPrismaClient()
    
    // Test basic connectivity
    await db.$queryRaw`SELECT 1`
    
    // Check database integrity
    const integrityCheck = await db.$queryRaw`PRAGMA integrity_check`
    
    // Get database stats
    const stats = await getDatabaseStats()
    
    // Check file accessibility
    const dbPath = getDatabasePath()
    const fileStats = fs.statSync(dbPath)
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      integrity: integrityCheck[0] === 'ok',
      stats,
      fileAccess: {
        readable: true,
        writable: true,
        size: fileStats.size,
        lastModified: fileStats.mtime
      }
    })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
```

---

## 🔄 Database Migration Strategies

### Version Migration

#### Migration Script Template
```typescript
// scripts/migrate-to-v1.1.ts
import { PrismaClient } from '@prisma/client'

const migrateToV11 = async () => {
  const db = new PrismaClient()
  
  try {
    console.log('Starting migration to v1.1...')
    
    // Add new fields
    await db.$executeRaw`ALTER TABLE BOMItem ADD COLUMN newField TEXT`
    
    // Migrate existing data
    await db.$executeRaw`
      UPDATE BOMItem 
      SET newField = description 
      WHERE newField IS NULL
    `
    
    // Update version in metadata
    await updateDatabaseVersion('1.1.0')
    
    console.log('Migration to v1.1 completed successfully')
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  } finally {
    await db.$disconnect()
  }
}
```

### Data Import from Legacy Systems

#### CSV Import with Mapping
```typescript
// Import legacy BOM data with field mapping
const importLegacyBOM = async (filePath: string) => {
  const csvData = await parseCSV(filePath)
  
  const mappedData = csvData.map(row => ({
    partNumber: row['Part Number'] || row['PART_NUM'],
    manufacturer: row['Manufacturer'] || row['MFR'],
    description: row['Description'] || row['DESC'],
    quantity: parseFloat(row['Quantity'] || row['QTY']) || 1,
    unitPrice: parseFloat(row['Price'] || row['COST']) || 0,
    // Map other fields...
  }))
  
  // Validate and import
  const validation = validateImportData(mappedData)
  if (validation.isValid) {
    await importBOMItems(validation.validRows)
  }
}
```

---

## 🛡️ Database Security

### Access Control

#### File Permissions
```bash
# Set appropriate database file permissions
chmod 644 db/custom.db          # Read/write for owner, read for others
chmod 755 db/                   # Read/write/execute for owner, read/execute for others

# Windows permissions
icacls db/custom.db /grant Users:(OI)(CI)F
```

#### Database Encryption
```typescript
// Enable SQLite encryption (optional)
const encryptedDb = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./db/custom.db?cipher=aes-256-cbc'
    }
  }
})

// Set encryption key (must be provided on every connection)
process.env.DATABASE_ENCRYPTION_KEY = 'your-encryption-key'
```

### Backup Security

#### Encrypted Backups
```typescript
// Create encrypted backup
const createEncryptedBackup = async () => {
  const backupPath = await createBackup()
  const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY
  
  if (encryptionKey) {
    const encryptedPath = backupPath + '.enc'
    await encryptFile(backupPath, encryptedPath, encryptionKey)
    
    // Delete unencrypted backup
    await fs.promises.unlink(backupPath)
    
    return encryptedPath
  }
  
  return backupPath
}
```

---

## 📋 Database Administration

### Administrative Commands

#### Database Information
```bash
# Get database schema
sqlite3 db/custom.db ".schema"

# Get table information
sqlite3 db/custom.db ".tables"

# Get table structure
sqlite3 db/custom.db ".schema BOMItem"

# Get indexes
sqlite3 db/custom.db ".indexes"

# Database size
sqlite3 db/custom.db "SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size();"
```

#### Data Export Queries
```bash
# Export all projects
sqlite3 db/custom.db -header -csv "SELECT * FROM BOMProject;" > projects.csv

# Export BOM items with location names
sqlite3 db/custom.db -header -csv "
SELECT 
  bi.partNumber,
  bi.description,
  bi.quantity,
  l.name as locationName,
  p.name as projectName
FROM BOMItem bi
JOIN Location l ON bi.locationId = l.id
JOIN BOMProject p ON l.projectId = p.id;" > bom-items.csv
```

### Data Recovery

#### Point-in-Time Recovery
```bash
# Restore from backup
cp backups/bom-backup-2025-11-04.zip .
unzip bom-backup-2025-11-04.zip
cp custom.db db/custom.db

# Verify restored data
sqlite3 db/custom.db "SELECT COUNT(*) FROM BOMItem;"
```

#### Partial Data Recovery
```typescript
// Recover specific table from backup
const recoverTableFromBackup = async (backupPath: string, tableName: string) => {
  // Extract backup
  const tempDir = './temp-recovery'
  await fs.promises.mkdir(tempDir, { recursive: true })
  
  // Extract specific table data
  const backupDb = new PrismaClient({
    datasources: { db: { url: `file:${backupPath}` } }
  })
  
  const data = await backupDb[tableName].findMany()
  await backupDb.$disconnect()
  
  // Insert into current database
  const currentDb = getPrismaClient()
  await currentDb[tableName].createMany({
    data: data,
    skipDuplicates: true
  })
  
  console.log(`Recovered ${data.length} records for ${tableName}`)
}
```

---

## 🚨 Troubleshooting

### Common Database Issues

#### Database Lock Errors
```bash
# Check for locked database
lsof db/custom.db

# Kill locking processes
kill -9 <PID>

# Or use SQLite unlock
sqlite3 db/custom.db "PRAGMA wal_checkpoint(TRUNCATE);"
```

#### Corruption Recovery
```bash
# Check database integrity
sqlite3 db/custom.db "PRAGMA integrity_check;"

# Recover from corruption
sqlite3 db/custom.db ".recover" | sqlite3 recovered.db

# Vacuum database
sqlite3 db/custom.db "VACUUM;"
```

#### Performance Issues
```bash
# Analyze query plan
sqlite3 db/custom.db "EXPLAIN QUERY PLAN SELECT * FROM BOMItem WHERE partNumber LIKE '%test%';"

# Check database statistics
sqlite3 db/custom.db "PRAGMA stats;"

# Optimize database
sqlite3 db/custom.db "ANALYZE;"
sqlite3 db/custom.db "REINDEX;"
```

### Migration Issues

#### Rollback Failed Migration
```bash
# Reset to last working migration
npx prisma migrate reset

# Restore from backup
cp backups/pre-migration-backup.db db/custom.db

# Reapply migrations up to working version
npx prisma migrate deploy
```

---

## 📚 Best Practices

### Performance
- Use appropriate indexes for frequent queries
- Batch operations instead of individual queries
- Implement caching for read-heavy operations
- Monitor query performance regularly
- Archive old data to keep main database small

### Security
- Set appropriate file permissions
- Use encrypted connections for remote databases
- Implement regular backup schedule
- Validate all input data
- Use parameterized queries (Prisma handles this)

### Maintenance
- Regular database integrity checks
- Monitor database size growth
- Implement automated backup schedule
- Test recovery procedures regularly
- Keep migration scripts under version control

---

**Status:** ✅ **DATABASE MANAGEMENT GUIDE COMPLETE**  
**Last Updated:** November 4, 2025  
**Purpose:** Database operations, import/export, and maintenance procedures

---

*This document consolidates information from: DATABASE_EXPORT_FIX.md, DATABASE_MANAGEMENT_DIALOG.md, PARTS_IMPORT_MIGRATION_PLAN.md, PARTS_IMPORT_WORKFLOW.md*