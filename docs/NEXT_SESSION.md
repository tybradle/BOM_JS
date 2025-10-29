# Next Session Quick Start Guide

## 🎯 Session Goals
Complete Phase 2 (Master Parts Database) and begin Phase 3 (UI Integration)

---

## 🚦 Start Here

### 1. First: Verify Dev Server Starts on Port 3001
```bash
# Server is already configured to use port 3001 (not 3000)
# Check if server starts successfully
npm run dev

# If you encounter port conflicts, verify what's using ports:
netstat -ano | findstr :3001

# Start dev server (should run on http://localhost:3001)
npm run dev
```

**Note:** The server is already configured to use port 3001 in `server.ts`, so the port 3000 issue may already be resolved.

---

### 2. Test Completed Work

#### Test Export (Phase 1)
```bash
# Assuming dev server running on http://localhost:3001

# Create a test project with items
# Then export it
curl http://localhost:3001/api/projects/[id]/export > test-export.xml

# Compare to sample
# Expected: Matches structure of Samples/Export Sample/14247_Z2_MAIN_1.xml
```

#### Test Search API (Phase 2, Task 2.4)
```bash
# Search for parts (will be empty until data imported)
curl "http://localhost:3001/api/parts/search?q=test&page=1&limit=20"

# Expected response:
# { "results": [], "total": 0, "page": 1, "limit": 20, "hasMore": false }
```

---

### 3. Load Sample Parts Data

Since we don't have the streaming parser yet, create a small test dataset:

```typescript
// Create file: scripts/seed-parts.ts

import { db } from '../src/lib/db'

const sampleParts = [
  {
    partNumber: "1756-L85E",
    manufacturer: "Allen-Bradley",
    description: "ControlLogix Controller",
    secondaryDescription: "Logix 5580, 20MB memory",
    category: "Controllers",
    unitPrice: 4250.00,
    supplier: "Rockwell Automation"
  },
  {
    partNumber: "1756-EN2T",
    manufacturer: "Allen-Bradley", 
    description: "EtherNet/IP Communication Module",
    secondaryDescription: "Dual port, 10/100 Mbps",
    category: "Communication",
    unitPrice: 850.00,
    supplier: "Rockwell Automation"
  },
  // Add 10-20 more parts...
]

async function seedParts() {
  console.log('Seeding parts...')
  
  for (const part of sampleParts) {
    await db.masterPart.create({ data: part })
  }
  
  console.log(`Seeded ${sampleParts.length} parts`)
}

seedParts().catch(console.error).finally(() => process.exit())
```

```bash
# Run seed script
npx tsx scripts/seed-parts.ts

# Verify in Prisma Studio
npx prisma studio
# Navigate to MasterPart table
```

---

## 🔧 Known Issues to Address

### Issue 1: Port Verification
**Symptom:** `npm run dev` fails with port-related errors

**Current Status:** Server is already configured to use port 3001 in `server.ts`:
```typescript
const currentPort = process.env.PORT ? parseInt(process.env.PORT) : 3001;
```

**Solutions if needed:**
1. Verify port 3001 is available: `netstat -ano | findstr :3001`
2. If port 3001 is blocked, kill the process or change to another port
3. Run VS Code as administrator (Windows) if permission issues persist

---

### Issue 2: Prisma Client Out of Date
**Symptom:** TypeScript errors like "Property 'masterPart' does not exist"

**Solution:**
```bash
# After any schema changes
npm run db:push      # Apply schema
npm run db:generate  # Regenerate client
```

---

## 📋 Task Priority Queue

### High Priority (Do First)
1. **Verify dev server** - Confirm port 3001 works
2. **Create seed script** - Load test parts data
3. **Test export functionality** - Validate XML output with sample data
4. **Test search API** - Verify fuzzy search works with seeded data

### Next Priority (After Testing)
5. **Task 2.2: XML Streaming Parser** (90-120 min, HIGH complexity) - Detailed Implementation
   - Install `sax` package: `npm install sax @types/sax`
   - Create `src/lib/xml-streaming-parser.ts` with async generator function
   - Implement SAX parser event handlers for `<Part>` elements
   - Add batch processing with configurable batch size (default 1000)
   - Implement progress tracking callback support
   - Add error handling for malformed XML
   - Create unit tests with sample XML data
   - Test memory efficiency with large files

6. **Task 2.3: Complete Import API** (60-90 min, depends on 2.2)
   - Add multipart/form-data file upload to import route
   - Integrate streaming parser with file upload
   - Implement progress tracking for large imports
   - Test with full parts.xml (362MB)

### Following (After Import Works)
7. **Task 3.1: Part Search Dialog** (120 min, HIGH complexity)
   - Create `src/components/PartSearchDialog.tsx`
   - Use shadcn/ui Dialog component
   - Connect to search API with debounced search
   - Add pagination and filtering

8. **Task 3.2: Integrate Part Search into BOM Table**
   - Add "Add from Catalog" button
   - Connect PartSearchDialog to BOM table
   - Auto-populate BOM items from selected parts

9. **Task 3.3: Add Part Lookup on Part Number Entry**
   - Implement auto-suggest when typing part numbers
   - Add dropdown with matching parts
   - Include "Search all..." option

---

## 📁 Key Files Reference

### Database
- **Schema:** `prisma/schema.prisma`
- **Client:** Auto-generated after `npm run db:generate`
- **Database file:** `db/custom.db` (SQLite)

### API Routes (Completed)
- **Export:** `src/app/api/projects/[id]/export/route.ts` ✅
- **Search:** `src/app/api/parts/search/route.ts` ✅
- **Import:** `src/app/api/parts/import/route.ts` 🟡 (simplified)

### Components (Completed)
- **BOM Table:** `src/components/editable-bom-table.tsx` ✅ (5 new columns)

### To Create Next
- **Seed Script:** `scripts/seed-parts.ts` ⏹️
- **Streaming Parser:** `src/lib/xml-streaming-parser.ts` ⏹️
- **Part Search Dialog:** `src/components/PartSearchDialog.tsx` ⏹️

---

## 🧪 Testing Checklist

### Before Starting New Work
- [ ] Dev server starts successfully
- [ ] No compilation errors
- [ ] Database schema in sync (`npx prisma db push`)
- [ ] Prisma client generated (`npx prisma generate`)

### After Each Task
- [ ] No TypeScript errors
- [ ] API endpoint responds correctly
- [ ] Database changes persist
- [ ] UI updates render correctly

### Integration Testing
- [ ] Can create BOM items with new fields
- [ ] Export generates valid XML
- [ ] Search returns expected results
- [ ] Import processes data correctly

---

## 💡 Quick Commands

```bash
# Development
npm run dev              # Start dev server (custom server.ts)
npm run build           # Production build
npm run start           # Production server

# Database
npm run db:push         # Apply schema changes
npm run db:generate     # Regenerate Prisma client
npm run db:reset        # ⚠️ Clear database (dev only)
npx prisma studio       # Visual database browser

# Utilities
npx tsx scripts/[file]  # Run TypeScript script
npm run lint            # Check code quality
```

---

## 📊 Progress Tracking

After each task:
1. Update `docs/implementation-roadmap.md` (change 🔴 to ✅)
2. Update `docs/PROGRESS_SUMMARY.md` (add completion notes)
3. Commit changes with descriptive message

Example commit messages:
```
✅ Task 2.2: Implement XML streaming parser
🟡 Task 2.3: Add file upload to import API (partial)
🐛 Fix: Resolve port 3000 permission issue
```

---

## 🎓 Context from Previous Session

### What Works
- ✅ Phase 1 completely implemented
- ✅ Export generates Eplan XML with all 8 fields
- ✅ BOM table has all new columns (spare, secondaryDescription, unitPrice, etc.)
- ✅ MasterPart database model created
- ✅ Search API functional (just needs data)

### What's Pending
- ⏹️ XML streaming parser (Task 2.2) - flagged for dedicated session
- 🟡 Import API needs XML upload capability
- ⏹️ All UI integration tasks (Phase 3)

### Recent Changes
- Added 5 fields to BOMItem model
- Created MasterPart model with search indexes
- Rewrote export generator for Eplan format
- Updated BOM table component with new columns
- Created search and simplified import APIs

---

## 🚀 Recommended Session Flow

### Session Start (30-45 min)
1. Verify dev server starts on port 3001
2. Create seed script and load test parts data
3. Test export functionality with sample data
4. Test search API with seeded data

### Main Work (3-4 hours)
5. **Focus: Task 2.2** - XML streaming parser (Detailed Implementation)
   - Install sax package and create parser module
   - Implement core parsing logic with SAX events
   - Add batch processing and progress tracking
   - Implement robust error handling
   - Create and run unit tests
   - Test memory efficiency with sample files

6. **Complete Task 2.3** - Full import API with file upload
   - Add multipart/form-data support
   - Integrate streaming parser with import route
   - Implement progress tracking for large imports
   - Test with full 362MB parts.xml file

### Session End (30-45 min)
7. Document progress in implementation-roadmap.md
8. Test full import workflow end-to-end
9. Plan next session (Phase 3 UI integration tasks)
10. Commit changes with descriptive messages

---

**Ready to continue! 🚀**

Recommended first action: Verify dev server on port 3001, create seed script, and test current implementations.
