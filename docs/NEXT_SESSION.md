# Next Session Quick Start Guide

## 🎯 Session Goals
Complete Phase 2 (Master Parts Database) and begin Phase 3 (UI Integration)

---

## 🚦 Start Here

### 1. First: Resolve Dev Server Issue
```bash
# Check what's using port 3000
netstat -ano | findstr :3000

# If needed, kill the process (use PID from above)
taskkill /PID <PID> /F

# Start dev server
npm run dev
```

**Alternative:** Change port in `server.ts` if port 3000 is permanently blocked.

---

### 2. Test Completed Work

#### Test Export (Phase 1)
```bash
# Assuming dev server running on http://localhost:3000

# Create a test project with items
# Then export it
curl http://localhost:3000/api/projects/[id]/export > test-export.xml

# Compare to sample
# Expected: Matches structure of Samples/Export Sample/14247_Z2_MAIN_1.xml
```

#### Test Search API (Phase 2, Task 2.4)
```bash
# Search for parts (will be empty until data imported)
curl "http://localhost:3000/api/parts/search?q=test&page=1&limit=20"

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

### Issue 1: Port 3000 Permission Denied
**Symptom:** `npm run dev` fails with "EACCES: permission denied"

**Solutions:**
1. Kill process using port 3000 (see command above)
2. Change port in `server.ts`:
   ```typescript
   const port = process.env.PORT || 3001  // Changed from 3000
   ```
3. Run VS Code as administrator (Windows)

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
1. **Create seed script** - Load test parts data
2. **Test search API** - Verify fuzzy search works
3. **Test export** - Validate XML output

### Next Priority (After Testing)
4. **Task 2.2: XML Streaming Parser** (90 min, HIGH complexity)
   - Install `sax` package: `npm install sax @types/sax`
   - Create `src/lib/xml-streaming-parser.ts`
   - Test with small XML sample first

5. **Task 2.3: Complete Import API** (60 min, depends on 2.2)
   - Add file upload to import route
   - Integrate streaming parser
   - Test with full parts.xml

### Following (After Import Works)
6. **Task 3.1: Part Search Dialog** (120 min, HIGH complexity)
   - Create `src/components/PartSearchDialog.tsx`
   - Use shadcn/ui Dialog component
   - Connect to search API

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
- **Streaming Parser:** `src/lib/xml-streaming-parser.ts` ⏹️
- **Part Search Dialog:** `src/components/PartSearchDialog.tsx` ⏹️
- **Seed Script:** `scripts/seed-parts.ts` ⏹️

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

### Session Start (30 min)
1. Resolve port issue
2. Test what's been built
3. Create seed script and load test data

### Main Work (2-3 hours)
4. **Focus: Task 2.2** - XML streaming parser
   - This is the most complex remaining backend task
   - Requires sustained focus
   - Test thoroughly with sample data

5. **Complete Task 2.3** - Full import API
   - Should flow naturally after parser is done
   - Test with full 362MB file

### Session End (30 min)
6. Document progress
7. Test full import workflow
8. Plan next session (Phase 3 UI work)

---

**Ready to continue! 🚀**

Recommended first action: Fix port 3000 issue and test current implementations.
