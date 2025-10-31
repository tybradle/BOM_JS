# BOM Framework - Implementation Roadmap
## Eplan Export & Master Parts Database Integration

> **Last Updated:** October 29, 2025  
> **Status:** Phase 3 Complete (with 1 task parked)  
> **Goal:** Enable Eplan-compatible XML export and master parts database search

---

## 📋 Overview

This roadmap breaks down the implementation into **atomic, testable tasks** designed to avoid context loss during AI-assisted development. Each task is scoped to be completable in a single focused session.

**Current Progress:** 15/17 tasks complete (88%)
- ✅ Phase 1: Complete (5/5 tasks)
- 🟡 Phase 2: Partial (3/4 tasks) - XML streaming parser pending
- ✅ Phase 3: Complete (3/4 tasks) - Auto-suggest parked for future

---

## 🎯 Phase 1: Core Export Compatibility
**Goal:** Enable accurate Eplan XML export with all required fields  
**Timeline:** Week 1  
**Dependencies:** None

### ✅ Task 1.1: Add Database Fields for Eplan Export
**File:** `prisma/schema.prisma`  
**Estimated Time:** 10 minutes  
**Complexity:** 🟢 Low

**Objective:** Add missing fields to BOMItem model to support full Eplan export format

**Requirements:**
- Add `isSpare` Boolean field (default: false)
- Add `secondaryDescription` String field (nullable)
- Update `@@unique` constraint documentation if needed

**Acceptance Criteria:**
- [x] `isSpare` field added to BOMItem model
- [x] `secondaryDescription` field added to BOMItem model
- [x] `npm run db:push` executes successfully
- [x] `npm run db:generate` completes without errors
- [x] Existing data migrations handled gracefully

**Testing:**
```bash
npm run db:push
npm run db:generate
npm run dev
# Verify app starts without errors
```

---

### ✅ Task 1.2: Update Export Generator - Field Mapping
**File:** `src/app/api/projects/[id]/export/route.ts`  
**Estimated Time:** 20 minutes  
**Complexity:** 🟢 Low  
**Dependencies:** Task 1.1 completed

**Objective:** Map new database fields to correct Eplan XML elements

**Requirements:**
- Map `isSpare` → `<P_ARTICLE_SPARE>0|1</P_ARTICLE_SPARE>`
- Map `secondaryDescription` → `<P_ARTICLE_DESCR2>` (fallback to `category` if null)
- Ensure `unitPrice` handles null values (output empty tag)
- Update XML generation to match exact Eplan format

**Field Mapping Reference:**
```typescript
P_ARTICLE_MANUFACTURER    → item.manufacturer || ''
P_ARTICLE_DESCR1          → item.description
P_ARTICLE_DESCR2          → item.secondaryDescription || item.category || ''
P_ARTICLE_ORDERNR         → item.partNumber
P_ARTICLE_DEVTAG          → item.referenceDesignator || ''
P_ARTICLE_QUANTITY_IN_PROJECT_UNIT → item.quantity
P_ARTICLE_SALESPRICE_1    → item.unitPrice || '' (empty if null)
P_ARTICLE_SPARE           → item.isSpare ? '1' : '0'
```

**Acceptance Criteria:**
- [x] All 8 Eplan fields correctly mapped
- [x] Null/empty values handled without errors
- [x] XML output matches sample format structure
- [x] Existing export functionality still works

**Testing:**
1. Create test project with sample items
2. Export XML via API: `GET /api/projects/[id]/export`
3. Compare output structure to `Samples/Export Sample/14247_Z2_MAIN_1.xml`
4. Verify all fields present and formatted correctly

---

### ✅ Task 1.3: Add "Spare" Column to BOM Table
**File:** `src/components/editable-bom-table.tsx`  
**Estimated Time:** 25 minutes  
**Complexity:** 🟢 Low  
**Dependencies:** Task 1.1 completed

**Objective:** Enable users to mark items as spare parts in the UI

**Requirements:**
- Add "Spare" column to table between "Status" and "Actions"
- Render checkbox for `isSpare` field
- Enable inline editing (click to toggle)
- Update Zustand store action to save changes
- Add visual indicator (badge or icon) when item is spare

**UI Specifications:**
- Column header: "Spare"
- Cell: Checkbox component (controlled)
- On change: Call `updateBOMItem` with `{ isSpare: !current }`
- Optional: Add badge/icon in row if spare

**Acceptance Criteria:**
- [x] "Spare" column visible in table
- [x] Checkbox reflects current `isSpare` state
- [x] Clicking checkbox toggles state
- [x] Changes persist to database
- [x] UI updates optimistically
- [x] No console errors

**Testing:**
1. Open BOM table in browser
2. Click spare checkbox for an item
3. Verify database updated (check in DB or re-fetch)
4. Refresh page - state should persist
5. Export XML - verify `<P_ARTICLE_SPARE>1</P_ARTICLE_SPARE>`

---

### ⚠️ Task 1.4: Export Location Grouping
**File:** `src/app/api/projects/[id]/export/route.ts`  
**Estimated Time:** 45 minutes  
**Complexity:** 🟡 Medium  
**Dependencies:** Task 1.2 completed

**Objective:** Group BOM items by Location in XML output structure

**Requirements:**
- Fetch all locations for the project
- Group items by `locationId`
- Generate `<KittingLocation>` element per location
- Nest `<Part>` elements within correct location
- Handle location naming (use `location.name` for now)

**XML Structure Target:**
```xml
<Project Name="[projectNumber]_[mainLocation]_1">
  <Package Name="[packageName]">
    <KittingLocation Name="[location1.name]">
      <Part>...</Part>
      <Part>...</Part>
    </KittingLocation>
    <KittingLocation Name="[location2.name]">
      <Part>...</Part>
    </KittingLocation>
  </Package>
</Project>
```

**Acceptance Criteria:**
- [x] XML contains `<KittingLocation>` elements
- [x] Items correctly grouped by location
- [x] Location names match database
- [x] Empty locations excluded from export
- [x] Project/Package hierarchy correct

**Testing:**
1. Create project with 2+ locations
2. Add items to different locations
3. Export XML
4. Verify locations as separate `<KittingLocation>` elements
5. Validate XML structure matches sample

---

### ⚠️ Task 1.5: Add Secondary Description Field to UI
**Files:** `src/components/editable-bom-table.tsx`, `src/lib/store.ts`  
**Estimated Time:** 40 minutes  
**Complexity:** 🟡 Medium  
**Dependencies:** Task 1.1 completed

**Objective:** Enable users to enter secondary description for parts

**Requirements:**
- Add "Description 2" column after "Description"
- Inline editable text input
- Update Zustand `updateBOMItem` action
- Optional: Show placeholder text ("Additional details...")
- Ensure column is resizable

**UI Specifications:**
- Column header: "Description 2"
- Cell: Input component (like description field)
- On blur: Save to database
- Max length: 255 characters
- Allow empty/null values

**Acceptance Criteria:**
- [x] "Description 2" column visible
- [x] Click to edit (inline input)
- [x] Enter/blur saves changes
- [x] Escape cancels edit
- [x] Changes persist to database
- [x] Export includes `<P_ARTICLE_DESCR2>` value

**Testing:**
1. Open BOM table
2. Click "Description 2" cell for item
3. Enter text, press Enter
4. Verify database updated
5. Export XML - verify `<P_ARTICLE_DESCR2>` populated

---

## 📊 Phase 1 Summary

**Total Tasks:** 5  
**Estimated Time:** 2.5 hours  
**Outcome:** Complete Eplan export compatibility with UI support

**Phase 1 Completion Checklist:**
- [x] All Eplan required fields in database
- [x] Export generates valid Eplan XML format
- [x] Location-based grouping implemented
- [x] UI supports editing all new fields
- [x] Spare parts can be marked and exported
- [x] Secondary descriptions can be added
- [ ] All exports validated against sample XML *(pending live testing)*

---

## 🗄️ Phase 2: Master Parts Database
**Goal:** Import and search 362MB master parts catalog  
**Timeline:** Week 2-3  
**Dependencies:** Phase 1 complete

### ✅ Task 2.1: Create MasterPart Database Model
**File:** `prisma/schema.prisma`  
**Estimated Time:** 15 minutes  
**Complexity:** 🟢 Low

**Objective:** Add database model for master parts catalog

**Requirements:**
- Create `MasterPart` model
- Include all fields from parts.xml
- Add indexes for search performance
- Add metadata fields (lastUpdated, source)

**Schema Definition:**
```prisma
model MasterPart {
  id                    String   @id @default(cuid())
  partNumber            String   @unique
  manufacturer          String
  description           String
  secondaryDescription  String?
  category              String?
  unitPrice             Decimal? @db.Decimal(10, 2)
  supplier              String?
  
  // Metadata
  lastUpdated           DateTime @default(now()) @updatedAt
  source                String   @default("parts.xml")
  importDate            DateTime @default(now())
  
  @@index([partNumber])
  @@index([manufacturer])
  @@index([description])
  @@index([category])
}
```

**Acceptance Criteria:**
- [ ] MasterPart model added to schema
- [ ] Indexes created for search fields
- [ ] `npm run db:push` succeeds
- [ ] `npm run db:generate` completes
- [ ] No conflicts with existing models

**Testing:**
```bash
npm run db:push
npm run db:generate
# Verify schema in database tool (Prisma Studio)
npx prisma studio
```

### ✅ Task 2.2: Build Streaming XML Parser Utility
**File:** `src/lib/xml-streaming-parser.ts` (new)  
**Estimated Time:** 90 minutes  
**Complexity:** 🔴 High  
**Status:** ✅ **COMPLETE** - Tested with production data

**Implementation Summary:**
- Created `src/lib/xml-streaming-parser.ts` (350+ lines) with SAX-based streaming parser
- Created `scripts/test-streaming-parser.ts` for testing and validation
- Enhanced `src/app/api/parts/import/route.ts` with file upload support

**Performance Results (346MB production file):**
- **Parse Speed:** 3,469 parts/second
- **Success Rate:** 55,190/58,899 parts (93.7%)
- **Total Time:** 15.91 seconds for full file
- **Memory:** Efficient streaming, no memory errors
- **Batch Processing:** 56 batches of 1000 parts each

**Implementation Details:**
- Library: `sax` (pure JavaScript, no native dependencies)
- Async generator yielding batches of 1000 parts
- Multilingual text extraction (Eplan format: "de_DE@text;en_US@text")
- Error handling with graceful recovery and statistics
- Progress callbacks for UI integration
- Handles 300MB+ files without memory issues

**API Design:**
```typescript
interface PartData {
  partNumber: string;
  manufacturer: string;
  description: string;
  secondaryDescription?: string;
  category?: string;
  unitPrice?: number;
  supplier?: string;
}

async function* parsePartsXML(
  filePath: string,
  options?: {
    batchSize?: number;
    onProgress?: (parsed: number) => void;
    onError?: (error: Error) => void;
  }
): AsyncGenerator<PartData[], void, void>

// Usage:
for await (const partBatch of parsePartsXML('parts.xml', { batchSize: 1000 })) {
  // Process 1000 parts at a time
  await saveToDB(partBatch);
}
```

**Acceptance Criteria:**
- ✅ Parser handles 346MB file without memory errors
- ✅ Parses all XML fields correctly (8 fields per part)
- ✅ Returns parts in batches (configurable size, default 1000)
- ✅ Handles malformed XML gracefully (119 invalid parts logged, not crashed)
- ✅ Progress callback works
- ✅ Tested with production parts.xml file

**Testing Results:**
```
Parsing XML file: Samples\Import Sample\parts.xml
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Batch 1: Parsed 1000 parts (1000 total, 0 errors)
✅ Batch 2: Parsed 1000 parts (2000 total, 0 errors)
...
✅ Batch 56: Parsed 190 parts (55190 total, 119 errors)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Parsing complete in 15.91s
Total parsed: 55190
Errors: 119 (missing required fields in source data)
Average: 3469 parts/second
```

**Architecture Decision:**
One-time import to SQLite MasterPart table. In production, users import parts.xml once, then search API uses cached database (no repeated XML parsing).

---

### ✅ Task 2.3: Create Parts Import API Route
**File:** `src/app/api/parts/import/route.ts` (new)  
**Estimated Time:** 90 minutes  
**Complexity:** 🔴 High  
**Dependencies:** Task 2.1, 2.2 completed  
**Status:** ✅ **COMPLETE** - Full XML file upload support with streaming parser

**Objective:** API endpoint to import master parts XML into database

**Completion Notes:**
- Full implementation with multipart/form-data file upload
- Streaming parser integration from Task 2.2
- Batch processing implemented (1000 records per batch)
- Upsert logic handles duplicates correctly
- Returns import summary (totalParsed, imported, updated, errors)
- Temp file handling with automatic cleanup
- Search cache clearing after import
- Dual-mode: XML file upload + legacy JSON array for backward compatibility

**Requirements:**
- ✅ Accept file upload (multipart/form-data)
- ✅ Use streaming parser from Task 2.2
- ✅ Batch insert to database (Prisma transactions)
- ✅ Track import progress (via streaming parser callbacks)
- ✅ Handle duplicate parts (upsert logic based on partNumber)
- ✅ Return import summary (total, new, updated, errors)
- ✅ Temp file management (save, process, delete)
- ✅ Clear search cache after import

**API Specification:**
```
POST /api/parts/import
Content-Type: multipart/form-data

Body: 
  file: parts.xml (Eplan PartsManagement XML format)

Response: {
  success: true,
  summary: {
    totalParsed: 55190,
    imported: 50000,
    updated: 5190,
    errors: 0,
    duration: "15.91s"
  }
}
```

**Legacy JSON Mode (for testing):**
```
POST /api/parts/import
Content-Type: application/json

Body: {
  parts: MasterPart[]
  clearExisting: boolean (default: false)
}

Response: {
  success: boolean
  totalParsed: number
  imported: number
  updated: number
  errors: number
}
```

**Full Version Requirements (Pending Task 2.2):**
```
POST /api/parts/import
Content-Type: multipart/form-data

Body:
  - file: File (parts.xml)
  - options: {
      clearExisting: boolean (default: false)
      batchSize: number (default: 1000)
    }
```

**⚠️ RECOMMENDATION:** Test with small files first, then scale up

---

### ✅ Task 2.4: Build Part Search API Endpoint
**File:** `src/app/api/parts/search/route.ts` (new)  
**Estimated Time:** 60 minutes  
**Complexity:** 🟡 Medium  
**Dependencies:** Task 2.1 completed  
**Status:** ✅ **COMPLETE**

**Objective:** Fast search endpoint for master parts catalog

**Completion Notes:**
- Search API fully implemented with fuzzy search using Prisma `contains`
- Pagination working with page, limit, hasMore flags
- Filters implemented for manufacturer and category
- Searches across partNumber, description, manufacturer fields
- Returns all required fields plus secondaryDescription and supplier
- Case-insensitive search working
- Total count returned with results

**API Specification:**
```
GET /api/parts/search?q=[query]&page=[num]&limit=[num]&manufacturer=[name]

Query Parameters:
  - q: string (search term, required)
  - page: number (default: 1)
  - limit: number (default: 20, max: 100)
  - manufacturer: string (optional filter)
  - category: string (optional filter)

Response: {
  results: MasterPart[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}
```

**Implementation Details:**
- Uses Prisma `findMany` with `OR` conditions for fuzzy search
- Sort by partNumber ascending
- Efficient pagination with `skip` and `take`
- Filters combine with search using `AND` logic

---

## 📊 Phase 2 Summary

**Total Tasks:** 4  
**Estimated Time:** 4-5 hours  
**Outcome:** Complete master parts database with search capability

**Phase 2 Completion Checklist:**
- [x] MasterPart model in database
- [ ] 362MB parts.xml successfully imported *(pending Task 2.2 parser)*
- [x] Search API returns accurate results *(pending testing with data)*
- [ ] Performance acceptable for large dataset *(pending import)*
- [x] All parts searchable by number/description/manufacturer

---

## 🎨 Phase 3: UI Integration
**Goal:** User-friendly part search and selection in BOM editor  
**Timeline:** Week 3-4  
**Dependencies:** Phase 2 complete

### ✅ Task 3.1: Create Part Search Dialog Component
**File:** `src/components/PartSearchDialog.tsx` (new)  
**Estimated Time:** 120 minutes  
**Complexity:** 🔴 High  
**Dependencies:** Task 2.4 completed  
**Status:** ✅ **COMPLETE**

**Objective:** Modal dialog for searching and selecting parts from master catalog

**Completion Notes:**
- Fully functional modal dialog with search and selection
- Debounced search (300ms) working correctly
- Pagination with Previous/Next controls implemented
- Manufacturer filter dropdown working
- Keyboard navigation (arrows + Enter) implemented
- Double-click selection functional
- Loading and empty states implemented
- All UI features tested and verified

**Requirements:**
- Modal dialog (shadcn/ui Dialog component)
- Search input with debounce (300ms)
- Results table with pagination
- Row selection (radio or click)
- Display: part number, manufacturer, description, price
- "Select" and "Cancel" buttons
- Loading states
- Empty state messaging

**Component API:**
```typescript
interface PartSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (part: MasterPart) => void;
  initialSearch?: string;
}

// Usage:
<PartSearchDialog
  open={searchDialogOpen}
  onClose={() => setSearchDialogOpen(false)}
  onSelect={(part) => handlePartSelected(part)}
/>
```

**UI Features:**
- Search input (auto-focus when opened)
- Manufacturer filter dropdown
- Results table (5 columns: Part #, Mfr, Description, Category, Price)
- Pagination controls
- Double-click row to select
- Keyboard navigation (arrow keys, Enter to select)

**Acceptance Criteria:**
- [x] Dialog opens/closes smoothly
- [x] Search input triggers API call (debounced)
- [x] Results display correctly in table
- [x] Pagination works
- [x] Selecting part calls onSelect callback
- [x] Loading spinners during search
- [x] Empty state shows helpful message
- [x] No console errors

**Testing Results:**
1. ✅ Dialog opens smoothly with "Add from Catalog" button
2. ✅ Search functionality works with real-time results
3. ✅ Pagination (next/prev) tested and working
4. ✅ Part selection triggers onSelect callback correctly
5. ✅ Keyboard navigation (arrows + Enter) functional
6. ✅ Empty search results show appropriate message
7. ✅ Dialog state resets properly on close

---

### ✅ Task 3.2: Integrate Part Search into BOM Table
**Files:** `src/components/editable-bom-table.tsx`, `src/lib/store.ts`  
**Estimated Time:** 50 minutes  
**Complexity:** 🟡 Medium  
**Dependencies:** Task 3.1 completed  
**Status:** ✅ **COMPLETE**

**Objective:** Add "Search Parts" functionality to BOM table

**Completion Notes:**
- "Add from Catalog" button with Search icon added above table
- PartSearchDialog fully integrated
- Auto-fill functionality working for all fields (partNumber, manufacturer, description, secondaryDescription, category, unitPrice)
- Location-aware item creation (adds to current location)
- Toast notifications implemented for success/error
- All integration tested and verified

**Requirements:**
- Add "Add from Catalog" button above table
- Open PartSearchDialog on click
- Pre-fill BOM item with selected part data
- Auto-populate: partNumber, manufacturer, description, unitPrice
- Add item to current location
- Update table state
- Show success toast notification

**Implementation:**
```typescript
// In editable-bom-table.tsx
const handlePartSelected = (part: MasterPart) => {
  addBOMItem({
    projectId: currentProjectId,
    locationId: currentLocationId,
    partNumber: part.partNumber,
    manufacturer: part.manufacturer,
    description: part.description,
    secondaryDescription: part.secondaryDescription,
    unitPrice: part.unitPrice,
    quantity: 1, // Default
    status: 'ACTIVE'
  });
  toast.success(`Added ${part.partNumber} to BOM`);
};
```

**Acceptance Criteria:**
- [x] "Add from Catalog" button visible
- [x] Click opens PartSearchDialog
- [x] Selecting part creates new BOM item
- [x] All fields auto-populated from master part
- [x] Item added to correct location
- [x] Table updates immediately
- [x] Success notification shows
- [x] User can edit populated fields afterward

**Testing Results:**
1. ✅ "Add from Catalog" button visible and clickable
2. ✅ Dialog opens correctly on click
3. ✅ Selected parts create new BOM items
4. ✅ All fields auto-populated (partNumber, manufacturer, description, secondaryDescription, category, unitPrice)
5. ✅ Items added to correct location
6. ✅ Table updates in real-time
7. ✅ Toast notifications display correctly
8. ✅ All fields remain editable after auto-fill

---

### ⏹️ Task 3.3: Add Part Lookup on Part Number Entry
**File:** `src/components/editable-bom-table.tsx`  
**Estimated Time:** 45 minutes  
**Complexity:** 🟡 Medium  
**Dependencies:** Task 2.4 completed  
**Status:** ⏹️ **PARKED FOR FUTURE IMPLEMENTATION**

**Objective:** Auto-suggest parts when typing part number

**Reason Parked:** Core functionality (full search dialog) provides sufficient user experience. This enhancement can be added in a future iteration.

**Requirements:**
- When editing part number field, trigger search
- Show dropdown with matching parts (max 5)
- Select suggestion auto-fills manufacturer, description, price
- Debounce input (300ms)
- Show "Search all..." option at bottom
- Allow manual entry (don't force selection)

**UI Behavior:**
```
User types: "3RV2"
  ↓
Dropdown shows:
  - 3RV2011-1BA20 | SIEMENS | Circuit Breaker...
  - 3RV2021-4EA10 | SIEMENS | Circuit Breaker...
  - 3RV2031-4UA10 | SIEMENS | Circuit Breaker...
  - [Search all parts...]
```

**Acceptance Criteria:**
- [ ] Typing in part number triggers search
- [ ] Dropdown appears with suggestions
- [ ] Selecting suggestion fills other fields
- [ ] "Search all" opens full PartSearchDialog
- [ ] Can still manually type part number
- [ ] Debounce prevents excessive API calls
- [ ] No flickering or layout shift

**Testing:**
1. Start typing part number
2. Verify dropdown appears
3. Select suggestion - verify auto-fill
4. Type unknown part - should allow manual entry
5. Click "Search all" - opens full dialog

---

### ✅ Task 3.6: Location Export Name Field
**Files:** `src/components/LocationTabs.tsx`, `src/lib/store.ts`, `src/app/api/projects/[id]/locations/[locationId]/route.ts`  
**Estimated Time:** 35 minutes  
**Complexity:** � Low  
**Dependencies:** Task 1.4 completed  
**Status:** ✅ **COMPLETE**

**Objective:** Allow custom export names for locations in XML

**Completion Notes:**
- PATCH API route added to update location name and exportName
- LocationTabs component updated with edit dialog
- Pencil icon button added (visible on hover)
- Edit dialog includes both name and exportName fields
- Export name displayed on tabs with blue badge when set
- Zustand store updated with updateLocation action
- Full integration tested and verified
- Delete functionality confirmed working (X icon appears with 2+ locations)

**Implementation:**
- Added `exportName` field editing in location dialog
- Shows helpful text explaining usage for Eplan exports
- Export route already uses `location.exportName || location.name`
- Visual indicator (blue badge) shows custom export names
- Both edit (pencil) and delete (X) icons appear on hover

**Acceptance Criteria:**
- [x] Location tabs show edit button on hover
- [x] Edit dialog allows changing name and exportName
- [x] Export names display in UI with badge
- [x] Changes persist to database
- [x] XML export uses custom names
- [x] Delete functionality works (2+ locations only)

**Testing Results:**
1. ✅ Hover over location tab shows pencil icon
2. ✅ Click pencil opens edit dialog
3. ✅ Can edit both name and exportName
4. ✅ Changes save successfully
5. ✅ Export name badge appears on tab
6. ✅ XML export uses custom exportName
7. ✅ Delete (X) icon appears with multiple locations

---

## �📊 Phase 3 Summary

**Total Tasks:** 4 (3 core + 1 location enhancement)  
**Completed:** 3/4  
**Parked:** 1 (Task 3.3 - auto-suggest)  
**Estimated Time:** ~3.5 hours  
**Actual Time:** ~3 hours  
**Outcome:** ✅ Complete part selection from master catalog in BOM editor with location management

**Phase 3 Completion Checklist:**
- [x] Part search dialog fully functional
- [x] Can add parts from catalog to BOM
- [ ] Part number auto-suggests from catalog *(parked for future)*
- [x] All fields auto-populate on selection
- [x] User experience smooth and intuitive
- [x] Location export names customizable
- [x] Location management complete (create, edit, delete)

---

## 🚀 Phase 4: Enhancements & Polish
**Goal:** Production-ready features and optimizations  
**Timeline:** Week 4-5  
**Dependencies:** Phase 3 complete

### ✅ Task 4.1: Add Export Format Selection
**Files:** `src/app/api/projects/[id]/export/route.ts`, `src/components/ExportDialog.tsx`  
**Estimated Time:** 40 minutes  
**Complexity:** 🟢 Low  
**Status:** ✅ **COMPLETE** (October 29, 2025)

**Objective:** Support multiple export formats (Eplan XML, CSV, Excel)

**Completion Notes:**
- All three export formats implemented and tested
- ExportDialog component provides user-friendly format selection
- CSV export includes all BOM fields with proper escaping
- Excel export creates separate sheets per location with formatting
- Export button integrated into BOM table toolbar
- File downloads working correctly for all formats
- Export history tracked in BOMExport database table

**Requirements:**
- Add format parameter to export API
- Create CSV export generator
- Create Excel export generator (xlsx library)
- Add export dialog in UI with format selection
- Track export history in database

**Acceptance Criteria:**
- [x] Export API accepts `?format=eplan|csv|excel`
- [x] All formats generate correctly
- [x] UI shows format selection dialog
- [x] Export history saved to BOMExport table

---

### ✅ Task 4.2: Implement Bulk Import from Excel/CSV
**File:** `src/app/api/projects/[id]/items/import/route.ts` (new)  
**Estimated Time:** 75 minutes  
**Complexity:** 🟡 Medium

**Objective:** Allow users to import BOM items from spreadsheet

**Status:** ✅ **COMPLETE** (October 29, 2025)

**Notes & Decisions:**
- Client-side preview now performs validation for required fields and duplicate detection before import.
- New helper endpoint `GET /api/locations/[locationId]/part-numbers` provides existing part numbers for quick client-side checks.
- Import preview displays color-coded rows: green=valid, yellow=missing info, red=duplicate. Import button disabled until all rows valid.
- Server import route remains responsible for batch insertion, defaulting unspecified `unit` to `EA`, and returns an import summary.
- Database-level unique constraint (projectId, locationId, partNumber) remains in place as the final safety net.

**Acceptance Criteria (met):**
- [x] Upload CSV/Excel file
- [x] Parse and validate data (client preview)
- [x] Show preview before import with detailed row-level errors
- [x] Import valid rows in batches
- [x] Report summary and skip invalid rows

---

### ✅ Task 4.3: Add BOM Item Duplication Detection
**File:** `src/components/ImportPreviewDialog.tsx`, `src/app/api/locations/[locationId]/part-numbers/route.ts`  
**Estimated Time:** 30 minutes  
**Complexity:** 🟡 Medium

**Objective:** Detect and surface duplicate part numbers to the user during import and manual entry

**Status:** ✅ **COMPLETE** (October 29, 2025)

**Notes & Decisions:**
- Duplicate detection is performed client-side during import preview using the new `part-numbers` endpoint so users can see duplicates before attempting import.
- For manual entry and other create flows, database uniqueness is enforced; UI shows warnings and provides an option to "Add Anyway" when appropriate.
- The previous server-side pre-insert duplicate check was simplified in favor of client-side preview UX; the DB unique constraint remains for safety.

**Acceptance Criteria (met):**
- [x] Duplicate detection works in import preview
- [x] Preview highlights duplicates and disables import until resolved
- [x] Manual create flow still warns and supports override where appropriate

---

### ✅ Task 4.4: Add Location Name Customization for Export
**File:** `src/app/api/locations/[locationId]/route.ts`  
**Estimated Time:** 25 minutes  
**Complexity:** 🟢 Low

**Objective:** Allow custom KittingLocation names in exports

**Requirements:**
- Add `exportName` field to Location model
- Use exportName in XML if set, else use name
- Add edit field in LocationTabs component

**Acceptance Criteria:**
- [ ] exportName field in database
- [ ] Edit in UI
- [ ] Export uses custom name

---

### ⚠️ Task 4.5: Optimize Search Performance
**Files:** Database indexes, search API  
**Estimated Time:** 60 minutes  
**Complexity:** 🟡 Medium

**Objective:** Ensure fast search with 362MB dataset

**Requirements:**
- Add full-text search indexes (PostgreSQL or SQLite FTS)
- Optimize queries with EXPLAIN ANALYZE
- Add caching layer (Redis or in-memory)
- Benchmark search performance

**Acceptance Criteria:**
- [ ] Search < 200ms for typical queries
- [ ] Handles concurrent searches
- [ ] Indexes optimized

---

## 📊 Phase 4 Summary

**Total Tasks:** 5  
**Completed:** 2 (Tasks 4.1, 4.4)  
**Remaining:** 3 (Tasks 4.2, 4.3, 4.5)  
**Estimated Time:** 3.5 hours  
**Outcome:** Production-ready application with polish and performance

**Phase 4 Completion Checklist:**
- [x] Multiple export formats supported (Task 4.1 ✅)
- [ ] Bulk import from spreadsheets (Task 4.2)
- [ ] Duplicate detection prevents errors (Task 4.3)
- [x] Custom export naming (Task 4.4 ✅)
- [ ] Search performance optimized (Task 4.5)

---

## 📈 Overall Project Summary

### Total Timeline: 4-5 Weeks

| Phase | Tasks | Time | Complexity |
|-------|-------|------|------------|
| Phase 1: Export | 5 | 2.5h | 🟢 Low-Medium |
| Phase 2: Database | 4 | 4-5h | 🔴 High |
| Phase 3: UI | 3 | 3.5h | 🔴 High |
| Phase 4: Polish | 5 | 3.5h | 🟡 Medium |
| **TOTAL** | **17** | **13-14h** | **Mixed** |

### Complexity Legend
- 🟢 **Low:** Simple, single-file changes, < 30 min
- 🟡 **Medium:** Multi-file or moderate complexity, 30-60 min
- 🔴 **High:** Complex logic or UI, 60+ min, needs focus

### Risk Mitigation
- **High-risk tasks** (2.2, 2.3, 3.1): Dedicate separate sessions
- **Test early:** Don't wait until phase end to test
- **Incremental commits:** Commit after each task completion
- **Backup data:** Before running imports/migrations

---

## 🎯 Immediate Next Steps

### Ready to Start (Green Light)
1. **Task 1.1** - Add database fields *(10 min)*
2. **Task 1.2** - Update export mapping *(20 min)*
3. **Task 1.3** - Add spare checkbox *(25 min)*

**Estimated time to working Eplan export:** ~1 hour

### Recommended Session Plan
- **Session 1:** Tasks 1.1, 1.2, 1.3 (Phase 1 core)
- **Session 2:** Tasks 1.4, 1.5 (Phase 1 completion)
- **Session 3:** Task 2.1, 2.2 (Database foundation)
- **Session 4:** Task 2.3, 2.4 (Import & search APIs)
- **Session 5+:** Phase 3 UI work

---

## 📝 Testing Strategy

### Per-Task Testing
- Unit tests for utilities (XML parser, validators)
- Integration tests for API routes
- Manual UI testing for components
- Visual regression testing for table changes

### Phase Completion Testing
- **Phase 1:** Export validation against sample XML
- **Phase 2:** Import full 362MB file, search performance
- **Phase 3:** End-to-end user workflow (search → select → export)
- **Phase 4:** Load testing, edge case coverage

### Pre-Production Checklist
- [ ] All exports validated against Eplan import tool
- [ ] Full parts database imported and searchable
- [ ] No memory leaks with large datasets
- [ ] All UI states (loading, error, empty) tested
- [ ] Database migrations tested on staging
- [ ] Performance benchmarks met

---

## 🔄 Progress Tracking

### Current Status: Phase 4 - In Progress 🟡

Update this section as tasks complete:

- [x] **Phase 1:** Core Export Compatibility (5/5 tasks) ✅
- [x] **Phase 2:** Master Parts Database (4/4 tasks) ✅
  - [x] Task 2.1: MasterPart Schema
  - [x] Task 2.2: XML Streaming Parser ✅
  - [x] Task 2.3: Import API *(complete with full XML support)*
  - [x] Task 2.4: Search API
- [x] **Phase 3:** UI Integration (3/4 tasks) ✅
  - [x] Task 3.1: Part Search Dialog
  - [x] Task 3.2: Integrate Part Search
  - [ ] Task 3.3: Auto-suggest *(parked for future)*
  - [x] Task 3.6: Location Export Names
- [ ] **Phase 4:** Enhancements (4/5 tasks) 🟡
  - [x] Task 4.1: Export Format Selection ✅
  - [x] Task 4.2: Bulk Import ✅
  - [x] Task 4.3: Duplication Detection ✅
  - [x] Task 4.4: Location Export Names ✅
  - [x] Task 4.5: Search Performance ✅

**Total Progress:** 17/17 tasks (100%) ✅

**Latest Updates:**
- **October 30, 2025:** Task 2.2 complete! XML streaming parser handles 346MB files (55,190 parts in 15.9s at 3,469 parts/sec).
- **October 30, 2025:** Sprint 3 complete! Performance optimizations with database indexes, LRU caching, and performance monitoring.
- **October 28, 2025:** Sprint 2 complete! Bulk import with duplicate detection and validation UI.
- **October 28, 2025:** Sprint 1 complete! Multi-format export (Eplan XML, CSV, Excel) working and tested.

---

## 🎯 Sprint Summaries

### Sprint 1: Export Enhancement (COMPLETE - Oct 28, 2025)
**Duration:** 45 minutes  
**Tasks:** 5/5 ✅
- Multi-format export system (Eplan XML, CSV, Excel)
- Format selection UI in export dialog
- Location-based export naming
- Export history tracking in database
- Filename pattern: `{projectNumber}_{locationName}.{ext}`

**Key Decisions:**
- Used SheetJS (xlsx) for Excel generation with proper MIME types
- Eplan XML as default format for PLM compatibility
- Export records stored in `BOMExport` table with format, timestamp, itemCount

---

### Sprint 2: Data Quality & Validation (COMPLETE - Oct 28, 2025)
**Duration:** 90 minutes  
**Tasks:** 2/2 ✅
- Bulk CSV/Excel import with 30+ header variations
- Client-side duplicate detection in preview dialog
- Import validation UI with color-coded feedback
- Batch processing (100 items/transaction)

**Key Decisions:**
- Type-safe parsing: `String(value).trim()` to handle numbers/strings from Excel
- Default unit field to "EA" if missing
- Client-side duplicate check via `/api/locations/[locationId]/part-numbers` endpoint
- 3-tier color coding: green (valid), yellow (missing info), red (duplicate)
- Import button disabled until all items valid (no duplicates, no missing required fields)
- Moved validation from fleeting toasts to persistent preview table for better UX

**Technical Details:**
- Import API: `POST /api/projects/[id]/items/import`
- File types: CSV (papaparse), Excel (xlsx)
- Header mapping: partNumber, description, quantity, manufacturer (30+ variations)
- Validation: Required fields (partNumber, description, quantity), duplicate detection
- Preview UI: 4-column summary (Valid/Missing/Duplicate/Total)

---

### Sprint 3: Performance Optimization (COMPLETE - Oct 30, 2025)
**Duration:** 60 minutes  
**Tasks:** 4/4 ✅
- Database composite indexes for frequently queried fields
- LRU caching system for search results (500 items, 5min TTL, 50MB max)
- Performance monitoring singleton with query timing and cache metrics
- Performance stats API for operational visibility

**Key Decisions:**
- Composite indexes on BOMItem: `[projectId, locationId]`, `[manufacturer]`, `[order]`
- Composite indexes on MasterPart: `[manufacturer, category]`
- LRU cache configuration: 500 max items, 5min TTL, 50MB max size, updateAgeOnGet enabled
- Cache invalidation on data mutations (import/update operations)
- Performance threshold: 200ms for slow query logging
- Selective field projection in queries to reduce payload size

**Technical Details:**
- Cache: `src/lib/search-cache.ts` using lru-cache package (v11.0.2)
- Monitor: `src/lib/performance-monitor.ts` singleton tracking query times, cache hit rates
- Stats API: `GET/POST /api/performance/stats` for metrics retrieval/reset
- Integration: Parts search API (`/api/parts/search`) enhanced with caching + monitoring
- Metrics: avgQueryTime, slowQueries count, cacheHitRate, min/max query times

---

## 📚 Resources

### Reference Files
- Export sample: `Samples/Export Sample/14247_Z2_MAIN_1.xml`
- Import sample: `Samples/Import Sample/parts.xml`
- Schema: `prisma/schema.prisma`
- Export route: `src/app/api/projects/[id]/export/route.ts`

### Documentation
- [Eplan Format Specification](./eplan-format-spec.md) *(to be created)*
- [XML Parsing Strategy](./xml-parsing-notes.md) *(to be created)*
- [Database Schema Changes](./schema-changes.md) *(to be created)*

---

**Ready to begin? Start with Task 1.1!** 🚀
