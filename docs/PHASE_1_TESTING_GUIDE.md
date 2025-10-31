# Phase 1 - Manual Testing Guide

## Prerequisites

1. **Server Running**: 
   ```bash
   npm run dev
   ```
   Server should be running at http://localhost:3002

2. **Database Has Some Parts**: 
   - Check that MasterPart table has existing data
   - If empty, import some parts first using the parts import feature

3. **Test Files Available**:
   - `test_files/phase1-test-mixed.csv` - Mix of existing and new parts
   - `test_files/phase1-test-all-new.csv` - All new parts

## Test Scenarios

### Test 1: Basic Database Check Functionality

**Objective**: Verify database check runs and displays results

**Steps**:
1. Navigate to a BOM project
2. Select a location tab
3. Click "Import" button to open ImportPreviewDialog
4. Upload `phase1-test-mixed.csv`
5. Wait for file to parse

**Expected Results**:
- ✅ File parses successfully
- ✅ Toast shows: "X valid, Y missing info, Z duplicates"
- ✅ Brief "Checking database..." loading state appears
- ✅ "Not in DB" card appears in summary row
- ✅ Card shows count of new parts (likely 3 for mixed file)
- ✅ Orange badges appear next to NEW-PART-* part numbers
- ✅ No badges appear next to EXISTING-* part numbers

**Screenshots to Capture**:
- Summary cards with "Not in DB" showing count
- Preview table with orange "New" badges

---

### Test 2: All New Parts

**Objective**: Verify correct count when all parts are new

**Steps**:
1. Open ImportPreviewDialog
2. Upload `phase1-test-all-new.csv`
3. Wait for validation

**Expected Results**:
- ✅ "Not in DB" card shows: 5
- ✅ All 5 rows have orange "New" badge
- ✅ All rows have green background (valid)
- ✅ Card shows "Can be added" message

---

### Test 3: All Existing Parts

**Objective**: Verify correct behavior when all parts exist in database

**Steps**:
1. First, import `phase1-test-all-new.csv` into BOM and complete import
2. Close ImportPreviewDialog
3. Re-open ImportPreviewDialog
4. Upload same file again

**Expected Results**:
- ✅ "Not in DB" card shows: 0
- ✅ No orange badges appear
- ✅ File may show duplicates (red) if same location, or valid if different location

---

### Test 4: Loading State

**Objective**: Verify loading indicator appears

**Steps**:
1. Open ImportPreviewDialog
2. Upload a larger file (or use Developer Tools to throttle network to "Slow 3G")
3. Watch "Not in DB" card during database check

**Expected Results**:
- ✅ Card shows spinner icon
- ✅ Text shows "Checking..."
- ✅ Loading state disappears after database check completes
- ✅ Count and "Can be added" message appear

---

### Test 5: File with Validation Errors

**Objective**: Verify "Not in DB" count only includes valid rows

**Steps**:
1. Create a CSV with:
   - 3 valid new parts
   - 2 rows missing description (invalid)
   - 1 row missing part number (invalid)
2. Upload the file

**Expected Results**:
- ✅ "Not in DB" card shows: 3 (only valid rows)
- ✅ Orange badges only appear on valid rows
- ✅ Invalid rows show yellow/red backgrounds
- ✅ Invalid rows do NOT have orange badges

**Test File**: Create manually or use this content:
```csv
Part Number,Description,Quantity
NEW-001,Valid New Part,5
NEW-002,,10
,Missing Part Number,3
NEW-003,Another Valid New,7
```

---

### Test 6: Large File Performance

**Objective**: Verify performance with many parts

**Steps**:
1. Create a CSV with 100+ part numbers (mix of new and existing)
2. Upload the file
3. Measure time for database check to complete

**Expected Results**:
- ✅ Database check completes in < 2 seconds
- ✅ No browser freezing or lag
- ✅ Correct count displayed
- ✅ Preview limited to first 50 rows (existing behavior)

---

### Test 7: Database API Failure Handling

**Objective**: Verify graceful failure if database check fails

**Steps**:
1. Stop the development server
2. Upload a file (will trigger API call that fails)
3. Or use Developer Tools to block `/api/parts/check-missing` request

**Expected Results**:
- ✅ File still parses and displays
- ✅ "Not in DB" card shows: 0 (or doesn't update)
- ✅ No orange badges appear
- ✅ No error toast appears (graceful failure)
- ✅ Import can still proceed

---

### Test 8: Mixed Validation States

**Objective**: Verify all visual states work together

**Steps**:
1. Create CSV with:
   - 5 valid existing parts
   - 5 valid new parts  
   - 3 parts missing required fields
   - 2 duplicate part numbers (already in location)
2. Upload file

**Expected Results**:
- ✅ Valid: 10
- ✅ Missing Info: 3 (yellow rows)
- ✅ Duplicate: 2 (red rows)
- ✅ Not in DB: 5 (orange badges on valid new parts)
- ✅ Total: 15
- ✅ Orange badges only on green rows (valid and new)

---

### Test 9: Cancel and Reopen

**Objective**: Verify state resets properly

**Steps**:
1. Upload a file with new parts
2. Note "Not in DB" count
3. Click "Cancel" to close dialog
4. Re-open dialog
5. Upload different file

**Expected Results**:
- ✅ "Not in DB" count resets to 0 when dialog closes
- ✅ Previous badges don't appear on new file
- ✅ New database check runs for new file
- ✅ Fresh results displayed

---

### Test 10: Network Timing

**Objective**: Verify database check doesn't block UI

**Steps**:
1. Open Developer Tools → Network tab → Throttle to "Slow 3G"
2. Upload file
3. Observe behavior during database check

**Expected Results**:
- ✅ File preview displays immediately
- ✅ "Not in DB" card shows loading state
- ✅ Can scroll through preview while checking
- ✅ Badges appear after check completes
- ✅ No UI freezing

---

## API Endpoint Testing

### Direct API Test

**Test the check-missing endpoint directly**:

```bash
# Test with PowerShell
$body = @{
    partNumbers = @("NEW-001", "EXISTING-001", "NEW-002")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3002/api/parts/check-missing" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Expected Response**:
```json
{
  "missing": ["NEW-001", "NEW-002"],
  "existing": ["EXISTING-001"],
  "total": 3,
  "missingCount": 2,
  "existingCount": 1
}
```

### Edge Case Tests

**Empty Array**:
```json
{
  "partNumbers": []
}
```
Expected: `{ missing: [], existing: [] }`

**Duplicates in Request**:
```json
{
  "partNumbers": ["NEW-001", "NEW-001", "NEW-001"]
}
```
Expected: Deduplicates to 1 check

**Invalid Input**:
```json
{
  "partNumbers": "not-an-array"
}
```
Expected: 400 error with message

**Too Many Parts** (>500):
```json
{
  "partNumbers": [/* 501 items */]
}
```
Expected: 400 error "Maximum 500 part numbers per request"

---

## Regression Testing

**Verify existing functionality still works**:

- ✅ File parsing (CSV and Excel)
- ✅ Validation errors still shown
- ✅ Duplicate detection still works
- ✅ Row coloring (green/yellow/red) unchanged
- ✅ Import button disabled state correct
- ✅ Import functionality works
- ✅ Success/error toasts appear

---

## Checklist Summary

### Visual Elements
- [ ] "Not in DB" card appears in summary row
- [ ] Card shows correct count
- [ ] Card shows loading state while checking
- [ ] Card shows "Can be added" message when count > 0
- [ ] Orange badges appear on correct rows
- [ ] Badge has Database icon
- [ ] Badge text says "New"

### Functionality
- [ ] Database check runs automatically after parse
- [ ] Check completes quickly (< 2 seconds typical)
- [ ] Count only includes valid rows
- [ ] Badges only on valid rows missing from DB
- [ ] State resets on dialog close
- [ ] Works with CSV files
- [ ] Works with Excel files
- [ ] Handles API failures gracefully

### Performance
- [ ] No UI freezing during check
- [ ] Large files handled efficiently
- [ ] Preview displays while checking

### Errors & Edge Cases
- [ ] Empty files handled
- [ ] Invalid files handled
- [ ] Network failures handled
- [ ] Database failures handled
- [ ] Duplicate part numbers in file handled

---

## Success Criteria

✅ **All tests pass**  
✅ **No console errors**  
✅ **No TypeScript errors**  
✅ **No regression in existing functionality**  
✅ **UI is responsive and performant**  
✅ **Visual design matches mockup**  

---

## Next Steps After Testing

1. Document any bugs found
2. Create bug tickets for issues
3. Fix critical bugs
4. Proceed to Phase 2 implementation (checkbox + backend)

---

**Tester**: _______________  
**Date**: _______________  
**Pass/Fail**: _______________  
**Notes**: _______________________________________________
