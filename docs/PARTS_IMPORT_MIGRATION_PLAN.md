# Master Parts Import Migration Plan

## Problem Statement

The current Eplan XML master parts database contains **severe data quality issues**:
- Manufacturer names are inconsistent and uncontrolled
- Example: Allen-Bradley appears as: `A.B`, `A-B`, `ALLEN_BRADLEY`, `Allen Bradley`, `ALLEN BRADLEY`, `Allen.Bradley`, `rockwell`, `A_B`
- This makes the master parts database nearly unusable for search/lookup
- Data was never managed or normalized in the Eplan system

## Current Architecture (Eplan XML Import)

### Files Involved in XML Import:

1. **API Route:**
   - `src/app/api/parts/import/route.ts` - HTTP endpoint for file upload
   
2. **Parser:**
   - `src/lib/xml-streaming-parser.ts` - SAX-based Eplan XML parser
   
3. **Upload Scripts:**
   - `scripts/upload-parts-database.ts` - Node.js upload script
   - `scripts/upload-parts.ps1` - PowerShell upload script
   - `scripts/reimport-database.ts` - Database re-import script (just created)
   
4. **Documentation:**
   - `docs/PARTS_IMPORT_WORKFLOW.md` - XML import workflow guide
   
5. **Test/Utility Scripts:**
   - `scripts/test-streaming-parser.ts` - Parser testing
   - `scripts/test-search-api.ts` - Search API validation

6. **Database Schema** (KEEP AS-IS):
   ```prisma
   model MasterPart {
     id                    String   @id @default(cuid())
     partNumber            String   @unique       // ✅ Required
     manufacturer          String                 // ✅ Required
     description           String                 // ✅ Required
     secondaryDescription  String?                // Optional
     category              String?                // Optional
     unitPrice             Float?                 // Optional
     supplier              String?                // Optional
     lastUpdated           DateTime @updatedAt
     source                String   @default("parts.xml")
     importDate            DateTime @default(now())
     createdAt             DateTime @default(now())
   }
   ```

### Files NOT Related to XML Import (Keep):

- `src/app/api/parts/search/route.ts` - Search API (used by BOM UI)
- `src/components/PartSearchDialog.tsx` - UI component for searching parts
- All other BOM-related files

---

## Proposed New Architecture (Clean Data Import)

### Data Source Change:
- **FROM:** Eplan XML (345MB, 55K+ parts, dirty data)
- **TO:** Cleaned SharePoint/Excel table (Part Number, Manufacturer, Description)

### Recommended Import Formats:

#### Option 1: CSV (Recommended for Initial Testing)
**Pros:**
- Simplest format
- Excel-exportable
- Human-readable
- Small file size
- Universal support

**Cons:**
- Encoding issues possible (use UTF-8)
- No type validation
- Comma-in-description issues (use quoted fields)

**Sample Format:**
```csv
partNumber,manufacturer,description
1489-A1D300,Allen-Bradley,Circuit Breaker Miniature 1P 30A D-Curve
140M-C2E-B40,Allen-Bradley,Motor Protection Circuit Breaker 40A
```

**Required Headers:** `partNumber`, `manufacturer`, `description`  
**Optional Headers:** `category`, `supplier`, `unitPrice`, `secondaryDescription`

#### Option 2: Excel XLSX (Recommended for Production)
**Pros:**
- Native SharePoint export
- Multi-sheet support (could have validation sheet)
- Preserves formatting
- Data validation in source file

**Cons:**
- Binary format
- Larger files
- Requires `xlsx` library (already installed!)

**Implementation:** Use `xlsx` package to parse workbook, extract first sheet, convert to JSON

#### Option 3: JSON (For Programmatic Import)
**Pros:**
- Type-safe
- Already supported (legacy mode in current API)
- Web-native

**Cons:**
- Not natural for SharePoint/Excel users
- More verbose

---

## Migration Steps

### Phase 1: Archive Old XML Import System ✅

**Action:** Move XML-specific code to `/scripts/deprecated/` folder

Files to move:
```
scripts/deprecated/
  ├── xml-import/
  │   ├── upload-parts-database.ts
  │   ├── upload-parts.ps1
  │   ├── reimport-database.ts
  │   ├── test-streaming-parser.ts
  │   └── README.md (link to migration doc)
  └── xml-parser/
      ├── xml-streaming-parser.ts (copy from src/lib)
      └── PARTS_IMPORT_WORKFLOW.md
```

**Note:** Keep `src/lib/xml-streaming-parser.ts` for now but mark as deprecated

### Phase 2: Create New CSV/Excel Import Endpoint 🎯

**New File:** `src/lib/csv-parser.ts`

```typescript
/**
 * Parse CSV file with cleaned master parts data
 * 
 * Required columns: partNumber, manufacturer, description
 * Optional columns: category, supplier, unitPrice, secondaryDescription
 */
export interface CleanPartData {
  partNumber: string
  manufacturer: string  // MUST be normalized (e.g., "Allen-Bradley" not "A-B")
  description: string
  category?: string
  supplier?: string
  unitPrice?: number
  secondaryDescription?: string
}

export async function parsePartsCSV(filePath: string): Promise<CleanPartData[]>
export async function parsePartsExcel(filePath: string, sheetName?: string): Promise<CleanPartData[]>
```

**Implementation Details:**
- Use `csv-parse` package (already installed) for CSV
- Use `xlsx` package (already installed) for Excel
- Validate required fields: `partNumber`, `manufacturer`, `description`
- Skip rows with missing required fields (log warning)
- Trim whitespace from all string fields
- Normalize line breaks in descriptions
- Convert unitPrice to float (handle currency symbols: `$123.45` → `123.45`)

### Phase 3: Update Import API Route 🎯

**File:** `src/app/api/parts/import/route.ts`

**Changes:**
1. Detect file type by extension:
   - `.csv` → Parse with `parsePartsCSV()`
   - `.xlsx` or `.xls` → Parse with `parsePartsExcel()`
   - `.xml` → Return deprecation warning (or continue supporting with flag)

2. Add validation step:
   ```typescript
   function validateCleanPart(part: CleanPartData): boolean {
     if (!part.partNumber || !part.manufacturer || !part.description) {
       return false
     }
     // Additional validation: manufacturer must be normalized (no "A-B", "A.B", etc.)
     // Could add manufacturer whitelist check
     return true
   }
   ```

3. Keep batch upsert logic (works for any format)

4. Return detailed summary:
   ```json
   {
     "success": true,
     "totalRows": 1234,
     "imported": 1200,
     "skipped": 34,
     "errors": 0,
     "format": "csv",
     "validationErrors": [
       { "row": 45, "error": "Missing manufacturer" },
       { "row": 78, "error": "Invalid part number format" }
     ]
   }
   ```

### Phase 4: Create Upload UI (Optional - Phase 2 from PARTS_IMPORT_WORKFLOW.md) 📋

**File:** `src/app/admin/parts/page.tsx`

**Features:**
1. Drag-and-drop file upload (CSV/Excel only)
2. File format detection and validation
3. Preview first 10 rows before import
4. Progress bar (upload + processing)
5. Import summary display
6. Database statistics (total parts, manufacturers, categories)

### Phase 5: Data Normalization Tool (Future Enhancement) 🔮

**File:** `scripts/normalize-manufacturers.ts`

Tool to help clean existing data:
- Scan database for manufacturer variants
- Suggest normalized names
- Batch update records
- Export mapping table

---

## Database Migration

### Option A: Clean Slate (RECOMMENDED)
```bash
# 1. Backup current database
copy db\custom.db db\custom.db.backup.old-eplan

# 2. Delete old parts
# Run in Prisma Studio or script:
# DELETE FROM MasterPart;

# 3. Import cleaned data (CSV/Excel)
# Upload via new API endpoint
```

### Option B: Hybrid Approach
- Keep schema as-is
- Import cleaned data alongside old data (use `source` field to distinguish)
- Filter searches by `source = 'cleaned'`
- Gradually phase out old data

**Recommendation:** Use Option A for clean start

---

## Testing Plan

### Unit Tests:
1. CSV parser handles:
   - ✅ Valid CSV with required fields
   - ✅ Missing required fields (skip row)
   - ✅ Extra columns (ignore)
   - ✅ Quoted fields with commas
   - ✅ UTF-8 encoding
   - ✅ Empty rows (skip)
   - ✅ Currency symbols in unitPrice

2. Excel parser handles:
   - ✅ Multiple sheets (use first or specified)
   - ✅ Header row detection
   - ✅ Cell formatting (numbers vs strings)
   - ✅ Empty cells

### Integration Tests:
1. Upload CSV with 100 clean parts → verify all imported
2. Upload Excel with 100 clean parts → verify all imported
3. Upload file with duplicate part numbers → verify upsert works
4. Upload file with validation errors → verify error reporting
5. Search API still works after import

### Performance Tests:
1. Import 10K parts from CSV → should complete in < 60 seconds
2. Import 10K parts from Excel → should complete in < 90 seconds

---

## Rollback Plan

If migration fails:
1. Restore backup: `copy db\custom.db.backup.old-eplan db\custom.db`
2. Revert code changes (git reset)
3. Restart dev server
4. Old XML import still available in `/scripts/deprecated/`

---

## Timeline Estimate

| Phase | Task | Time Estimate |
|-------|------|---------------|
| 1 | Archive XML import code | 15 min |
| 2 | Create CSV/Excel parsers | 1-2 hours |
| 3 | Update import API route | 1 hour |
| 4 | Testing (manual + validation) | 1 hour |
| **Total** | **Core Migration** | **3-4 hours** |
| 5 (Optional) | Upload UI | 2-3 hours |
| 6 (Future) | Normalization tool | 2-3 hours |

---

## Success Criteria

✅ CSV import works with clean data (Part Number, Manufacturer, Description)  
✅ Excel import works with SharePoint exports  
✅ Database contains ONLY normalized manufacturer names  
✅ Search API returns accurate results  
✅ BOM "Add from Catalog" feature works with cleaned data  
✅ Old XML import code archived but accessible  
✅ Documentation updated  

---

## Next Steps

**USER ACTION REQUIRED:**
1. ✅ Review this plan
2. ✅ Export cleaned data from SharePoint/Excel
   - Required columns: `partNumber`, `manufacturer`, `description`
   - Optional: `category`, `supplier`, `unitPrice`
   - Save as CSV (UTF-8) or Excel XLSX
3. ✅ Approve migration plan
4. 🎯 Provide sample file for testing (10-20 rows)

**AGENT TASKS (After Approval):**
1. Archive XML import system
2. Implement CSV/Excel parsers
3. Update import API endpoint
4. Test with sample file
5. Document new workflow
6. Import production cleaned data

---

## Questions for User

1. **Data Format:** Do you prefer CSV or Excel XLSX for the cleaned data upload?
   - CSV = simpler, Excel = better for SharePoint exports

2. **Required Fields:** Confirm these are correct:
   - ✅ Part Number (unique identifier)
   - ✅ Manufacturer (normalized name)
   - ✅ Description (part description)
   - ❓ Category (optional?)
   - ❓ Supplier (optional?)
   - ❓ Unit Price (optional?)

3. **Validation:** Should we enforce manufacturer name whitelist?
   - E.g., only allow "Allen-Bradley", reject "A-B", "A.B", etc.
   - This would require maintaining a list of approved manufacturers

4. **Migration Timing:** When do you want to execute the migration?
   - Can be done incrementally (test with sample, then full import)
   - Or all at once (backup, clear, import)

5. **Old Data:** What to do with existing 55K parts from Eplan XML?
   - Delete completely (clean slate)
   - Keep for reference (mark as `source = 'eplan-deprecated'`)
   - Export to CSV for review before deletion

---

## File Structure After Migration

```
src/
  ├── app/
  │   └── api/
  │       └── parts/
  │           ├── import/
  │           │   └── route.ts         # ✏️ UPDATED - CSV/Excel support
  │           └── search/
  │               └── route.ts         # ✅ NO CHANGE
  └── lib/
      ├── csv-parser.ts                # 🆕 NEW - CSV/Excel parsers
      ├── xml-streaming-parser.ts      # ⚠️ DEPRECATED (move to scripts)
      └── db.ts                         # ✅ NO CHANGE

scripts/
  ├── deprecated/                       # 🆕 NEW - archived XML import
  │   ├── xml-import/
  │   │   ├── upload-parts-database.ts
  │   │   ├── upload-parts.ps1
  │   │   ├── reimport-database.ts
  │   │   └── test-streaming-parser.ts
  │   └── xml-parser/
  │       ├── xml-streaming-parser.ts
  │       └── PARTS_IMPORT_WORKFLOW.md
  └── upload-clean-parts.ts             # 🆕 NEW - CSV/Excel upload script

docs/
  ├── PARTS_IMPORT_MIGRATION_PLAN.md   # 🆕 THIS FILE
  ├── PARTS_IMPORT_WORKFLOW.md         # ⚠️ DEPRECATED - moved to scripts/deprecated
  └── CLEAN_PARTS_IMPORT.md            # 🆕 NEW - new workflow guide

prisma/
  └── schema.prisma                     # ✅ NO CHANGE (MasterPart model unchanged)
```

---

## References

- Current XML Import API: `src/app/api/parts/import/route.ts`
- Database Schema: `prisma/schema.prisma` (lines 166-189)
- Search API: `src/app/api/parts/search/route.ts`
- BOM UI Integration: `src/components/PartSearchDialog.tsx`
