# Sprint 2: Data Quality & Validation 🛡️
> **Duration:** 105 minutes (1.75 hours)  
> **Status:** ✅ IMPLEMENTED (October 29, 2025)  
> **Goal:** Bulk import and duplicate prevention

---

## 📋 Tasks

### Task 4.2: Bulk Import from Excel/CSV (75 min)
### Task 4.3: Duplication Detection (30 min)

---

## 🎯 Implementation Steps

### Phase A: Bulk Import (Task 4.2)

#### Step 1: Create Import API Route (25 min)
**File:** `src/app/api/projects/[id]/items/import/route.ts` (new)

**Features:**
- [ ] Accept multipart/form-data file upload
- [ ] Parse CSV using `csv-parse` library
- [ ] Parse Excel using `xlsx` library
- [ ] Column mapping logic (auto-detect or manual)
- [ ] Data validation (required fields, types)
- [ ] Batch insert with transactions
- [ ] Return import summary

**API Signature:**
```typescript
POST /api/projects/[id]/items/import
Content-Type: multipart/form-data

Body:
  - file: File (CSV or XLSX)
  - locationId: string
  - options: {
      headerRow: number (default: 1)
      skipRows: number (default: 0)
      columnMapping: { csvColumn: bomField }
    }

Response: {
  success: boolean
  summary: {
    totalRows: number
    imported: number
    skipped: number
    errors: Array<{ row: number, error: string }>
  }
}
```

#### Step 2: Create Import Preview Dialog (30 min)
**File:** `src/components/ImportPreviewDialog.tsx` (new)

**Features:**
- [ ] File upload dropzone
- [ ] Column mapping interface
- [ ] Preview table (first 10 rows)
- [ ] Validation error display
- [ ] Import/Cancel buttons
- [ ] Progress indicator

**UI Flow:**
1. User drops/selects file
2. Parse file and show preview
3. Auto-detect columns (match headers to BOM fields)
4. Allow manual column mapping if needed
5. Highlight validation errors in preview
6. User clicks "Import" → API call → success/error toast

#### Step 3: Integrate into BOM Table (10 min)
**File:** `src/components/editable-bom-table.tsx`

**Tasks:**
- [ ] Add "Import" button next to "Add from Catalog"
- [ ] Open ImportPreviewDialog on click
- [ ] Refresh table after successful import
- [ ] Show import summary toast

#### Step 4: Add Validation Logic (10 min)
**File:** `src/lib/import-validator.ts` (new)

**Validation Rules:**
- [ ] Required fields: partNumber, description, quantity
- [ ] Quantity must be positive number
- [ ] Unit price must be valid decimal or empty
- [ ] Status must be valid enum value
- [ ] Part number max length 100 chars
- [ ] Description max length 500 chars

---

### Phase B: Duplication Detection (Task 4.3)

#### Step 1: Add Duplicate Check to Create API (15 min)
**File:** `src/app/api/projects/[id]/items/route.ts`

**Logic:**
```typescript
// Before creating item
const existing = await db.bOMItem.findFirst({
  where: {
    projectId,
    locationId,
    partNumber: data.partNumber
  }
});

if (existing && !data.forceCreate) {
  return NextResponse.json({
    duplicate: true,
    existingItem: existing
  }, { status: 409 });
}

// Proceed with creation if forceCreate=true
```

#### Step 2: Create Duplicate Warning Dialog (10 min)
**File:** `src/components/DuplicateWarningDialog.tsx` (new)

**Features:**
- [ ] Show existing item details
- [ ] Show new item details (side-by-side comparison)
- [ ] "Cancel" and "Add Anyway" buttons
- [ ] Optional: "Update Existing" button

#### Step 3: Integrate Duplicate Check (5 min)
**Files:** 
- `src/components/editable-bom-table.tsx`
- `src/components/PartSearchDialog.tsx`

**Logic:**
- Intercept 409 response from API
- Show DuplicateWarningDialog
- If user confirms, retry with `forceCreate: true`
- If user cancels, abort creation

---

## ✅ Validation Checklist

### Import Feature (Task 4.2)
- [ ] CSV files upload and parse correctly
- [ ] Excel files (.xlsx) upload and parse correctly
- [ ] Column auto-detection works for standard headers
- [ ] Manual column mapping functional
- [ ] Required field validation catches missing data
- [ ] Data type validation catches invalid numbers
- [ ] Preview shows first 10 rows accurately
- [ ] Error rows highlighted in red with message
- [ ] Valid rows highlighted in green
- [ ] Import processes all valid rows
- [ ] Skipped rows counted correctly
- [ ] Import summary accurate
- [ ] Progress indicator shows during import
- [ ] Large files (100+ rows) import without timeout
- [ ] Transactions rollback on error
- [ ] BOM table refreshes after import
- [ ] Success toast shows summary

### Duplication Detection (Task 4.3)
- [ ] Duplicate check triggers before insert
- [ ] Check scoped to projectId + locationId
- [ ] Different locations allow same part number
- [ ] Warning dialog shows existing item details
- [ ] Warning dialog shows new item details
- [ ] User can cancel without adding item
- [ ] User can confirm and add duplicate
- [ ] forceCreate flag bypasses duplicate check
- [ ] No false positives (case sensitivity, whitespace)
- [ ] Works with manual entry
- [ ] Works with catalog selection
- [ ] Works with bulk import
- [ ] Multiple duplicates handled gracefully

---

## 🧪 Test Cases

### Test Case 1: Valid CSV Import
**Setup:**
```csv
Part Number,Manufacturer,Description,Quantity,Unit Price
ABC123,ACME Corp,Widget Assembly,10,25.50
XYZ789,TechCo,Sensor Module,5,150.00
DEF456,ACME Corp,Control Board,2,300.00
```

**Expected:**
- Upload succeeds
- All 3 rows valid (green)
- Import creates 3 BOM items
- Summary: 3 imported, 0 skipped, 0 errors

### Test Case 2: CSV with Validation Errors
**Setup:**
```csv
Part Number,Manufacturer,Description,Quantity,Unit Price
ABC123,ACME Corp,Widget Assembly,10,25.50
,TechCo,Missing Part Number,-5,BAD_PRICE
DEF456,,Control Board,2,300.00
```

**Expected:**
- Row 2 highlighted red: "Part number required", "Quantity must be positive", "Invalid price"
- Row 1, 3 highlighted green
- Import creates 2 items
- Summary: 2 imported, 1 skipped, 3 errors (row 2)

### Test Case 3: Excel Multi-Sheet Import
**Setup:**
- Excel file with 3 sheets: "Panel 1", "Panel 2", "Summary"
- First sheet has valid data

**Expected:**
- Only first sheet imported
- Preview shows sheet name
- Optional: Future enhancement to select sheet

### Test Case 4: Duplicate Detection - Manual Entry
**Setup:**
1. Add item: Part Number "ABC123" to Location "Panel 1"
2. Try adding "ABC123" again to same location

**Expected:**
- Warning dialog appears
- Shows existing item with quantity, price
- User clicks "Cancel" → no duplicate created
- Try again, click "Add Anyway" → duplicate created

### Test Case 5: Duplicate Detection - Different Location
**Setup:**
1. Add item "ABC123" to "Panel 1"
2. Add item "ABC123" to "Panel 2"

**Expected:**
- No warning (different locations)
- Both items created successfully

### Test Case 6: Bulk Import with Duplicates
**Setup:**
```csv
Part Number,Description,Quantity
ABC123,Widget,10
ABC123,Widget Duplicate,5
XYZ789,Sensor,2
```

**Expected:**
- Row 2 flagged as duplicate of row 1
- Preview shows warning
- User chooses to skip duplicates or import all
- Summary reflects duplicates handled

### Test Case 7: Large Import Performance
**Setup:**
- CSV with 500 rows

**Expected:**
- Upload and parse < 5 seconds
- Preview shows first 10 rows
- Import completes < 10 seconds
- No timeout errors
- Progress indicator updates

---

## 📊 Column Mapping Reference

### Standard CSV Headers (Auto-Detected)
| CSV Header (case-insensitive) | BOM Field |
|-------------------------------|-----------|
| Part Number, PartNumber, Part#, P/N | partNumber |
| Manufacturer, Mfr, Vendor | manufacturer |
| Description, Desc, Name | description |
| Description 2, Desc2, Secondary Description | secondaryDescription |
| Quantity, Qty, Count | quantity |
| Unit Price, Price, Cost, Unit Cost | unitPrice |
| Category, Type | category |
| Status | status |
| Spare, Is Spare, Spare Part | isSpare |
| Reference, Ref, Tag, Reference Designator | referenceDesignator |
| Supplier | supplier |

### Required Fields
- ✅ Part Number
- ✅ Description
- ✅ Quantity

### Optional Fields
- Manufacturer
- Unit Price
- Category
- Status (defaults to ACTIVE)
- isSpare (defaults to false)
- Reference Designator
- Secondary Description
- Supplier

---

## 🐛 Known Issues / Edge Cases

1. **Excel Date Formatting:** Dates in Excel may parse as numbers
   - Solution: Convert Excel serial dates to strings

2. **CSV Encoding:** Files with non-UTF-8 encoding
   - Solution: Auto-detect encoding or require UTF-8

3. **Large Files:** Files > 10MB may timeout
   - Solution: Client-side chunking or streaming upload

4. **Duplicate Headers:** CSV with multiple columns named "Description"
   - Solution: Append column index to header (Description_1, Description_2)

5. **Case Sensitivity:** "ABC123" vs "abc123" as duplicates
   - Solution: Normalize part numbers to uppercase before comparison

6. **Whitespace:** "ABC123 " vs "ABC123" as duplicates
   - Solution: Trim whitespace before duplicate check

---

## 📈 Success Metrics

- [ ] **Import Speed:** 100 rows imported in < 5 seconds
- [ ] **Accuracy:** 95%+ auto-column mapping success rate
- [ ] **Error Handling:** All validation errors clearly communicated
- [ ] **Duplicate Prevention:** Zero unintended duplicates in production
- [ ] **User Satisfaction:** Import saves 80%+ time vs manual entry

---

## 🚀 Dependencies

### NPM Packages
```bash
npm install csv-parse
npm install formidable  # For file upload handling
npm install --save-dev @types/formidable
```

### Files to Create
1. `src/app/api/projects/[id]/items/import/route.ts`
2. `src/components/ImportPreviewDialog.tsx`
3. `src/components/DuplicateWarningDialog.tsx`
4. `src/lib/import-validator.ts`
5. `src/lib/csv-parser.ts`

### Files to Modify
1. `src/components/editable-bom-table.tsx` - Add import button
2. `src/app/api/projects/[id]/items/route.ts` - Add duplicate check
3. `src/lib/store.ts` - Add import action (if needed)

---

## 📝 Implementation Log

### Session 1: Import API (Expected: 45 min | Actual: ~30 min)
- [x] Install dependencies (csv-parse, papaparse)
- [x] Create import API route
- [x] Add CSV parser utility
- [x] Add Excel parser utility
- [x] Add validation logic
- [x] Test API structure (compilation successful)

### Session 2: Import UI (Expected: 30 min | Actual: ~35 min)
- [x] Create ImportPreviewDialog component
- [x] Add file upload dropzone with drag-and-drop
- [x] Implement column auto-mapping
- [x] Add preview table with validation indicators
- [x] Add summary stats (valid/invalid counts)
- [x] Integrate into BOM table
- [x] Test UI rendering

### Session 3: Duplication (Expected: 30 min | Actual: ~15 min)
- [x] Add duplicate check to items API with forceCreate flag
- [x] Return 409 status with duplicate details
- [x] Create DuplicateWarningDialog component
- [x] Ready for integration testing

**Total Actual Time:** ~80 minutes (est. 105 min)  
**Blockers:** None  
**Notes:** 
- Import API supports both CSV and Excel files
- Auto-column mapping works with common header variations
- Preview shows first 50 rows for performance
- Batch processing (100 items per transaction)
- Duplicate detection returns conflict status for UI handling

---

**Status:** ✅ **IMPLEMENTATION COMPLETE**  
### Decisions & Notes (implementation summary)

- Duplicate detection moved to client-side preview for a better UX: when a file is selected a fast query against `GET /api/locations/[locationId]/part-numbers` is performed and duplicates are flagged in the preview.
- Preview now highlights rows using three states: green (valid), yellow (missing info), red (duplicate). The Import button is disabled until the preview contains zero missing info and zero duplicates.
- The server import route (`POST /api/projects/[id]/items/import`) continues to perform parsing and batch insertion; it defaults `unit` to `EA` if missing and returns a concise import summary. The database unique constraint on `(projectId, locationId, partNumber)` remains the final safety net.
- For manual create flows, the UI shows duplicate warnings and offers an "Add Anyway" option; DB uniqueness still prevents accidental silent duplicates.
- Long error lists are surfaced in the preview table (persistent) rather than ephemeral toasts; final toasts are simplified to success/no-items-imported messages.

### Files changed (implementation)
- `src/app/api/projects/[id]/items/import/route.ts` — Import API (batch insert, validation)
- `src/app/api/locations/[locationId]/part-numbers/route.ts` — New helper endpoint to fetch existing part numbers
- `src/components/ImportPreviewDialog.tsx` — Preview UI, duplicate detection, color-coded rows, import gating
- `src/components/DuplicateWarningDialog.tsx` — Duplicate warning UI (manual entry flows)

### Testing notes
- Tested with sample Excel/CSV files. Duplicate-heavy file showed all rows as red and import button disabled. Partial duplicates allowed successful import of valid rows when duplicates removed.

**Next:** Manual testing with sample CSV/Excel files  
**Ready for:** User acceptance testing
