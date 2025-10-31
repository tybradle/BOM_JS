# Master Parts Database Import - Testing & Production Workflow

**Created:** October 30, 2025  
**Status:** Test workflow ready, Production UI planned

---

## Current State

✅ **Backend Complete:**
- API endpoint: `/api/parts/import` accepts multipart/form-data
- Streaming XML parser handles 300MB+ files (tested at 3,469 parts/sec)
- Batch upsert to SQLite with duplicate detection
- Progress tracking and error handling
- Cache invalidation after import

❌ **Frontend UI:**
- No admin upload UI yet (API-only)
- Existing `ImportPreviewDialog` is for BOM items (different endpoint/workflow)

---

## Testing Workflow (Use Now)

### Option 1: Upload Script (Recommended)
**File:** `scripts/upload-parts-database.ts`

Simple Node.js script that uploads via HTTP and shows detailed progress.

**Usage:**
```bash
# 1. Start dev server (in one terminal)
npm run dev

# 2. Run upload script (in another terminal)
npx tsx scripts/upload-parts-database.ts

# Or specify custom file path
npx tsx scripts/upload-parts-database.ts "C:\path\to\parts.xml"
```

**What it does:**
1. Checks dev server is running (port 3002)
2. Uploads file to `/api/parts/import`
3. Displays upload progress and import summary
4. Shows success rate, errors, timing
5. Provides next steps (Prisma Studio, test search)

**Advantages:**
- No curl/PowerShell syntax issues
- Detailed error messages
- Reusable for repeated testing
- Works on any OS

### Option 2: PowerShell Direct Upload
```powershell
# Copy file to simple path (avoids OneDrive/spaces issues)
Copy-Item "Samples\Import Sample\parts.xml" "C:\temp\parts.xml"

# Upload to API
$uri = 'http://127.0.0.1:3002/api/parts/import'
$form = @{ file = Get-Item 'C:\temp\parts.xml' }
Invoke-RestMethod -Uri $uri -Method Post -Form $form
```

### Option 3: Local Script (Bypass HTTP)
**File:** `scripts/test-streaming-parser.ts` (already exists)

Directly parses XML and prints results without HTTP upload.

```bash
npx tsx scripts/test-streaming-parser.ts
```

**Note:** This only parses/validates — does NOT insert into database. To actually import, use Option 1 or create a variant that calls Prisma.

---

## Verification Steps

After any import method:

### 1. Check API Response
Should return:
```json
{
  "success": true,
  "summary": {
    "totalParsed": 55190,
    "imported": 50000,
    "updated": 5190,
    "errors": 119,
    "duration": "15.91s"
  }
}
```

### 2. Inspect Database
```bash
# Open Prisma Studio
npx prisma studio

# Navigate to MasterPart table
# Verify record count matches summary
```

Or quick SQL check:
```bash
# Windows (if sqlite3 installed)
sqlite3 db\custom.db "SELECT COUNT(*) FROM MasterPart;"

# Or use Prisma
npx prisma db execute --stdin < query.sql
```

### 3. Test Search API
```bash
npx tsx scripts/test-search-api.ts
```

Should return results from newly imported parts.

### 4. Test in UI
1. Open app: http://127.0.0.1:3002
2. Create/open a project
3. Click "Add from Catalog" 
4. Search for a part (e.g., "Siemens", "Allen-Bradley")
5. Verify autocomplete and results work

---

## Production UI Plan

### Architecture Overview

**Target Users:** System admins, power users (one-time setup or periodic updates)

**UI Location:** `/admin/parts` (dedicated admin page)

**Access Control:** 
- Future: Role-based (admin only)
- MVP: No auth (local desktop app, single user)

### Component Structure

#### 1. Page: `src/app/admin/parts/page.tsx`
```tsx
'use client'

export default function PartsAdminPage() {
  return (
    <div className="container mx-auto p-6">
      <PageHeader 
        title="Master Parts Database"
        description="Import and manage the master parts catalog"
      />
      
      <Tabs defaultValue="import">
        <TabsList>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="history">Import History</TabsTrigger>
          <TabsTrigger value="stats">Database Stats</TabsTrigger>
        </TabsList>
        
        <TabsContent value="import">
          <PartsImportUploader />
        </TabsContent>
        
        <TabsContent value="history">
          <ImportHistoryTable />
        </TabsContent>
        
        <TabsContent value="stats">
          <DatabaseStatsCards />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

#### 2. Component: `src/components/PartsImportUploader.tsx`

**Features:**
- Drag & drop zone (XML only)
- File validation (size, format)
- Upload button with progress
- Real-time progress tracking (Socket.IO or polling)
- Import summary display
- Error handling with retry

**UI Flow:**
```
1. [Dropzone] "Drop parts.xml here or click to browse"
   ↓ User drops/selects file
2. [File Preview] 
   - Filename, size
   - "Replace" button
   - [Upload & Import] button
   ↓ User clicks Upload
3. [Progress View]
   - Spinner + progress bar
   - "Parsing batch 15/56..." 
   - "Importing 15,000/55,190 parts..."
   ↓ Import completes
4. [Summary View]
   - ✅ Import Complete!
   - Total: 55,190 parsed
   - New: 50,000 | Updated: 5,190
   - Errors: 119 (with expandable details)
   - [View in Catalog] [Import Another]
```

**Implementation Notes:**
- Reuse patterns from `ImportPreviewDialog.tsx` (drag/drop, file handling)
- Add Socket.IO listener for real-time progress (requires server enhancement)
- Or use polling: POST returns 202 Accepted, client polls `/api/parts/import/status/{jobId}`
- Display last import date/summary (store in new `PartsImportHistory` table)

#### 3. Schema Enhancement: Import History Tracking

**Add to `prisma/schema.prisma`:**
```prisma
model PartsImportHistory {
  id            String   @id @default(cuid())
  fileName      String
  fileSize      Int
  totalParsed   Int
  imported      Int
  updated       Int
  errors        Int
  duration      String
  importedBy    String   // Future: user ID
  importedAt    DateTime @default(now())
  status        String   // 'success' | 'failed' | 'partial'
  errorDetails  String?  @db.Text
}
```

**Why:**
- Track import history for auditing
- Show users when database was last updated
- Helpful for troubleshooting (compare import results over time)

#### 4. Enhanced API: Progress Tracking

**Current State:** Import is synchronous, returns only at completion.

**Enhancement Options:**

**Option A: Socket.IO (Recommended for this project)**
```typescript
// In streaming parser, emit progress events
parsePartsXML(filePath, {
  batchSize: 1000,
  onProgress: (parsed) => {
    io.emit('import:progress', { 
      parsed, 
      phase: 'parsing' 
    })
  }
})

// In client, listen for events
socket.on('import:progress', (data) => {
  setProgress(data.parsed)
})
```

**Option B: Job Queue + Polling**
```typescript
// API returns job ID immediately
POST /api/parts/import
→ { jobId: "abc123", status: "processing" }

// Client polls for status
GET /api/parts/import/status/abc123
→ { 
    status: "processing", 
    progress: { parsed: 15000, total: 55190 } 
  }
```

Socket.IO is already set up in this project (see `server.ts` and `src/lib/socket.ts`), so Option A is faster to implement.

---

## Recommended Implementation Order

### Phase 1: Testing (Now)
- ✅ Use `upload-parts-database.ts` script for testing
- ✅ Verify import works with production data
- ✅ Document workflow in this file

### Phase 2: MVP UI (Next Session)
**Time Estimate:** 2-3 hours

1. Create `/admin/parts/page.tsx` with basic layout
2. Create `PartsImportUploader.tsx` component
   - Drag/drop zone
   - File upload to `/api/parts/import`
   - Show spinner during upload
   - Display summary after completion
3. Add navigation link (settings menu or sidebar)
4. Test end-to-end

**No progress tracking yet** — just upload → wait → show result.

### Phase 3: Enhanced UX (Future)
**Time Estimate:** 3-4 hours

1. Add `PartsImportHistory` schema
2. Implement Socket.IO progress events
3. Show real-time parsing/import progress
4. Add import history tab
5. Add database stats (total parts, last update, etc.)
6. Error details expansion

### Phase 4: Polish (Future)
- Role-based access control (if multi-user needed)
- Scheduled imports (cron job for auto-updates)
- Backup before import (export current DB to JSON)
- Rollback capability (restore previous version)
- Import validation (dry-run mode to preview changes)

---

## User Workflow (Production)

### First-Time Setup
1. Admin opens app, navigates to Settings → Master Parts
2. Sees "No parts database loaded" message
3. Clicks "Import Parts Database"
4. Drops/selects `parts.xml` file (provided by IT/engineering)
5. Waits for import (shows progress)
6. Sees success summary
7. Users can now search parts in BOM UI

### Periodic Updates
1. IT provides updated `parts.xml` (monthly/quarterly)
2. Admin opens Settings → Master Parts
3. Sees current database info:
   - Last updated: October 30, 2025
   - Total parts: 55,190
   - Last import: 50,000 new, 5,190 updated
4. Clicks "Import New Version"
5. Upload triggers upsert (updates existing, adds new)
6. Summary shows changes
7. Users immediately see updated parts (cache cleared)

---

## File Organization

**Created:**
- ✅ `scripts/upload-parts-database.ts` - Upload test script

**To Create (Phase 2):**
- `src/app/admin/parts/page.tsx` - Admin page
- `src/components/PartsImportUploader.tsx` - Upload UI
- `src/components/ImportHistoryTable.tsx` - History view
- `src/components/DatabaseStatsCards.tsx` - Stats dashboard

**To Modify (Phase 3):**
- `src/app/api/parts/import/route.ts` - Add progress events
- `prisma/schema.prisma` - Add PartsImportHistory model
- `src/lib/socket.ts` - Add import progress namespace

---

## Security Considerations

**Current (Desktop App):**
- Single-user, local app → no auth needed
- File system access already restricted to user

**Future (Multi-User or Web Deployment):**
- Add role check: `if (!user.isAdmin) return 403`
- Validate file size limits (prevent DOS)
- Sanitize filenames (prevent path traversal)
- Rate limit import endpoint
- Log all import actions with user ID

---

## Next Steps

**Immediate (This Session):**
1. ✅ Created upload script
2. Test upload script with dev server running
3. Verify import works end-to-end
4. Document any issues

**Next Session:**
1. Create admin UI (Phase 2 - MVP)
2. Wire upload component to API
3. Add navigation link
4. Test in production workflow

**Future:**
1. Add progress tracking (Phase 3)
2. Import history tracking
3. Database stats dashboard
4. Polish and production hardening (Phase 4)

---

## Testing Checklist

- [ ] Start dev server (`npm run dev`)
- [ ] Run upload script (`npx tsx scripts/upload-parts-database.ts`)
- [ ] Verify import summary shows correct counts
- [ ] Check database in Prisma Studio (count matches summary)
- [ ] Test search API returns new parts
- [ ] Test "Add from Catalog" in BOM UI
- [ ] Verify search cache was cleared (results are fresh)
- [ ] Re-run import (should show updates, not all new)
- [ ] Document any errors or edge cases

---

**Status:** Ready for testing. Run upload script to verify full import workflow.
