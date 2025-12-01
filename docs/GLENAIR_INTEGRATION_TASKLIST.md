# Glenair Integration Task List

## Project Overview
**Objective**: Integrate Glenair Extractor Part Numbering workflow into BOM_JS application  
**Source**: `Glenair Extractor/pages/4_🔢_Part_Numbering.py` (Python/Streamlit)  
**Target**: `BOM_JS` (Next.js 15 / Electron / Prisma / Zustand)  
**Estimated Duration**: 4 Sprints (2 weeks)

---

## Sprint 1: Foundation & Database Layer
**Goal**: Establish database models and core TypeScript utilities  
**Duration**: 2-3 days

### Task 1.1: Prisma Schema Extension
**Status**: `[x] Complete`
**Priority**: High
**File**: `prisma/schema.prisma`

```
Acceptance Criteria:
- [x] Add GlenairCatalog model with id, name, version, uploadedAt, tables relation
- [x] Add GlenairTable model with catalogId, type, page, headers (Json), data (Json)
- [x] Add GlenairPartConfig model with all part builder fields
- [x] Add relation from GlenairPartConfig to BOMProject
- [x] Add @@index on projectId fields
- [x] Add @@unique constraint on GlenairPartConfig [projectId, arrangement, wireValue]
- [x] Run `npm run db:push` successfully
- [x] Run `npm run db:generate` successfully
```

**Implementation Steps**:
1. Open `prisma/schema.prisma`
2. Add models after existing BinLabel model
3. Add reverse relation field to BOMProject model
4. Execute database commands
5. Verify no migration errors

---

### Task 1.2: TypeScript Type Definitions
**Status**: `[x] Complete`
**Priority**: High
**File**: `src/types/glenair.ts` (NEW)

```
Acceptance Criteria:
- [x] Define WireSystem type: 'AWG' | 'MM2'
- [x] Define GlenairCatalog interface matching Prisma model
- [x] Define GlenairTable interface matching Prisma model
- [x] Define GlenairPartConfig interface matching Prisma model
- [x] Define ContactResult interface { pins: Contact[], sockets: Contact[] }
- [x] Define Contact interface with part_number, awg_range, mm2_range, quantity
- [x] Define ArrangementOption interface
- [x] Export all types
```

**Implementation Steps**:
1. Create new file `src/types/glenair.ts`
2. Define interfaces matching Prisma schema
3. Add utility types for API responses
4. Export all types

---

### Task 1.3: Wire Gauge Utilities (Port from Python)
**Status**: `[x] Complete`
**Priority**: High
**File**: `src/lib/glenair/wire-gauge.ts` (NEW)

```
Acceptance Criteria:
- [x] Create AWG_TO_MM2 constant Record<number, number>
- [x] Create MM2_TO_AWG reverse lookup
- [x] Implement normalizeDecimal(value: string): string
- [x] Implement parseWireRange(rangeStr: string, system: WireSystem): [number | null, number | null]
- [x] Implement awgToMm2(awgValue: number): number | null
- [x] Implement mm2ToAwg(mm2Value: number): number | null
- [x] Implement convertWireGauge(value: number, from: WireSystem, to: WireSystem)
- [x] Implement isWireCompatible(inputValue, inputSystem, rangeStr, rangeSystem, tolerance?)
- [x] Implement formatWireValue(value: number, system: WireSystem): string
- [x] Implement getEquivalentValue(value: number, system: WireSystem): string | null
- [x] Implement extractWireSizesFromData(data: any[]): { awg: string[], mm2: string[] }
- [x] Implement validateWireInput(value: string, system: WireSystem): ValidationResult
- [x] All functions have JSDoc comments
- [x] Unit tests pass (if test framework available)
```

**Implementation Steps**:
1. Create directory `src/lib/glenair/`
2. Create `wire-gauge.ts`
3. Port each function from `utils/wire_gauge.py`
4. Adapt Python logic to TypeScript idioms
5. Add type annotations and JSDoc

**Reference**: Port logic from `Glenair Extractor/utils/wire_gauge.py`

---

### Task 1.4: Catalog Parser Utility
**Status**: `[x] Complete`
**Priority**: Medium
**File**: `src/lib/glenair/catalog-parser.ts` (NEW)

```
Acceptance Criteria:
- [x] Implement parseValidatedTables(jsonData: any): ParsedCatalog
- [x] Implement categorizeTable(headers: string[], type?: string): TableType
- [x] Implement extractWireMap(tables: GlenairTable[]): DataFrame-like structure
- [x] Implement extractArrangementMap(tables: GlenairTable[])
- [x] Implement extractPhmMap(tables: GlenairTable[])
- [x] Implement extractPinSocketMaps(tables: GlenairTable[])
- [x] Handle table type detection from headers
- [x] Handle page-based pin/socket separation (289-290 pins, 291-292 sockets)
```

**Implementation Steps**:
1. Create `catalog-parser.ts`
2. Port table categorization logic from `load_validated_data()`
3. Create helper functions for each table type
4. Return typed structures

---

### Task 1.5: Part Builder Logic
**Status**: `[x] Complete`
**Priority**: Medium
**File**: `src/lib/glenair/part-builder.ts` (NEW)

```
Acceptance Criteria:
- [x] Implement findCompatibleContacts(wireValue, wireSystem, contactSize, wireMap)
- [x] Implement findArrangements(conductorCount, contactSize, arrangementMap)
- [x] Implement calculatePhmSize(shellSize, phmMap)
- [x] Implement buildPartNumber(config: PartBuilderConfig): string
- [x] Implement findContactPartNumbers(contactSize, wireValue, quantity, wireSystem)
- [x] Part number format: FRITS[G]41{style}A{arrangement}PB0PHM{size}EMI67
- [x] G prefix logic for style code "06"
```

**Implementation Steps**:
1. Create `part-builder.ts`
2. Port logic from Part Numbering page Steps 1-6
3. Implement part number string builder
4. Add contact lookup functions

---

### Task 1.6: Create Index Export
**Status**: `[x] Complete`
**Priority**: Low
**File**: `src/lib/glenair/index.ts` (NEW)

```
Acceptance Criteria:
- [x] Re-export all functions from wire-gauge.ts
- [x] Re-export all functions from catalog-parser.ts
- [x] Re-export all functions from part-builder.ts
```

---

## Sprint 2: API Layer
**Goal**: Create REST API endpoints for Glenair functionality  
**Duration**: 2-3 days

### Task 2.1: Catalog Upload API
**Status**: `[x] Complete`  
**Priority**: High  
**File**: `src/app/api/glenair/catalog/route.ts` (NEW)

```
Acceptance Criteria:
- [x] GET handler: List all catalogs with table counts
- [x] POST handler: Upload and parse validated JSON tables
- [x] Validate JSON structure on upload
- [x] Create GlenairCatalog record
- [x] Create GlenairTable records for each table
- [x] Return created catalog with table summary
- [x] Error handling with appropriate status codes
```

**Implementation Steps**:
1. Create directory `src/app/api/glenair/catalog/`
2. Create `route.ts` with GET and POST handlers
3. Use Prisma client for database operations
4. Parse uploaded JSON and categorize tables
5. Return structured response

---

### Task 2.2: Catalog Detail API
**Status**: `[x] Complete`  
**Priority**: Medium  
**File**: `src/app/api/glenair/catalog/[catalogId]/route.ts` (NEW)

```
Acceptance Criteria:
- [x] GET handler: Fetch catalog with all tables
- [x] DELETE handler: Remove catalog and cascade delete tables
- [x] Use Next.js 15 async params pattern
- [x] 404 handling for non-existent catalogs
```

---

### Task 2.3: Contact Lookup API
**Status**: `[x] Complete`  
**Priority**: High  
**File**: `src/app/api/glenair/contacts/route.ts` (NEW)

```
Acceptance Criteria:
- [x] GET handler with query params: wireValue, wireSystem, contactSize, catalogId
- [x] Return { pins: Contact[], sockets: Contact[] }
- [x] Filter by wire compatibility
- [x] Include AWG and MM2 ranges in response
- [x] Handle missing catalog gracefully
```

**Implementation Steps**:
1. Create `src/app/api/glenair/contacts/route.ts`
2. Parse query parameters
3. Load catalog tables from database
4. Apply wire compatibility filtering
5. Separate pins and sockets
6. Return structured response

---

### Task 2.4: Arrangement Lookup API
**Status**: `[x] Complete`  
**Priority**: High  
**File**: `src/app/api/glenair/arrangements/route.ts` (NEW)

```
Acceptance Criteria:
- [x] GET handler with query params: conductorCount, contactSize, catalogId
- [x] Return sorted arrangements (closest fit first)
- [x] Include shell size extraction
- [x] Include contact counts per size
```

---

### Task 2.5: Part Builder API
**Status**: `[x] Complete`  
**Priority**: High  
**File**: `src/app/api/glenair/build/route.ts` (NEW)

```
Acceptance Criteria:
- [x] POST handler accepting PartBuilderConfig
- [x] Validate all required fields
- [x] Generate part number string
- [x] Calculate PHM size
- [x] Return complete part configuration
- [x] Optionally save to GlenairPartConfig table
```

**Request Body**:
```typescript
{
  catalogId: string
  projectId?: string
  wireSystem: 'AWG' | 'MM2'
  wireValue: string
  conductorCount: number
  shellStyle: string  // "Plug (06)" | "Inline Socket (01)" | "Panel Mount (00)"
  arrangement: string
  contactSize: string
  selectedContacts: { partNumber: string, quantity: number, type: 'pin' | 'socket' }[]
  save?: boolean
}
```

---

### Task 2.6: Add to BOM API
**Status**: `[x] Complete`  
**Priority**: Medium  
**File**: `src/app/api/glenair/add-to-bom/route.ts` (NEW)

```
Acceptance Criteria:
- [x] POST handler accepting partConfigId and projectId/locationId
- [x] Create BOMItem for connector assembly
- [x] Create BOMItem(s) for each selected contact
- [x] Set appropriate quantities
- [x] Set manufacturer as "Glenair"
- [x] Return created BOM items
```

---

## Sprint 3: UI Components
**Goal**: Build React components for the part builder interface  
**Duration**: 3-4 days

### Task 3.1: Zustand Store Extension
**Status**: `[x] Complete`
**Priority**: High
**File**: `src/lib/store.ts` (MODIFY)

```
Acceptance Criteria:
- [x] Add glenairCatalogs state array
- [x] Add currentCatalog state
- [x] Add glenairPartConfigs state array
- [x] Add wireGaugeSelection state { system, value }
- [x] Add fetchGlenairCatalogs action
- [x] Add uploadGlenairCatalog action
- [x] Add deleteGlenairCatalog action
- [x] Add buildGlenairPart action
- [x] Add addGlenairToBom action
```

**Implementation Steps**:
1. Add Glenair-specific state interfaces
2. Add initial state values
3. Add API action functions
4. Follow existing patterns in store.ts

---

### Task 3.2: Wire Gauge Selector Component
**Status**: `[x] Complete`
**Priority**: High
**File**: `src/components/glenair/WireGaugeSelector.tsx` (NEW)

```
Acceptance Criteria:
- [x] Radio/Toggle for AWG vs MM2 selection
- [x] Dropdown populated with available wire sizes from catalog
- [x] Display equivalent value (AWG <-> MM2 conversion)
- [x] Validation feedback for invalid inputs
- [x] Conductor count number input
- [x] Uses shadcn/ui components (Select, RadioGroup, Input)
- [x] Emits onChange with { system, value, conductorCount }
```

**Props**:
```typescript
interface WireGaugeSelectorProps {
  availableSizes: { awg: string[], mm2: string[] }
  value: { system: WireSystem, wireValue: string, conductorCount: number }
  onChange: (value: WireGaugeSelection) => void
}
```

---

### Task 3.3: Contact Size Display Component
**Status**: `[x] Complete`
**Priority**: Medium
**File**: `src/components/glenair/ContactSizeDisplay.tsx` (NEW)

```
Acceptance Criteria:
- [x] Display compatible contact sizes as selectable cards/buttons
- [x] Show pin and socket part numbers for each size
- [x] Show AWG and MM2 ranges
- [x] Highlight selected contact size
- [x] Uses shadcn/ui Card and Button components
```

---

### Task 3.4: Arrangement Picker Component
**Status**: `[x] Complete`
**Priority**: High
**File**: `src/components/glenair/ArrangementPicker.tsx` (NEW)

```
Acceptance Criteria:
- [x] Display available arrangements in sorted table/list
- [x] Show contact counts per arrangement
- [x] Indicate exact match vs "closest available"
- [x] Allow selection of arrangement
- [x] Extract and display shell size
- [x] Uses shadcn/ui Table or Select component
```

---

### Task 3.5: Shell Style Selector Component
**Status**: `[x] Complete`
**Priority**: Medium
**File**: `src/components/glenair/ShellStyleSelector.tsx` (NEW)

```
Acceptance Criteria:
- [x] Select component with options: Plug (06), Inline Socket (01), Panel Mount (00)
- [x] Display current selection
- [x] Uses shadcn/ui Select component
```

---

### Task 3.6: Contact Selector Component
**Status**: `[x] Complete`
**Priority**: High
**File**: `src/components/glenair/ContactSelector.tsx` (NEW)

```
Acceptance Criteria:
- [x] Radio/Tab for Pin, Socket, or Both view
- [x] Display available contacts in columns (Pin | Socket)
- [x] Each contact shows: Part Number, AWG Range, MM2 Range
- [x] Select button for each contact
- [x] Track selected contacts with quantities
- [x] Uses shadcn/ui Tabs, Card, Button components
```

---

### Task 3.7: Part Number Display Component
**Status**: `[x] Complete`
**Priority**: Medium
**File**: `src/components/glenair/PartNumberDisplay.tsx` (NEW)

```
Acceptance Criteria:
- [x] Display generated connector part number prominently
- [x] Code block styling for part number
- [x] List selected contacts with quantities
- [x] Procurement summary section
- [x] "Add to BOM" button
- [x] "Copy Part Number" button
- [x] Uses shadcn/ui Card, Button, Badge components
```

---

### Task 3.8: Part Builder Page Component
**Status**: `[x] Complete`
**Priority**: High
**File**: `src/components/glenair/PartNumberBuilder.tsx` (NEW)

```
Acceptance Criteria:
- [x] Orchestrates all sub-components in step-by-step flow
- [x] Step 1: Wire Gauge Input (WireGaugeSelector)
- [x] Step 2: Contact Selection (ContactSizeDisplay)
- [x] Step 3: Arrangement Selection (ArrangementPicker)
- [x] Step 4: Shell Style (ShellStyleSelector)
- [x] Step 5: Contact Type Selection (ContactSelector)
- [x] Step 6: Results (PartNumberDisplay)
- [x] Progress indicator showing current step
- [x] State management via Zustand or local useState
- [x] API calls at each step for dynamic data
```

---

### Task 3.9: Catalog Manager Component
**Status**: `[x] Complete`
**Priority**: Medium
**File**: `src/components/glenair/CatalogManager.tsx` (NEW)

```
Acceptance Criteria:
- [x] List uploaded catalogs with metadata
- [x] Upload button with file input (JSON)
- [x] Delete catalog functionality with confirmation
- [x] Display table counts per catalog
- [x] Select active catalog for part builder
```

---

### Task 3.10: Components Index Export
**Status**: `[ ] Not Started`  
**Priority**: Low  
**File**: `src/components/glenair/index.ts` (NEW)

```
Acceptance Criteria:
- [ ] Export all Glenair components
```

---

## Sprint 4: Pages & Integration
**Goal**: Create pages and integrate with existing BOM workflow  
**Duration**: 2-3 days

### Task 4.1: Glenair Landing Page
**Status**: `[ ] Not Started`  
**Priority**: High  
**File**: `src/app/glenair/page.tsx` (NEW)

```
Acceptance Criteria:
- [ ] Page title and description
- [ ] Catalog Manager section
- [ ] Quick access to part builder (requires catalog selection)
- [ ] Link to project-specific builder if project context exists
- [ ] SharedHeader component integration
- [ ] Responsive layout
```

---

### Task 4.2: Project-Specific Part Builder Page
**Status**: `[ ] Not Started`  
**Priority**: High  
**File**: `src/app/glenair/[projectId]/page.tsx` (NEW)

```
Acceptance Criteria:
- [ ] Load project context from projectId param
- [ ] Display project name in header
- [ ] Full PartNumberBuilder component
- [ ] "Add to BOM" integration with project
- [ ] Back link to project BOM page
- [ ] Catalog selector if multiple catalogs exist
```

**Implementation Steps**:
1. Create directory structure
2. Use Next.js 15 async params pattern
3. Fetch project details
4. Render PartNumberBuilder with project context
5. Handle Add to BOM action

---

### Task 4.3: Navigation Integration
**Status**: `[ ] Not Started`  
**Priority**: Medium  
**File**: `src/components/SharedHeader.tsx` (MODIFY)

```
Acceptance Criteria:
- [ ] Add "Glenair" link to main navigation
- [ ] Icon for Glenair section (use appropriate Lucide icon)
- [ ] Active state styling when on /glenair routes
```

---

### Task 4.4: BOM Project Integration
**Status**: `[ ] Not Started`  
**Priority**: Medium  
**File**: `src/app/bom/[projectId]/page.tsx` (MODIFY)

```
Acceptance Criteria:
- [ ] Add "Build Glenair Part" button/link in project toolbar
- [ ] Link navigates to /glenair/[projectId]
- [ ] Button shows only when Glenair catalogs exist
```

---

### Task 4.5: Landing Page Link
**Status**: `[ ] Not Started`  
**Priority**: Low  
**File**: `src/components/LandingPage.tsx` (MODIFY)

```
Acceptance Criteria:
- [ ] Add Glenair module card to landing page
- [ ] Brief description of functionality
- [ ] Link to /glenair
```

---

## Sprint 5: Testing & Polish (Optional)
**Goal**: Ensure quality and handle edge cases  
**Duration**: 1-2 days

### Task 5.1: Error Handling Review
**Status**: `[ ] Not Started`  
**Priority**: Medium  

```
Acceptance Criteria:
- [ ] All API routes have try/catch with appropriate error responses
- [ ] UI components handle loading and error states
- [ ] User-friendly error messages displayed
- [ ] Network errors handled gracefully
```

---

### Task 5.2: Loading States
**Status**: `[ ] Not Started`  
**Priority**: Medium  

```
Acceptance Criteria:
- [ ] Skeleton loaders for data-dependent components
- [ ] Loading spinners for API calls
- [ ] Disabled buttons during operations
```

---

### Task 5.3: Responsive Design Review
**Status**: `[ ] Not Started`  
**Priority**: Low  

```
Acceptance Criteria:
- [ ] Part builder works on tablet screens
- [ ] Mobile-friendly layout where practical
- [ ] No horizontal overflow issues
```

---

### Task 5.4: Documentation
**Status**: `[ ] Not Started`  
**Priority**: Low  

```
Acceptance Criteria:
- [ ] Update README.md with Glenair module info
- [ ] Add JSDoc comments to all public functions
- [ ] Create user guide for Glenair part builder
```

---

## Progress Tracking

### Sprint Summary

| Sprint | Status | Completion |
|--------|--------|------------|
| Sprint 1: Foundation | `[x] Complete` | 6/6 tasks |
| Sprint 2: API Layer | `[x] Complete` | 6/6 tasks |
| Sprint 3: UI Components | `[x] Complete` | 9/10 tasks |
| Sprint 4: Pages & Integration | `[ ] Not Started` | 0/5 tasks |
| Sprint 5: Testing & Polish | `[ ] Not Started` | 0/4 tasks |

### Overall Progress: 21/31 tasks (68%)

---

## Gap Fixes Applied (Post-Sprint 2)

### ✅ Critical Gap 1: AWG Conversion Table - FIXED
- Added missing AWG sizes 34, 36, 40 to AWG_TO_MM2 table
- Now supports complete range from Python version

### ✅ Critical Gap 2: Decimal Normalization - FIXED  
- Ported Python's normalize_decimal logic exactly
- Handles European formats like "0,15-0,6" → "0.15-0.6"
- Preserves range separators properly

### ✅ High Gap 3: Data Structure Handling - FIXED
- Enhanced extractWireSizesFromData to handle DataFrame-like structures
- Supports both row arrays and {data, columns} format
- Matches Python pandas DataFrame behavior

### ✅ High Gap 4: Wire Validation - FIXED
- Ported complete validation logic from Python
- Added standard AWG size checking
- Enhanced error messages to match Python version

### ✅ Missing Type: ValidationResult - ADDED
- Added ValidationResult interface to types
- Supports validation result pattern from Python

---

## Current Status Summary

**Sprint 1**: ✅ Complete (6/6 tasks) - All critical gaps fixed
**Sprint 2**: ✅ Complete (6/6 tasks) - API layer implemented
**Sprint 3**: ✅ Nearly Complete (9/10 tasks) - All components built, missing index export
**Gap Resolution**: ✅ Complete (4/4 critical gaps fixed)

**Ready for Sprint 4**: Pages & Integration - **CRITICAL PATH TO USER ACCESS**

### ⚠️ Important Note
All backend functionality and UI components are complete and functional, but **the feature is not accessible to users** because:
- No page routes exist (`/glenair`, `/glenair/[projectId]`)
- No navigation links to access the feature
- No integration with existing BOM workflow

Sprint 4 is the critical path to making this feature usable.

---

## Quick Reference: File Locations

### New Files to Create
```
src/
├── types/
│   └── glenair.ts                          # Type definitions
├── lib/
│   └── glenair/
│       ├── index.ts                        # Re-exports
│       ├── wire-gauge.ts                   # Wire gauge utilities
│       ├── catalog-parser.ts               # Catalog parsing
│       └── part-builder.ts                 # Part number logic
├── components/
│   └── glenair/
│       ├── index.ts                        # Re-exports
│       ├── WireGaugeSelector.tsx           # Wire input
│       ├── ContactSizeDisplay.tsx          # Contact sizes
│       ├── ArrangementPicker.tsx           # Arrangement selection
│       ├── ShellStyleSelector.tsx          # Shell style
│       ├── ContactSelector.tsx             # Pin/Socket selection
│       ├── PartNumberDisplay.tsx           # Results display
│       ├── PartNumberBuilder.tsx           # Main orchestrator
│       └── CatalogManager.tsx              # Catalog management
└── app/
    ├── glenair/
    │   ├── page.tsx                        # Landing page
    │   └── [projectId]/
    │       └── page.tsx                    # Project builder
    └── api/
        └── glenair/
            ├── catalog/
            │   ├── route.ts                # Catalog CRUD
            │   └── [catalogId]/
            │       └── route.ts            # Single catalog
            ├── contacts/
            │   └── route.ts                # Contact lookup
            ├── arrangements/
            │   └── route.ts                # Arrangement lookup
            ├── build/
            │   └── route.ts                # Part builder
            └── add-to-bom/
                └── route.ts                # BOM integration
```

### Files to Modify
```
prisma/schema.prisma                        # Add Glenair models
src/lib/store.ts                            # Add Glenair state
src/components/SharedHeader.tsx             # Add navigation
src/components/LandingPage.tsx              # Add module card
src/app/bom/[projectId]/page.tsx            # Add build button
```

---

## Notes for Build Agent

1. **Always use Next.js 15 async params pattern** when accessing route parameters
2. **Follow existing patterns** in store.ts for Zustand actions
3. **Use shadcn/ui components** - they're already installed
4. **Prisma client** is at `src/lib/db.ts` - import as `import { prisma } from '@/lib/db'`
5. **Reference Python source** at `Glenair Extractor/utils/wire_gauge.py` for logic
6. **Reference page workflow** at `Glenair Extractor/pages/4_🔢_Part_Numbering.py`

---

*Last Updated: 2024*  
*Document Version: 1.0*
