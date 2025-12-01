# BOM Management Framework - Technical Guide

**Document Purpose:** Comprehensive technical implementation details, patterns, and architecture  
**Last Updated:** November 4, 2025

---

## 🏗️ Architecture Overview

### Technology Stack
- **Frontend:** Next.js 15 with App Router, React 19, TypeScript 5
- **Backend:** Next.js API routes, Prisma ORM
- **Database:** SQLite with Prisma ORM
- **UI Components:** shadcn/ui with Tailwind CSS 4
- **State Management:** Zustand with optimistic updates
- **File Processing:** PapaParse (CSV), SheetJS (Excel), SAX (XML)
- **Desktop App:** Electron with native file operations

### Layered Architecture
```
┌─────────────────────────────────────┐
│         Presentation Layer          │
│  (React Components, Next.js Pages)  │
├─────────────────────────────────────┤
│         Business Logic Layer        │
│     (API Routes, Services)         │
├─────────────────────────────────────┤
│         Data Access Layer           │
│    (Prisma ORM, Database Models)   │
├─────────────────────────────────────┤
│         Data Storage Layer          │
│        (SQLite Database)           │
└─────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### Core Models

#### BOMProject
```typescript
model BOMProject {
  id          String   @id @default(cuid())
  name        String
  number      String   @unique
  description String?
  status      ProjectStatus @default(ACTIVE)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  locations   Location[]
  bomItems    BOMItem[]
  bomExports  BOMExport[]
  
  @@index([number])
}
```

#### Location
```typescript
model Location {
  id         String   @id @default(cuid())
  name       String
  exportName String?  // Custom name for Eplan exports
  projectId  String
  order      Int      @default(0)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  project    BOMProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  bomItems   BOMItem[]
  
  @@unique([projectId, name])
  @@index([projectId, order])
}
```

#### BOMItem
```typescript
model BOMItem {
  id                    String    @id @default(cuid())
  partNumber            String
  manufacturer          String?
  description           String
  secondaryDescription  String?
  quantity              Float
  unit                  String    @default("EA")
  unitPrice             Float?
  referenceDesignator   String?
  isSpare               Boolean   @default(false)
  status                ItemStatus @default(ACTIVE)
  order                 Int       @default(0)
  locationId            String
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  location              Location @relation(fields: [locationId], references: [id], onDelete: Cascade)
  
  @@unique([locationId, partNumber])
  @@index([locationId, order])
  @@index([manufacturer])
}
```

#### MasterPart
```typescript
model MasterPart {
  id                    String   @id @default(cuid())
  partNumber            String   @unique
  manufacturer          String
  description           String
  secondaryDescription  String?
  category              String?
  unitPrice             Float?
  supplier              String?
  lastUpdated           DateTime @default(now()) @updatedAt
  source                String   @default("parts.xml")
  importDate            DateTime @default(now())
  
  @@index([partNumber])
  @@index([manufacturer])
  @@index([description])
  @@index([category])
  @@index([manufacturer, category])
}
```

### Database Indexes Strategy

#### Composite Indexes
- `BOMItem`: `[projectId, locationId]` - Location queries
- `BOMItem`: `[manufacturer]` - Manufacturer filtering
- `BOMItem`: `[order]` - Table ordering
- `MasterPart`: `[manufacturer, category]` - Search optimization

#### Single Indexes
- `BOMItem.partNumber` - Part number lookups
- `MasterPart.partNumber` - Unique part numbers
- `MasterPart.description` - Description search
- `MasterPart.category` - Category filtering

---

## 🔌 API Architecture

### RESTful Design Patterns

#### Standard Response Format
```typescript
// Success Response
{
  success: true,
  data: any,
  message?: string
}

// Error Response
{
  success: false,
  error: string,
  details?: any
}
```

#### Error Handling Pattern
```typescript
export async function GET() {
  try {
    // Database operation
    const result = await db.resource.findMany()
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Failed to fetch resource:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch resource' },
      { status: 500 }
    )
  }
}
```

### Key API Endpoints

#### Export API
```typescript
// GET /api/projects/[id]/export?format=eplan|csv|excel
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'eplan'
  
  const project = await db.bOMProject.findUnique({
    where: { id: params.id },
    include: {
      locations: {
        include: { bomItems: { orderBy: { order: 'asc' } } }
      }
    }
  })
  
  switch (format) {
    case 'csv':
      return generateCSV(project)
    case 'excel':
      return generateExcel(project)
    default:
      return generateEplanXML(project)
  }
}
```

#### Import API
```typescript
// POST /api/projects/[id]/items/import
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const locationId = formData.get('locationId') as string
  const addToDatabase = formData.get('addToDatabase') === 'true'
  
  // Parse file
  const parsedData = await parseFile(file)
  
  // Validate data
  const validation = validateImportData(parsedData, locationId)
  
  // Add to database if requested
  if (addToDatabase && validation.missingParts.length > 0) {
    await addMissingParts(validation.missingParts)
  }
  
  // Import BOM items
  const result = await importBOMItems(validation.validRows, locationId)
  
  return NextResponse.json({ success: true, ...result })
}
```

#### Parts Search API
```typescript
// GET /api/parts/search?q={query}&page={num}&limit={num}&manufacturer={name}
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const manufacturer = searchParams.get('manufacturer')
  
  // Check cache first
  const cacheKey = `search:${query}:${page}:${limit}:${manufacturer || ''}`
  const cached = searchCache.get(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }
  
  // Build search query
  const where = {
    AND: [
      {
        OR: [
          { partNumber: { contains: query } },
          { description: { contains: query } },
          { manufacturer: { contains: query } }
        ]
      },
      manufacturer ? { manufacturer } : {}
    ]
  }
  
  // Execute with performance monitoring
  const startTime = Date.now()
  const [results, total] = await Promise.all([
    db.masterPart.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { partNumber: 'asc' }
    }),
    db.masterPart.count({ where })
  ])
  const queryTime = Date.now() - startTime
  
  // Cache results
  const response = {
    results,
    total,
    page,
    limit,
    hasMore: page * limit < total
  }
  searchCache.set(cacheKey, response)
  
  // Log performance
  performanceMonitor.recordQuery(queryTime, cacheKey)
  
  return NextResponse.json(response)
}
```

---

## 🎨 Component Architecture

### Atomic Design Principles

#### Base UI Components (shadcn/ui)
- Button, Input, Select, Table, Dialog, etc.
- Consistent design system with Tailwind CSS
- TypeScript interfaces for all props

#### Business Components

##### EditableBOMTable
```typescript
interface EditableBOMTableProps {
  projectId: string
  locationId: string
  items: BOMItem[]
  onItemUpdate: (id: string, updates: Partial<BOMItem>) => void
  onItemDelete: (id: string) => void
  onItemAdd: () => void
}

// Key Features:
- Inline editing with Enter/Escape handling
- Column sorting and filtering
- Bulk selection for operations
- Real-time validation
- Keyboard navigation
```

##### PartSearchDialog
```typescript
interface PartSearchDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (part: MasterPart) => void
  initialSearch?: string
}

// Key Features:
- Debounced search (300ms)
- Pagination with hasMore flag
- Manufacturer filter dropdown
- Keyboard navigation (arrows + Enter)
- Double-click selection
- Loading and empty states
```

##### ImportPreviewDialog
```typescript
interface ImportPreviewDialogProps {
  open: boolean
  onClose: () => void
  onImport: (validRows: ParsedRow[]) => void
  parsedData: ParsedRow[]
  locationId: string
}

// Key Features:
- Color-coded validation (green/yellow/red)
- Duplicate detection
- Database missing parts detection
- Summary statistics
- Import gating until all valid
```

### State Management Pattern

#### Zustand Store Structure
```typescript
interface BOMStore {
  // State
  projects: BOMProject[]
  currentProject: BOMProject | null
  locations: Location[]
  bomItems: BOMItem[]
  settings: AppSettings | null
  loading: boolean
  error: string | null
  
  // Actions
  fetchProjects: () => Promise<void>
  createProject: (data: CreateProjectData) => Promise<void>
  updateBOMItem: (id: string, updates: Partial<BOMItem>) => Promise<void>
  deleteBOMItem: (id: string) => Promise<void>
  addBOMItem: (item: CreateBOMItemData) => Promise<void>
  
  // Optimistic Updates
  updateBOMItemOptimistic: (id: string, updates: Partial<BOMItem>) => void
  revertBOMItemUpdate: (id: string) => void
}
```

#### Optimistic Update Pattern
```typescript
const updateBOMItem = async (id: string, updates: Partial<BOMItem>) => {
  // Optimistic update
  const previousItem = get().bomItems.find(item => item.id === id)
  set(state => ({
    bomItems: state.bomItems.map(item =>
      item.id === id ? { ...item, ...updates } : item
    )
  }))
  
  try {
    // API call
    await fetch(`/api/bom-items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })
  } catch (error) {
    // Revert on error
    set(state => ({
      bomItems: state.bomItems.map(item =>
        item.id === id ? previousItem : item
      )
    }))
    throw error
  }
}
```

---

## 📁 File Processing

### CSV Parsing Strategy
```typescript
import Papa from 'papaparse'

export const parseCSV = (file: File): Promise<ParsedRow[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        // Normalize header names (30+ variations supported)
        const normalized = header.toLowerCase().trim().replace(/[^a-z]/g, '')
        return HEADER_MAPPING[normalized] || header
      },
      transform: (value, field) => {
        // Type-safe parsing
        if (field === 'quantity' || field === 'unitPrice') {
          const num = parseFloat(String(value).trim())
          return isNaN(num) ? 0 : num
        }
        return String(value).trim()
      },
      complete: (results) => resolve(results.data as ParsedRow[]),
      error: (error) => reject(error)
    })
  })
}

const HEADER_MAPPING = {
  'partnumber': 'partNumber',
  'part_number': 'partNumber',
  'part': 'partNumber',
  'description': 'description',
  'desc': 'description',
  'quantity': 'quantity',
  'qty': 'quantity',
  'manufacturer': 'manufacturer',
  'mfr': 'manufacturer',
  // ... 30+ variations
}
```

### Excel Processing Strategy
```typescript
import * as XLSX from 'xlsx'

export const parseExcel = (file: File): Promise<ParsedRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        
        // Convert to JSON with header mapping
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: ''
        })
        
        const headers = jsonData[0] as string[]
        const rows = jsonData.slice(1) as any[][]
        
        const normalizedData = rows.map(row => {
          const obj: any = {}
          headers.forEach((header, index) => {
            const normalized = header.toLowerCase().trim().replace(/[^a-z]/g, '')
            const fieldName = HEADER_MAPPING[normalized] || header
            obj[fieldName] = String(row[index] || '').trim()
          })
          return obj
        })
        
        resolve(normalizedData)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}
```

### XML Streaming Parser
```typescript
import sax from 'sax'

export async function* parsePartsXML(
  filePath: string,
  options: {
    batchSize?: number
    onProgress?: (parsed: number) => void
    onError?: (error: Error) => void
  } = {}
): AsyncGenerator<PartData[], void, void> {
  const { batchSize = 1000, onProgress, onError } = options
  const parser = sax.parser(true)
  let currentPart: Partial<PartData> = {}
  let currentField = ''
  let batch: PartData[] = []
  let parsedCount = 0
  
  parser.onopentag = (node) => {
    if (node.name === 'Part') {
      currentPart = {}
    } else if (isPartField(node.name)) {
      currentField = node.name
    }
  }
  
  parser.ontext = (text) => {
    if (currentField && currentPart) {
      // Handle multilingual text: "de_DE@text;en_US@text"
      const cleanText = text.split(';').pop()?.split('@').pop()?.trim() || text
      currentPart[currentField as keyof PartData] = cleanText
    }
  }
  
  parser.onclosetag = (tagName) => {
    if (tagName === 'Part') {
      if (isValidPart(currentPart)) {
        batch.push(currentPart as PartData)
        parsedCount++
        
        if (batch.length >= batchSize) {
          yield batch
          batch = []
          onProgress?.(parsedCount)
        }
      }
      currentPart = {}
    }
    currentField = ''
  }
  
  parser.onerror = (error) => {
    onError?.(error as Error)
  }
  
  // Parse file
  const stream = fs.createReadStream(filePath)
  stream.pipe(parser)
  
  // Yield remaining batch
  await new Promise((resolve, reject) => {
    parser.onend = resolve
    parser.onerror = reject
  })
  
  if (batch.length > 0) {
    yield batch
  }
}
```

---

## 🚀 Performance Optimization

### Caching Strategy

#### LRU Cache Implementation
```typescript
import LRU from 'lru-cache'

const searchCache = new LRU<string, any>({
  max: 500,           // Maximum items
  ttl: 1000 * 60 * 5, // 5 minutes TTL
  updateAgeOnGet: true,
  sizeCalculation: (value) => JSON.stringify(value).length,
  maxSize: 50 * 1024 * 1024 // 50MB max size
})
```

#### Cache Invalidation
```typescript
// Clear cache on data mutations
export const clearSearchCache = () => {
  searchCache.clear()
  performanceMonitor.resetCacheStats()
}

// Call after import/update operations
await importBOMItems(data)
clearSearchCache()
```

### Performance Monitoring
```typescript
class PerformanceMonitor {
  private queryTimes: number[] = []
  private cacheHits = 0
  private cacheMisses = 0
  private slowQueries = 0
  
  recordQuery(time: number, cacheKey: string) {
    this.queryTimes.push(time)
    if (time > 200) this.slowQueries++
    
    const hit = searchCache.has(cacheKey)
    if (hit) {
      this.cacheHits++
    } else {
      this.cacheMisses++
    }
  }
  
  getStats() {
    return {
      avgQueryTime: this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length,
      minQueryTime: Math.min(...this.queryTimes),
      maxQueryTime: Math.max(...this.queryTimes),
      slowQueries: this.slowQueries,
      cacheHitRate: this.cacheHits / (this.cacheHits + this.cacheMisses),
      totalQueries: this.queryTimes.length
    }
  }
}

export const performanceMonitor = new PerformanceMonitor()
```

### Database Query Optimization

#### Efficient Pagination
```typescript
// Good: Uses skip/take with indexes
const results = await db.masterPart.findMany({
  where: searchConditions,
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { partNumber: 'asc' },
  select: {
    // Only fetch needed fields
    partNumber: true,
    manufacturer: true,
    description: true,
    unitPrice: true
  }
})

// Bad: Offset without limit can be slow
const badResults = await db.masterPart.findMany({
  where: searchConditions,
  skip: (page - 1) * limit,
  // Missing take can cause memory issues
})
```

#### Batch Operations
```typescript
// Good: Batch inserts with transactions
await db.$transaction(async (tx) => {
  for (const batch of chunkArray(items, 100)) {
    await tx.bOMItem.createMany({
      data: batch,
      skipDuplicates: true
    })
  }
})

// Bad: Individual inserts in loop
for (const item of items) {
  await db.bOMItem.create({ data: item }) // N+1 queries
}
```

---

## 🔒 Security Patterns

### Input Validation
```typescript
import { z } from 'zod'

const BOMItemSchema = z.object({
  partNumber: z.string().min(1).max(100),
  manufacturer: z.string().max(100).optional(),
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  unit: z.string().max(20).default('EA'),
  unitPrice: z.number().positive().optional()
})

export const validateBOMItem = (data: unknown) => {
  return BOMItemSchema.parse(data)
}
```

### File Upload Security
```typescript
export const validateFileUpload = (file: File) => {
  const allowedTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
  
  const maxSize = 10 * 1024 * 1024 // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type')
  }
  
  if (file.size > maxSize) {
    throw new Error('File too large')
  }
  
  return true
}
```

### SQL Injection Prevention
```typescript
// Good: Prisma ORM handles parameterization
const results = await db.bOMItem.findMany({
  where: {
    partNumber: { contains: searchTerm } // Safe parameterization
  }
})

// Bad: Raw SQL without parameterization
const badResults = await db.$queryRaw`
  SELECT * FROM BOMItem WHERE partNumber LIKE '%${searchTerm}%'
` // Vulnerable to injection
```

---

## 🖥️ Electron Integration

### Native File Operations
```typescript
// electron.js - Main process
const { ipcMain, dialog } = require('electron')

ipcMain.handle('showSaveDialog', async (event, options) => {
  const result = await dialog.showSaveDialog(options)
  return result
})

ipcMain.handle('writeFile', async (event, filePath, buffer) => {
  try {
    await fs.writeFile(filePath, Buffer.from(buffer))
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})
```

```typescript
// preload.js - Bridge to renderer
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  showSaveDialog: (options) => ipcRenderer.invoke('showSaveDialog', options),
  writeFile: (filePath, buffer) => ipcRenderer.invoke('writeFile', filePath, buffer)
})
```

```typescript
// Renderer process - TypeScript definitions
interface ElectronAPI {
  showSaveDialog: (options: Electron.SaveDialogOptions) => Promise<Electron.SaveDialogReturnValue>
  writeFile: (filePath: string, buffer: ArrayBuffer) => Promise<{ success: boolean; error?: string }>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
```

### Environment Detection
```typescript
export const isElectron = () => {
  return typeof window !== 'undefined' && window.process?.type === 'renderer'
}

export const isProduction = () => {
  return process.env.NODE_ENV === 'production'
}

export const getBaseURL = () => {
  if (isElectron() && isProduction()) {
    return 'http://localhost:3002' // Local server in Electron
  }
  return '' // Relative path for web deployment
}
```

---

## 🧪 Testing Patterns

### API Route Testing
```typescript
// scripts/test-api.ts
import { createMocks } from 'node-mocks-http'

describe('/api/parts/search', () => {
  it('should return search results', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { q: 'test', page: '1', limit: '10' }
    })
    
    await searchHandler(req, res)
    
    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.results).toBeInstanceOf(Array)
    expect(data.total).toBeGreaterThan(0)
  })
})
```

### Component Testing Pattern
```typescript
// Manual testing checklist
const testImportPreview = () => {
  // Test file upload
  uploadFile('test.csv')
  
  // Verify validation states
  expect(findByText('Valid: 20')).toBeInTheDocument()
  expect(findByText('Missing Info: 3')).toBeInTheDocument()
  expect(findByText('Duplicate: 2')).toBeInTheDocument()
  
  // Test import button state
  expect(importButton).toBeDisabled() // Should be disabled with duplicates
  
  // Resolve duplicates
  resolveDuplicates()
  
  // Verify button enabled
  expect(importButton).toBeEnabled()
}
```

---

## 📝 Code Quality Standards

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### ESLint Rules
```javascript
module.exports = {
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'prefer-const': 'error',
    'no-var': 'error'
  }
}
```

### Code Review Checklist
- [ ] TypeScript strict mode compliance
- [ ] Proper error handling with try-catch
- [ ] Input validation on all API routes
- [ ] Database queries use indexes
- [ ] No hardcoded values
- [ ] Console logging for debugging
- [ ] Environment-aware configuration
- [ ] Component props properly typed
- [ ] State management patterns followed
- [ ] Performance considerations addressed

---

## 🔧 Development Workflow

### Environment Setup
```bash
# Install dependencies
npm install

# Database setup
npm run db:push      # Apply schema changes
npm run db:generate  # Generate Prisma client

# Development server
npm run dev          # Start on port 3002
npm run electron-dev  # Electron development mode
```

### Database Migrations
```bash
# 1. Modify prisma/schema.prisma
# 2. Apply changes
npm run db:push

# 3. Generate client
npm run db:generate

# 4. Update TypeScript types if needed
```

### Build Process
```bash
# Production build
npm run build

# Test production build
npm run start

# Electron packaging
npm run electron-pack-win    # Windows installer
npm run electron-pack-mac    # macOS app
npm run electron-pack-linux  # Linux app
```

---

## 🚨 Troubleshooting Guide

### Common Issues

#### Port Conflicts
```bash
# Kill stuck processes
npm run kill-port

# Or manually
npx kill-port 3002
```

#### TypeScript Errors
```bash
# Clear caches
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

#### Database Issues
```bash
# Reset database
rm -f db/custom.db
npm run db:push
npm run db:seed  # If seed script exists
```

#### Electron Build Issues
```bash
# Clear Electron cache
rm -rf dist
rm -rf node_modules/electron
npm install
npm run electron-pack
```

### Performance Debugging

#### Slow Query Analysis
```typescript
// Enable query logging
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
    console.log('Slow Query:', e.query)
    console.log('Duration:', e.duration + 'ms')
  }
})
```

#### Memory Usage Monitoring
```typescript
// Monitor cache size
setInterval(() => {
  console.log('Cache size:', searchCache.size)
  console.log('Memory usage:', process.memoryUsage())
}, 30000) // Every 30 seconds
```

---

**Status:** ✅ **TECHNICAL GUIDE COMPLETE**  
**Last Updated:** November 4, 2025  
**Purpose:** Consolidated technical implementation details for development team

---

*This document consolidates information from various implementation documents now archived in HISTORY.md*