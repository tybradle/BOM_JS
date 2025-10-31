# Feature: Auto-Add Missing Parts to Database During Import

## Overview
When importing BOM items from external files (CSV/Excel), detect parts that don't exist in the `MasterPart` database and provide an option to automatically save them to the database during the import process.

## Current System Analysis

### Current Import Flow
1. User uploads CSV/Excel file via `ImportPreviewDialog.tsx`
2. File is parsed client-side (Papa Parse for CSV, XLSX for Excel)
3. Validation checks for:
   - Missing required fields (part number, description, quantity)
   - Duplicate part numbers within the location
4. Valid rows are imported to BOMItem table
5. Invalid/duplicate rows are rejected

### Current Database Structure
- **MasterPart Table**: Global parts database with fields:
  - `partNumber` (unique)
  - `manufacturer`
  - `description`
  - `secondaryDescription`
  - `category`
  - `unitPrice`
  - `currency`
  - `supplier`
  - `source` (defaults to "csv-import")
  
- **BOMItem Table**: Project-specific BOM entries
  - Unique constraint: `[projectId, locationId, partNumber]`
  - No foreign key to MasterPart (loose coupling)

### Gap Analysis
- No check to see if imported parts exist in MasterPart database
- No mechanism to add missing parts to MasterPart during import
- Parts can exist in BOM but not in master catalog (data fragmentation)

---

## Implementation Task List

### Phase 1: Detection & UI Preview (High Priority)

#### Task 1.1: API Endpoint - Check Missing Parts
**File**: `src/app/api/parts/check-missing/route.ts` (NEW)

**Description**: Create endpoint to batch check which part numbers don't exist in MasterPart database

**Implementation Details**:
```typescript
// POST /api/parts/check-missing
// Body: { partNumbers: string[] }
// Returns: { missing: string[], existing: string[] }
```

**Steps**:
- Accept array of part numbers
- Query MasterPart table for matching partNumbers
- Return list of missing vs existing part numbers
- Add performance monitoring for large batches

**Acceptance Criteria**:
- ✅ Handles up to 500 part numbers in single request
- ✅ Returns results within 500ms for typical batch sizes
- ✅ Properly handles case-sensitivity (partNumber exact match)

---

#### Task 1.2: Enhance Import Preview Dialog - Add Missing Parts Detection
**File**: `src/components/ImportPreviewDialog.tsx`

**Description**: After parsing file, check which parts are missing from MasterPart database and display in preview

**Implementation Details**:
1. After successful file parse, extract unique part numbers
2. Call `/api/parts/check-missing` endpoint
3. Add new state:
   ```typescript
   const [missingParts, setMissingParts] = useState<Set<string>>(new Set())
   const [checkingDatabase, setCheckingDatabase] = useState(false)
   ```
4. Update ParsedRow interface:
   ```typescript
   interface ParsedRow {
     data: any
     isValid: boolean
     errors: string[]
     rowNumber: number
     errorType?: 'missing' | 'duplicate' | 'not_in_database'
     isMissingFromDatabase?: boolean
   }
   ```

**Steps**:
- Add database check after file parsing succeeds
- Mark rows with parts not in database (informational, not error)
- Update summary stats to show "X parts not in database"
- Add visual indicator (orange badge) for rows with missing parts

**Acceptance Criteria**:
- ✅ Database check happens automatically after file parse
- ✅ Preview shows which rows have parts missing from database
- ✅ Does NOT block import (informational only)
- ✅ Loading state while checking database

---

#### Task 1.3: Add Summary Card for Missing Parts
**File**: `src/components/ImportPreviewDialog.tsx`

**Description**: Add a fourth summary card showing "Not in Database" count

**Implementation Details**:
```tsx
<div className="p-3 border rounded-lg">
  <div className="flex items-center gap-2 mb-1">
    <AlertCircle className="h-4 w-4 text-orange-600" />
    <span className="text-sm font-medium">Not in Database</span>
  </div>
  <p className="text-2xl font-bold">{missingFromDbCount}</p>
  <p className="text-xs text-muted-foreground mt-1">
    Can be added on import
  </p>
</div>
```

**Steps**:
- Add to existing stats grid (make it 4 columns)
- Count unique part numbers not in database
- Show orange warning icon (not red error)

**Acceptance Criteria**:
- ✅ Displays count of unique parts not in master database
- ✅ Distinct from "Missing Info" and "Duplicate" errors
- ✅ Clear messaging that these CAN be added

---

### Phase 2: Checkbox Option & Backend Logic (High Priority)

#### Task 2.1: Add Checkbox to Import Dialog
**File**: `src/components/ImportPreviewDialog.tsx`

**Description**: Add checkbox option to automatically save missing parts to database

**Implementation Details**:
```tsx
const [addMissingToDatabase, setAddMissingToDatabase] = useState(true)

// In dialog footer, before Import button
{missingFromDbCount > 0 && (
  <div className="flex items-center gap-2 text-sm">
    <Checkbox
      id="add-to-database"
      checked={addMissingToDatabase}
      onCheckedChange={(checked) => setAddMissingToDatabase(checked as boolean)}
    />
    <label htmlFor="add-to-database" className="cursor-pointer">
      Add {missingFromDbCount} missing part{missingFromDbCount !== 1 ? 's' : ''} to database
    </label>
  </div>
)}
```

**Steps**:
- Add checkbox state with default TRUE
- Only show when missingFromDbCount > 0
- Position in dialog footer, left-aligned before buttons
- Include part count in label text
- Send checkbox value in FormData to import API

**Acceptance Criteria**:
- ✅ Checkbox defaults to checked (opt-out, not opt-in)
- ✅ Only visible when there are missing parts
- ✅ Clear label showing how many parts will be added
- ✅ Checkbox state sent to backend

---

#### Task 2.2: Update Import API - Extract Missing Part Data
**File**: `src/app/api/projects/[id]/items/import/route.ts`

**Description**: During validation, extract full data for parts that need to be added to MasterPart

**Implementation Details**:
```typescript
interface PartToAdd {
  partNumber: string
  manufacturer: string
  description: string
  secondaryDescription?: string
  category?: string
  unitPrice?: number
  currency?: string
  supplier?: string
}

// During row validation, build list of unique parts
const partsToAddMap = new Map<string, PartToAdd>()

validRows.forEach(row => {
  const partKey = row.partNumber.trim()
  if (!partsToAddMap.has(partKey)) {
    partsToAddMap.set(partKey, {
      partNumber: row.partNumber,
      manufacturer: row.manufacturer || 'Unknown',
      description: row.description,
      secondaryDescription: row.secondaryDescription,
      category: row.category,
      unitPrice: row.unitPrice,
      currency: 'USD', // Default or from row
      supplier: row.supplier
    })
  }
})
```

**Steps**:
- Add `addToDatabase` field to request body (from FormData)
- During row processing, build Map of unique parts to add
- Use Map to deduplicate (same part number might appear multiple times)
- Store first occurrence of each part number with full metadata

**Acceptance Criteria**:
- ✅ Deduplicates part numbers (import 10 qty of same part = 1 database entry)
- ✅ Captures all relevant fields from import data
- ✅ Defaults manufacturer to 'Unknown' if missing
- ✅ Only processes if addToDatabase flag is true

---

#### Task 2.3: API Endpoint - Batch Add Missing Parts
**File**: `src/app/api/parts/batch-create/route.ts` (NEW)

**Description**: Create endpoint to batch insert parts into MasterPart table with conflict handling

**Implementation Details**:
```typescript
// POST /api/parts/batch-create
// Body: { parts: PartToAdd[], source?: string }
// Returns: { created: number, skipped: number, errors: string[] }

export async function POST(request: NextRequest) {
  const { parts, source = 'bom-import' } = await request.json()
  
  const created: string[] = []
  const skipped: string[] = []
  const errors: string[] = []
  
  for (const part of parts) {
    try {
      // Check if part exists
      const existing = await db.masterPart.findUnique({
        where: { partNumber: part.partNumber }
      })
      
      if (existing) {
        skipped.push(part.partNumber)
        continue
      }
      
      // Create new part
      await db.masterPart.create({
        data: {
          partNumber: part.partNumber,
          manufacturer: part.manufacturer,
          description: part.description,
          secondaryDescription: part.secondaryDescription,
          category: part.category,
          unitPrice: part.unitPrice,
          currency: part.currency,
          supplier: part.supplier,
          source,
          importDate: new Date()
        }
      })
      
      created.push(part.partNumber)
    } catch (error) {
      errors.push(`${part.partNumber}: ${error.message}`)
    }
  }
  
  return NextResponse.json({ created: created.length, skipped: skipped.length, errors })
}
```

**Steps**:
- Create new API route for batch creation
- Use individual creates with try-catch (more reliable than createMany for conflict handling)
- Check for existing parts before creating (race condition protection)
- Return detailed results (created, skipped, errors)
- Set source to 'bom-import' to distinguish from master parts uploads

**Acceptance Criteria**:
- ✅ Handles duplicate part numbers gracefully (skip, don't error)
- ✅ Returns detailed results for user feedback
- ✅ Sets appropriate source field for audit trail
- ✅ Validates required fields before insert

---

#### Task 2.4: Integrate Batch Create into Import Flow
**File**: `src/app/api/projects/[id]/items/import/route.ts`

**Description**: Call batch-create API before importing BOM items

**Implementation Details**:
```typescript
// After building partsToAddMap, before importing BOM items
if (addToDatabase && partsToAddMap.size > 0) {
  console.log(`Adding ${partsToAddMap.size} parts to database...`)
  
  const partsArray = Array.from(partsToAddMap.values())
  
  const batchResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/parts/batch-create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      parts: partsArray,
      source: 'bom-import'
    })
  })
  
  const batchResult = await batchResponse.json()
  console.log(`Database update: ${batchResult.created} created, ${batchResult.skipped} skipped`)
  
  // Store for response summary
  databaseAddResults = batchResult
}
```

**Steps**:
- Check if addToDatabase flag is true
- Convert partsToAddMap to array
- Make internal API call to batch-create endpoint
- Log results for debugging
- Include results in final import summary response

**Acceptance Criteria**:
- ✅ Only runs if checkbox was checked
- ✅ Runs BEFORE BOM items are created (maintains referential integrity conceptually)
- ✅ Errors in database add don't block BOM import (soft failure)
- ✅ Results included in import response

---

### Phase 3: User Feedback & Polish (Medium Priority)

#### Task 3.1: Update Import Success Toast
**File**: `src/components/ImportPreviewDialog.tsx`

**Description**: Show comprehensive success message including database additions

**Implementation Details**:
```typescript
if (result.summary.imported > 0) {
  let description = `Successfully imported ${result.summary.imported} items`
  
  if (result.databaseAdded?.created > 0) {
    description += `\nAdded ${result.databaseAdded.created} new parts to database`
  }
  
  if (result.databaseAdded?.skipped > 0) {
    description += `\n${result.databaseAdded.skipped} parts already existed`
  }
  
  toast.success('Import complete!', { description })
}
```

**Steps**:
- Update import response type to include databaseAdded results
- Build multi-line toast description
- Show both BOM import count and database additions
- Use success toast (green) for overall success

**Acceptance Criteria**:
- ✅ Shows total items imported
- ✅ Shows parts added to database (if any)
- ✅ Shows parts skipped (already in database)
- ✅ Clear, concise messaging

---

#### Task 3.2: Add Visual Indicator in Preview Table
**File**: `src/components/ImportPreviewDialog.tsx`

**Description**: Add badge/icon to preview rows that will add part to database

**Implementation Details**:
```tsx
// In table cell for Part Number
<TableCell className="font-medium">
  <div className="flex items-center gap-2">
    {getFieldValue(row.data, ['part number', ...])}
    {row.isMissingFromDatabase && addMissingToDatabase && (
      <Badge variant="outline" className="text-orange-600 border-orange-600">
        <Plus className="h-3 w-3 mr-1" />
        New
      </Badge>
    )}
  </div>
</TableCell>
```

**Steps**:
- Add "New" badge to part numbers that will be added to database
- Only show if checkbox is checked
- Use orange color (warning/info, not error)
- Include Plus icon for clarity

**Acceptance Criteria**:
- ✅ Badge only shows when part is missing AND checkbox is checked
- ✅ Visually distinct from error indicators
- ✅ Doesn't clutter the UI

---

#### Task 3.3: Add Database Check Loading State
**File**: `src/components/ImportPreviewDialog.tsx`

**Description**: Show loading indicator while checking which parts exist in database

**Implementation Details**:
```tsx
{checkingDatabase && (
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <Loader2 className="h-4 w-4 animate-spin" />
    Checking database...
  </div>
)}
```

**Steps**:
- Add loading state between file parse and preview display
- Show spinner with "Checking database..." message
- Position above preview table
- Auto-hide when check completes

**Acceptance Criteria**:
- ✅ Clear feedback that database check is in progress
- ✅ Doesn't block file preview (can show partial results)
- ✅ Smooth transition to final state

---

### Phase 4: Edge Cases & Error Handling (Medium Priority)

#### Task 4.1: Handle Database Add Failures Gracefully
**File**: `src/app/api/projects/[id]/items/import/route.ts`

**Description**: Ensure BOM import succeeds even if database add partially fails

**Implementation Details**:
```typescript
let databaseAddResults = null
try {
  if (addToDatabase && partsToAddMap.size > 0) {
    const response = await fetch('/api/parts/batch-create', {...})
    databaseAddResults = await response.json()
    
    if (databaseAddResults.errors.length > 0) {
      console.warn('Some parts failed to add to database:', databaseAddResults.errors)
    }
  }
} catch (error) {
  console.error('Database add failed, continuing with BOM import:', error)
  // Don't throw - let BOM import continue
}

// BOM import proceeds regardless
```

**Steps**:
- Wrap database add in try-catch
- Log errors but don't throw
- BOM import always succeeds if items are valid
- Include partial results in response

**Acceptance Criteria**:
- ✅ BOM import never fails due to database add issues
- ✅ Errors are logged for debugging
- ✅ User gets partial success feedback

---

#### Task 4.2: Handle Conflicting Data for Same Part Number
**File**: `src/app/api/parts/batch-create/route.ts`

**Description**: When multiple import rows have same part number but different metadata, use smart merge logic

**Implementation Details**:
```typescript
// In import route, when building partsToAddMap
if (!partsToAddMap.has(partKey)) {
  partsToAddMap.set(partKey, {...})
} else {
  // Part number already seen - merge metadata
  const existing = partsToAddMap.get(partKey)!
  
  // Prefer more complete data
  if (!existing.manufacturer && row.manufacturer) {
    existing.manufacturer = row.manufacturer
  }
  if (!existing.category && row.category) {
    existing.category = row.category
  }
  // etc...
}
```

**Steps**:
- When duplicate part number found, merge metadata
- Prefer non-empty values
- For conflicting values, keep first occurrence
- Log conflicts for review

**Acceptance Criteria**:
- ✅ Doesn't create duplicate database entries
- ✅ Captures most complete metadata available
- ✅ Conflicts are logged but don't fail import

---

#### Task 4.3: Add Validation for Database Add
**File**: `src/app/api/parts/batch-create/route.ts`

**Description**: Validate part data before attempting database insert

**Implementation Details**:
```typescript
function validatePartData(part: PartToAdd): string[] {
  const errors: string[] = []
  
  if (!part.partNumber || part.partNumber.trim() === '') {
    errors.push('Part number is required')
  }
  
  if (!part.manufacturer || part.manufacturer.trim() === '') {
    errors.push('Manufacturer is required')
  }
  
  if (!part.description || part.description.trim() === '') {
    errors.push('Description is required')
  }
  
  if (part.unitPrice !== undefined && part.unitPrice < 0) {
    errors.push('Unit price must be positive')
  }
  
  return errors
}
```

**Steps**:
- Create validation function for MasterPart requirements
- Validate before attempting insert
- Return detailed error messages
- Skip invalid parts with warning

**Acceptance Criteria**:
- ✅ Catches invalid data before database operation
- ✅ Provides clear error messages
- ✅ Doesn't block valid parts from being added

---

### Phase 5: Testing & Documentation (High Priority)

#### Task 5.1: Create Test CSV with Missing Parts
**File**: `test_files/import-with-missing-parts.csv`

**Description**: Create test file with mix of existing and non-existing parts

**Implementation Details**:
```csv
Part Number,Description,Quantity,Manufacturer,Category
AB-1234,Existing Part 1,5,Allen-Bradley,PLC
NEW-001,New Part 1,10,NewVendor,Motor
AB-5678,Existing Part 2,2,Allen-Bradley,I/O
NEW-002,New Part 2,15,NewVendor,Sensor
```

**Steps**:
- Create CSV with known existing parts (from current database)
- Add fictional part numbers that don't exist
- Include complete metadata for new parts
- Test with/without checkbox checked

**Acceptance Criteria**:
- ✅ File parses successfully
- ✅ Clearly identifies which parts are missing
- ✅ Checkbox controls database addition behavior

---

#### Task 5.2: Manual Testing Checklist
**File**: `docs/TESTING_AUTO_ADD_PARTS.md` (NEW)

**Description**: Create comprehensive manual test plan

**Test Cases**:
1. Import with all existing parts → no database additions
2. Import with all new parts → all added to database
3. Import with mix → only new ones added
4. Import same file twice → second time skips all (already exist)
5. Uncheck checkbox → parts NOT added to database
6. Import with invalid data → BOM import fails, no database pollution
7. Import 100+ parts → performance check
8. Database add fails → BOM import still succeeds

**Acceptance Criteria**:
- ✅ All test cases documented
- ✅ Expected outcomes defined
- ✅ Actual results recorded

---

#### Task 5.3: Update User Documentation
**File**: `docs/USER_GUIDE_IMPORT.md` (NEW or update README)

**Description**: Document the new auto-add feature for users

**Content**:
- How to import BOMs with missing parts
- What the "Not in Database" indicator means
- When to check/uncheck the auto-add option
- What happens to parts added via BOM import
- How to review parts added to database

**Acceptance Criteria**:
- ✅ Clear step-by-step instructions
- ✅ Screenshots of preview dialog
- ✅ Explains checkbox behavior
- ✅ Covers common questions

---

### Phase 6: Future Enhancements (Low Priority)

#### Task 6.1: Conflict Resolution UI
**Description**: If part exists with different metadata, show diff and let user choose

**Future Implementation**:
- Detect when imported part has different manufacturer/description than database
- Show side-by-side comparison
- Allow user to update database or keep existing
- Requires more complex UI modal

---

#### Task 6.2: Bulk Edit Before Add
**Description**: Allow editing part details before adding to database

**Future Implementation**:
- Show expanded preview of parts to be added
- Allow inline editing of manufacturer, category, etc.
- "Review & Edit" button expands details panel
- Useful for cleaning up data before database addition

---

#### Task 6.3: Source Tracking & Audit Trail
**Description**: Track which BOM import added which parts

**Future Implementation**:
- Add `addedByProject` field to MasterPart
- Store import timestamp and user
- Allow filtering database by source
- "View import history" for each part

---

## Summary & Recommendations

### Recommended Implementation Order
1. **Start with Phase 1** (Detection & UI Preview) - Gets visibility without changing behavior
2. **Then Phase 2** (Checkbox & Backend) - Adds the core functionality
3. **Then Phase 5** (Testing) - Validates everything works
4. **Then Phase 3** (Polish) - Improves user experience
5. **Finally Phase 4** (Edge Cases) - Hardens the implementation

### Estimated Effort
- Phase 1: 4-6 hours (API + UI detection)
- Phase 2: 6-8 hours (Backend integration + batch create)
- Phase 3: 2-3 hours (UI polish)
- Phase 4: 3-4 hours (Error handling)
- Phase 5: 2-3 hours (Testing & docs)
- **Total: 17-24 hours**

### Key Technical Decisions

1. **Opt-Out vs Opt-In**: Checkbox defaults to **checked** (opt-out)
   - Rationale: Most users will want parts added, make it easy
   - Power users can uncheck if needed

2. **Batch Insert Strategy**: Individual creates with error handling vs single createMany
   - Rationale: Better conflict handling, more resilient
   - Trade-off: Slightly slower for large batches

3. **Data Deduplication**: Use Map keyed by partNumber
   - Rationale: Ensures only one database entry per part number
   - Merge strategy for conflicting metadata

4. **Error Handling Philosophy**: Soft failures for database adds
   - Rationale: BOM import should always succeed if data is valid
   - Database addition is "nice to have", not required

5. **Source Attribution**: Use `source: 'bom-import'` field
   - Rationale: Distinguishes from master parts uploads
   - Enables future audit/tracking features

### Potential Issues & Mitigations

| Issue | Impact | Mitigation |
|-------|--------|------------|
| Race condition: Part added between check and insert | Low | Use unique constraint + skip on conflict |
| Large import performance (500+ parts) | Medium | Batch processing, show progress indicator |
| Conflicting metadata (same part, different manufacturer) | Medium | Use first occurrence, log conflicts |
| Database add fails but BOM import succeeds | Low | Acceptable - user can add manually later |
| User accidentally adds junk to database | Medium | Make checkbox visible, allow database cleanup |

---

## Next Steps

1. **Review** this task list with stakeholders
2. **Prioritize** phases based on business value
3. **Prototype** Phase 1 to validate approach
4. **Iterate** based on user feedback
5. **Document** as you go

This feature significantly improves the BOM import workflow by reducing manual data entry and keeping the master parts database synchronized with project BOMs.
