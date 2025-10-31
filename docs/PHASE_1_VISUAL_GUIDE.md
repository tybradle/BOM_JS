# Phase 1 - Visual Changes Guide

## Summary Cards Row

**Before** (4 cards):
```
┌──────────┬──────────────┬───────────┬───────┐
│  Valid   │ Missing Info │ Duplicate │ Total │
│    ✓     │      !       │     ✗     │   ℹ   │
└──────────┴──────────────┴───────────┴───────┘
```

**After** (5 cards):
```
┌──────────┬──────────────┬───────────┬──────────────┬───────┐
│  Valid   │ Missing Info │ Duplicate │  Not in DB   │ Total │
│    ✓     │      !       │     ✗     │      🗄️      │   ℹ   │
│  Green   │    Yellow    │    Red    │   ORANGE     │ Blue  │
└──────────┴──────────────┴───────────┴──────────────┴───────┘
```

### Not in DB Card Details
- **Icon**: AlertCircle (orange)
- **Title**: "Not in DB"
- **Count**: Number in orange text
- **Loading State**: Shows spinner + "Checking..." when database lookup in progress
- **Message**: "Can be added" when count > 0 and not loading
- **Background**: Light orange tint (bg-orange-50/50)

## Preview Table Changes

### Part Number Column (Before)
```
┌─────────────────┐
│ Part Number     │
├─────────────────┤
│ AB-1234         │
│ NEW-001         │
│ AB-5678         │
└─────────────────┘
```

### Part Number Column (After)
```
┌────────────────────────────┐
│ Part Number                │
├────────────────────────────┤
│ AB-1234                    │  ← Exists in DB
│ NEW-001  [🗄️ New]         │  ← Missing from DB (orange badge)
│ AB-5678                    │  ← Exists in DB
└────────────────────────────┘
```

### Badge Styling
- **Border**: Orange outline
- **Icon**: Database icon (3x3 size)
- **Text**: "New"
- **Color**: Orange text (text-orange-600)
- **Visibility**: Only shows on rows where:
  - Row is valid (no errors)
  - Part is missing from database

## Row Background Colors (Unchanged)

The existing color coding remains:
- **Green background** (bg-green-50): Valid row, no errors
- **Yellow background** (bg-yellow-50): Missing required info
- **Red background** (bg-red-50): Duplicate part number in location

The orange badge appears on green rows (valid) when part is new.

## Loading States

### While Checking Database
```
┌─────────────────────────────────────┐
│ Not in DB                          │
│                                    │
│ Checking...  [spinner]             │
└─────────────────────────────────────┘
```

### After Check (No Missing Parts)
```
┌─────────────────────────────────────┐
│ Not in DB                          │
│                                    │
│ 0                                  │
└─────────────────────────────────────┘
```

### After Check (Missing Parts Found)
```
┌─────────────────────────────────────┐
│ Not in DB                          │
│                                    │
│ 5          [orange number]         │
│ Can be added                       │
└─────────────────────────────────────┘
```

## Toast Message (Unchanged for Phase 1)

File parsing success toast still shows:
```
✓ File parsed successfully
  X valid, Y missing info, Z duplicates
```

**Future Enhancement (Phase 2)**: Will include database addition confirmation

## Example Scenarios

### Scenario 1: All Existing Parts
```
Upload file with 10 parts → All exist in database

Summary Cards:
- Valid: 10
- Missing Info: 0
- Duplicate: 0
- Not in DB: 0      ← No new parts
- Total: 10

Preview: No orange badges
```

### Scenario 2: Mix of Existing and New
```
Upload file with 20 parts → 15 exist, 5 are new

Summary Cards:
- Valid: 20
- Missing Info: 0
- Duplicate: 0
- Not in DB: 5      ← 5 new parts detected
- Total: 20

Preview: 5 rows show orange "New" badge
```

### Scenario 3: File with Errors
```
Upload file with 30 parts → 20 valid (5 new), 7 missing info, 3 duplicates

Summary Cards:
- Valid: 20
- Missing Info: 7
- Duplicate: 3
- Not in DB: 5      ← Only counts from valid rows
- Total: 30

Preview:
- 15 green rows (no badge)
- 5 green rows with orange "New" badge
- 7 yellow rows (missing info)
- 3 red rows (duplicates)
```

## Technical Flow

```
User Action          UI State               Backend Call
───────────         ─────────────          ─────────────
Upload File    →    Parsing...
                    ↓
Parse Success  →    Validating...
                    ↓
                    Checking database...  → POST /api/parts/check-missing
                    [spinner in card]         { partNumbers: [...] }
                                          ←   { missing: [...] }
                    ↓
                    Preview Ready!
                    [cards updated]
                    [badges applied]
```

## Color Coding Reference

| State                  | Color   | Element                | Visual Cue           |
|------------------------|---------|------------------------|----------------------|
| Valid                  | Green   | Row BG, Check icon     | bg-green-50          |
| Missing Info           | Yellow  | Row BG, X icon, Text   | bg-yellow-50         |
| Duplicate              | Red     | Row BG, X icon, Text   | bg-red-50            |
| **Not in Database**    | **Orange** | **Card, Badge**     | **text-orange-600**  |
| Total                  | Blue    | Card icon              | text-blue-600        |

---

**Key Design Principle**: Orange represents "informational warning" - not an error that blocks import, but something the user should be aware of and can act on in Phase 2.
