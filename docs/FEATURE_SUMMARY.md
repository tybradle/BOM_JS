# Feature Summary: Auto-Add Missing Parts to Database

## Quick Overview

**Problem**: When importing BOM items from external files, parts that don't exist in the master parts database are imported into the BOM but remain missing from the global catalog. This creates data fragmentation and makes it harder to reuse parts across projects.

**Solution**: Automatically detect parts during import that don't exist in the `MasterPart` database and provide a checkbox option to add them in a single workflow.

## User Experience Flow

### Before (Current)
1. Upload CSV/Excel file
2. Preview shows validation errors (missing fields, duplicates)
3. Import valid rows to BOM
4. ❌ No visibility into which parts are missing from database
5. ❌ Manual process to add parts to database later

### After (Proposed)
1. Upload CSV/Excel file
2. **System checks which parts exist in database**
3. Preview shows:
   - Validation errors (red - blocks import)
   - Duplicate warnings (red - blocks import)  
   - **Missing from database (orange - informational)**
4. **Checkbox (default ON): "Add X missing parts to database"**
5. Click Import:
   - If checked: Parts added to MasterPart database THEN imported to BOM
   - If unchecked: Only imported to BOM (current behavior)
6. Success message shows both import count AND database additions

## Key Benefits

✅ **Zero extra clicks** - Checkbox defaults to checked, just click Import  
✅ **Data consolidation** - Master database stays up-to-date automatically  
✅ **Part reuse** - Parts immediately available in search dialog for other projects  
✅ **Audit trail** - Parts tagged with `source: 'bom-import'` for tracking  
✅ **Fail-safe** - BOM import always succeeds even if database add fails  
✅ **Flexible** - Power users can uncheck to prevent database pollution  

## Technical Highlights

- **Performance**: Batch checking for missing parts (handles 500+ parts)
- **Deduplication**: Smart merge when same part appears multiple times
- **Conflict handling**: Gracefully handles concurrent imports
- **Error isolation**: Database failures don't block BOM import
- **Data quality**: Validation before database insert

## Implementation Phases

1. **Detection & Preview** (4-6 hours) - Shows which parts are missing
2. **Core Functionality** (6-8 hours) - Checkbox + batch add logic
3. **Polish & Feedback** (2-3 hours) - Better toast messages, badges
4. **Error Handling** (3-4 hours) - Edge cases, conflicts
5. **Testing & Docs** (2-3 hours) - Test cases, user guide

**Total Estimate**: 17-24 hours

## Files Changed

### New Files (3)
- `src/app/api/parts/check-missing/route.ts` - Batch check endpoint
- `src/app/api/parts/batch-create/route.ts` - Batch insert endpoint  
- `docs/TESTING_AUTO_ADD_PARTS.md` - Test plan

### Modified Files (2)
- `src/components/ImportPreviewDialog.tsx` - Add detection, checkbox, UI
- `src/app/api/projects/[id]/items/import/route.ts` - Integrate batch add

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Accidental database pollution | Medium | Clear UI, defaults to checked but visible |
| Performance with large imports | Low | Batch processing, tested with 500+ parts |
| Conflicting metadata | Low | First-occurrence wins, logged for review |
| Database add failures | Low | Soft failure - BOM import continues |

## Success Metrics

- ✅ Import preview shows missing parts count
- ✅ Checkbox visible when missing parts detected  
- ✅ Database additions reflected in search dialog
- ✅ Import succeeds even if database add partially fails
- ✅ Toast message confirms both BOM and database operations

## Future Enhancements (Not in Scope)

- Conflict resolution UI for existing parts with different metadata
- Bulk edit interface before adding to database
- Detailed audit trail tracking which project added which parts
- Rollback feature to remove auto-added parts

---

**Next Step**: Review task list in `FEATURE_AUTO_ADD_MISSING_PARTS.md` and prioritize phases for implementation.
