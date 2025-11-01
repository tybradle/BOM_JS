# Sprint: Settings Management System - MVP Implementation

**Sprint Duration**: 2 weeks (10 working days)  
**Sprint Goal**: Implement a comprehensive settings system with 5 configuration categories  
**Team Size**: 1 developer  
**Priority**: Medium  
**Dependencies**: None (uses existing infrastructure)

---

## Table of Contents
1. [Sprint Overview](#sprint-overview)
2. [Technical Architecture](#technical-architecture)
3. [Day-by-Day Breakdown](#day-by-day-breakdown)
4. [Task Checklist](#task-checklist)
5. [Validation & Testing](#validation--testing)
6. [Risk Mitigation](#risk-mitigation)
7. [Success Metrics](#success-metrics)

---

## Sprint Overview

### Objectives
- ✅ Create extensible settings infrastructure
- ✅ Implement 5 settings categories (15-20 individual settings)
- ✅ Provide persistent storage (client + server)
- ✅ Apply settings across application in real-time
- ✅ Enable settings import/export for backup

### User Stories

**US-1**: As a user, I want to customize the application appearance (theme, font size) to improve readability  
**US-2**: As a user, I want to set default import/export preferences to save time on repetitive tasks  
**US-3**: As a user, I want to configure table behavior to match my workflow  
**US-4**: As a user, I want to manage my profile information for accurate audit trails  
**US-5**: As a power user, I want advanced controls for performance and troubleshooting

### Out of Scope (Future Sprints)
- ❌ Data validation rule configuration
- ❌ Keyboard shortcut customization
- ❌ Internationalization/localization
- ❌ Column visibility preferences
- ❌ Network/collaboration settings

---

## Technical Architecture

### Component Structure
```
src/
├── components/
│   └── SettingsDialog.tsx          # Main settings dialog (NEW)
├── lib/
│   ├── store.ts                    # Add settings state (MODIFIED)
│   └── settings-defaults.ts        # Default settings config (NEW)
├── app/api/
│   └── settings/
│       └── route.ts                # Settings API endpoint (NEW)
└── types/
    └── settings.ts                 # Settings type definitions (NEW)

prisma/
└── schema.prisma                   # Add UserSettings model (MODIFIED)
```

### Data Model

```typescript
// TypeScript Interface
interface AppSettings {
  appearance: {
    theme: 'light' | 'dark' | 'system'
    tableRowHeight: 'compact' | 'comfortable' | 'spacious'
    fontSize: 'small' | 'medium' | 'large'
    toastPosition: 'top-right' | 'bottom-right' | 'top-center' | 'bottom-left'
  }
  importExport: {
    import: {
      addMissingPartsToDatabase: boolean
      defaultUnit: string
      defaultCurrency: string
    }
    export: {
      defaultFormat: 'EPLAN' | 'CSV' | 'EXCEL'
      includeEmptyFields: boolean
      autoDownload: boolean
    }
  }
  table: {
    defaultSortColumn: string
    defaultSortDirection: 'asc' | 'desc'
    autoSaveDelay: number
    confirmBeforeDelete: boolean
    showRowNumbers: boolean
  }
  user: {
    name: string
    email: string
    defaultAuthorId: string | null
  }
  advanced: {
    enablePerformanceMonitoring: boolean
    cacheSearchResults: boolean
    logLevel: 'error' | 'warn' | 'info' | 'debug'
    showDeveloperTools: boolean
  }
}
```

```prisma
// Prisma Schema
model UserSettings {
  id        String   @id @default(cuid())
  userId    String   @unique
  settings  Json     // Stores AppSettings as JSON
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Storage Strategy
- **Client-side**: localStorage for immediate access and offline support
- **Server-side**: Database for cross-device sync and backup
- **Sync Logic**: localStorage as source of truth, periodic sync to server
- **Fallback**: Default settings if no stored values exist

---

## Day-by-Day Breakdown

### **DAY 1: Foundation & Infrastructure** ✅ COMPLETE

#### Morning Session (4 hours)
**Task 1.1: Create Type Definitions** ✅
- [x] Create `src/types/settings.ts`
- [x] Define `AppSettings` interface
- [x] Define individual setting category interfaces
- [x] Export default settings constant

**Validation Loop 1.1**:
```bash
# Verify TypeScript compilation
npm run build

# Check for type errors
npx tsc --noEmit
```
✅ **Pass Criteria**: No TypeScript errors, all types exported correctly

---

**Task 1.2: Update Prisma Schema** ✅
- [x] Add `UserSettings` model to `prisma/schema.prisma`
- [x] Add relation to `User` model
- [x] Run database migration

**Implementation**:
```prisma
model UserSettings {
  id        String   @id @default(cuid())
  userId    String   @unique
  settings  Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}

model User {
  // ... existing fields
  settings  UserSettings?
}
```

**Validation Loop 1.2**:
```bash
# Push schema changes
npm run db:push

# Regenerate Prisma Client
npm run db:generate

# Verify migration
npx prisma studio
# Navigate to UserSettings table - should exist
```
✅ **Pass Criteria**: UserSettings table created, relation to User established

---

#### Afternoon Session (4 hours)

**Task 1.3: Create Settings API Route** ✅
- [x] Create `/api/settings/route.ts`
- [x] Implement GET handler (fetch settings)
- [x] Implement PATCH handler (update settings)
- [x] Add validation and error handling

**Implementation Checklist**:
- [x] Import Prisma client
- [x] Get current user from session/auth
- [x] Merge partial updates with existing settings
- [x] Return full settings object
- [x] Handle first-time user (no settings yet)

**Validation Loop 1.3**:
```bash
# Start development server
npm run dev

# Test GET endpoint
curl http://localhost:3000/api/settings

# Test PATCH endpoint
curl -X PATCH http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -d '{"appearance":{"theme":"dark"}}'
```
✅ **Pass Criteria**: 
- GET returns default settings for new user
- PATCH updates settings and returns merged result
- Database record created/updated

---

**Task 1.4: Update Zustand Store** ✅
- [x] Add settings state to `src/lib/store.ts`
- [x] Add `fetchSettings()` action
- [x] Add `updateSettings()` action
- [x] Add `resetSettings()` action
- [x] Implement localStorage sync

**Implementation Checklist**:
- [x] Add `settings: AppSettings | null` to state
- [x] Add `settingsLoaded: boolean` flag
- [x] Implement localStorage read on init
- [x] Implement localStorage write on update
- [x] Add debounced server sync (500ms delay)

**Validation Loop 1.4**:
```typescript
// In browser console
const store = useBOMStore.getState()
store.fetchSettings() // Should fetch from API
store.updateSettings({ appearance: { theme: 'dark' } }) // Should update

// Check localStorage
localStorage.getItem('app-settings') // Should have JSON string
```
✅ **Pass Criteria**:
- Settings load from localStorage on app start
- Settings update both localStorage and server
- No console errors

---

### **DAY 2: Settings Dialog Component**

#### Morning Session (4 hours)

**Task 2.1: Create Settings Dialog Shell** ✅
- [x] Create `src/components/SettingsDialog.tsx`
- [x] Implement dialog structure with tabs
- [x] Add to SharedHeader
- [x] Wire up open/close state

**Implementation Checklist**:
- [ ] Use existing Dialog component pattern
- [ ] Create Tabs component (Appearance, Import/Export, Table, User, Advanced)
- [ ] Add Settings button to SharedHeader
- [ ] Manage dialog open state

**Validation Loop 2.1**:
```bash
# Run dev server
npm run dev

# Manual testing
1. Click "Settings" button in header
2. Dialog should open
3. See 5 tabs
4. Click each tab - content area should be empty placeholders
5. Close dialog with X button or Cancel
```
✅ **Pass Criteria**:
- Settings button visible in header
- Dialog opens/closes smoothly
- All 5 tabs render
- No console errors

---

#### Afternoon Session (4 hours)

**Task 2.2: Implement Appearance Tab UI** ✅
- [x] Create theme selector (radio group)
- [x] Create table row height selector
- [x] Create font size selector
- [x] Create toast position selector
- [x] Add live preview indicators

**Implementation Checklist**:
- [ ] Use RadioGroup for mutually exclusive options
- [ ] Use Select for dropdowns
- [ ] Show current values from store
- [ ] Add icons for visual clarity
- [ ] Group related settings in cards

**Validation Loop 2.2**:
```bash
# Run dev server
npm run dev

# Manual testing
1. Open Settings dialog
2. Navigate to Appearance tab
3. Verify all controls render
4. Check that current values are pre-selected
5. Change each setting - verify state updates in React DevTools
```
✅ **Pass Criteria**:
- All 4 appearance settings visible
- Current values pre-populated
- UI updates when changing selections
- No console errors

---

**Task 2.3: Implement Theme Switching Logic** ✅
- [x] Create theme application function
- [x] Add dark mode CSS classes
- [x] Update layout.tsx to apply theme
- [x] Test theme persistence

**Implementation Checklist**:
- [ ] Add `data-theme` attribute to `<html>` tag
- [ ] Create CSS custom properties for colors
- [ ] Handle 'system' theme (detect OS preference)
- [ ] Apply theme on settings load
- [ ] Update theme on setting change

**Validation Loop 2.3**:
```bash
# Manual testing
1. Set theme to "Dark"
2. Verify dark mode applies immediately
3. Refresh page - dark mode should persist
4. Set theme to "System"
5. Change OS theme - app should follow
6. Check localStorage for theme value
```
✅ **Pass Criteria**:
- Light theme applies correctly
- Dark theme applies correctly
- System theme detects OS preference
- Theme persists across page refresh

---

### **DAY 3: Import/Export Settings Tab** ✅ COMPLETE

#### Morning Session (4 hours)

**Task 3.1: Build Import Settings UI** ✅
- [x] Create checkbox for "Add missing parts to database"
- [x] Create input for default unit
- [x] Create input for default currency
- [x] Add validation for currency codes

**Implementation Checklist**:
- [x] Use Checkbox component
- [x] Use Input with validation
- [x] Show helper text for formats
- [x] Bind to store values

**Validation Loop 3.1**:
```bash
# Manual testing
1. Open Settings → Import/Export tab
2. Toggle "Add missing parts" checkbox
3. Enter default unit (e.g., "EA", "PCS")
4. Enter default currency (e.g., "USD", "EUR")
5. Verify values save to store
6. Check localStorage
```
✅ **Pass Criteria**:
- All import settings render
- Values update in store
- Invalid currency codes show error
- Settings persist

---

#### Afternoon Session (4 hours)

**Task 3.2: Build Export Settings UI** ✅
- [x] Create radio group for default format
- [x] Create checkbox for "Include empty fields"
- [x] Create checkbox for "Auto-download"
- [x] Add format descriptions

**Validation Loop 3.2**:
```bash
# Manual testing
1. Select default export format (EPLAN/CSV/EXCEL)
2. Toggle "Include empty fields"
3. Toggle "Auto-download"
4. Verify selections save
5. Close and reopen dialog - values should persist
```
✅ **Pass Criteria**:
- All export settings functional
- Radio group exclusive selection works
- Values persist across dialog close/open

---

**Task 3.3: Integrate Settings with ImportPreviewDialog** ✅
- [x] Read `addMissingPartsToDatabase` from settings
- [x] Pre-check checkbox based on setting
- [x] Read default unit/currency
- [x] Apply defaults to imported items

**Implementation Checklist**:
- [x] Import settings from store in ImportPreviewDialog
- [x] Set initial checkbox state from settings
- [x] Apply default unit to items missing unit
- [x] Apply default currency to prices

**Validation Loop 3.3**:
```bash
# Manual testing
1. Set "Add missing parts" to checked in Settings
2. Import a CSV file
3. Verify checkbox is pre-checked in Import Preview
4. Set default unit to "PCS" in Settings
5. Import CSV with items missing unit
6. Verify items get "PCS" as unit
```
✅ **Pass Criteria**:
- Import dialog respects settings
- Defaults applied to imported data
- User can still override checkbox
- No regression in import functionality

---

**Task 3.4: Integrate Settings with ExportDialog** ✅
- [x] Pre-select default format
- [x] Apply "Include empty fields" setting
- [x] Apply "Auto-download" setting
- [x] Test export with settings

**Validation Loop 3.4**:
```bash
# Manual testing
1. Set default export format to "CSV" in Settings
2. Open Export dialog
3. Verify CSV is pre-selected
4. Export file - verify format is correct
5. Set "Auto-download" to false
6. Export - should not auto-download (show content instead)
```
✅ **Pass Criteria**:
- Export dialog pre-selects format from settings
- Empty fields inclusion works
- Auto-download toggle works
- Settings improve export UX

---

### **DAY 4: Table Behavior Settings Tab** ✅ COMPLETE

#### Morning Session (4 hours)

**Task 4.1: Build Table Settings UI** ✅
- [x] Create select for default sort column
- [x] Create radio for sort direction
- [x] Create slider for auto-save delay
- [x] Create checkbox for confirm delete
- [x] Create checkbox for show row numbers

**Implementation Checklist**:
- [x] Populate sort column dropdown with actual BOM columns
- [x] Use Slider component for delay (0-2000ms)
- [x] Show current delay value in real-time
- [x] Group logically (sorting, editing, display)

**Validation Loop 4.1**:
```bash
# Manual testing
1. Open Settings → Table Behavior
2. Select default sort column (e.g., "Part Number")
3. Select sort direction (Asc/Desc)
4. Adjust auto-save delay slider
5. Toggle "Confirm before delete"
6. Toggle "Show row numbers"
7. Verify all values save to store
```
✅ **Pass Criteria**:
- All 5 table settings render
- Slider updates delay value display
- Settings save to store
- No console errors

---

#### Afternoon Session (4 hours)

**Task 4.2: Apply Sort Settings to EditableBOMTable** ✅
- [x] Read default sort from settings
- [x] Apply on table mount
- [x] Preserve user manual sorting
- [x] Test with different sort configurations

**Implementation Checklist**:
- [x] Import settings in EditableBOMTable
- [x] Initialize `sortConfig` state from settings
- [x] Only apply if user hasn't manually sorted
- [x] Store manual sort overrides in component state

**Validation Loop 4.2**:
```bash
# Manual testing
1. Set default sort to "Description, Desc" in Settings
2. Open a BOM project
3. Verify table sorts by Description descending
4. Manually click "Part Number" header
5. Verify manual sort overrides setting
6. Refresh page - should revert to settings default
```
✅ **Pass Criteria**:
- Default sort applies on table load
- User can override with manual sort
- Settings don't interfere with manual sorting
- Sort persists across navigation

---

**Task 4.3: Implement Auto-Save Delay** ✅
- [x] Add debounce to cell edit save
- [x] Use delay from settings
- [x] Show visual indicator during delay
- [x] Test with different delay values

**Implementation Checklist**:
- [x] Import debounce utility or create one
- [x] Wrap `onItemUpdate` call with debounce
- [x] Read delay value from settings
- [x] Add loading indicator to editing cell
- [x] Handle component unmount (cancel pending saves)

**Validation Loop 4.3**:
```bash
# Manual testing
1. Set auto-save delay to 1000ms in Settings
2. Edit a BOM item cell
3. Start typing - verify no immediate save
4. Stop typing - verify save after 1 second
5. Set delay to 0ms
6. Edit cell - should save immediately on change
```
✅ **Pass Criteria**:
- Auto-save respects delay setting
- 0ms delay = immediate save
- Pending saves cancel if cell loses focus
- No duplicate save calls

---

**Task 4.4: Implement Confirm Delete & Row Numbers** ✅
- [x] Add confirmation dialog for delete (if setting enabled)
- [x] Add row number column (if setting enabled)
- [x] Style row numbers column
- [x] Test both features

**Implementation Checklist**:
- [x] Read `confirmBeforeDelete` from settings
- [x] Wrap delete calls with confirmation dialog
- [x] Read `showRowNumbers` from settings
- [x] Conditionally render row number column
- [x] Style column as non-editable, gray background

**Validation Loop 4.4**:
```bash
# Manual testing - Confirm Delete
1. Enable "Confirm before delete" in Settings
2. Select a BOM item and click Delete
3. Verify confirmation dialog appears
4. Cancel - item not deleted
5. Confirm - item deleted
6. Disable setting - delete should be immediate

# Manual testing - Row Numbers
1. Enable "Show row numbers" in Settings
2. Open BOM table
3. Verify row number column appears (1, 2, 3...)
4. Disable setting
5. Row number column should disappear
```
✅ **Pass Criteria**:
- Confirm delete works when enabled
- Direct delete works when disabled
- Row numbers display correctly
- Settings apply immediately

---

**Day 4 Summary**:
- ✅ All 4 tasks completed successfully
- ✅ Table settings UI fully implemented
- ✅ Default sort integrated with BOM table
- ✅ Auto-save delay with visual feedback
- ✅ Delete confirmation and row numbers working
- ✅ Documentation created (DAY_4_IMPLEMENTATION_COMPLETE.md, TABLE_SETTINGS_GUIDE.md)

**Files Modified**:
- `src/components/SettingsDialog.tsx` - Added Table Behavior tab
- `src/components/editable-bom-table.tsx` - Integrated all settings
- `src/lib/utils.ts` - Added debounce utility

**Ready for Day 5: User Profile & Advanced Settings**

---

### **DAY 5: User Profile & Advanced Settings**

#### Morning Session (4 hours)

**Task 5.1: Build User Profile Tab**
- [ ] Create form for name and email
- [ ] Show current user info
- [ ] Add validation for email format
- [ ] Save to User table (not just settings)

**Implementation Checklist**:
- [ ] Use Input components with validation
- [ ] Fetch current user from database
- [ ] Update User model, not just UserSettings
- [ ] Show success toast on save
- [ ] Handle validation errors

**Validation Loop 5.1**:
```bash
# Manual testing
1. Open Settings → User Profile
2. Verify current name and email are displayed
3. Change name to "Test User"
4. Change email to "test@example.com"
5. Click Save
6. Verify success toast
7. Refresh page - changes should persist
8. Try invalid email format - should show error
```
✅ **Pass Criteria**:
- Current user info loads
- Valid updates save to database
- Invalid email shows error
- Changes persist across refresh

---

**Task 5.2: Build Advanced Settings Tab**
- [ ] Create checkbox for performance monitoring
- [ ] Create checkbox for cache search results
- [ ] Create select for log level
- [ ] Create checkbox for developer tools (Electron)
- [ ] Add "Clear Cache" button
- [ ] Add "Reset All Settings" button

**Implementation Checklist**:
- [ ] Use Checkbox components
- [ ] Use Select for log level
- [ ] Conditionally show DevTools option (only in Electron)
- [ ] Implement clear cache function
- [ ] Implement reset settings with confirmation

**Validation Loop 5.2**:
```bash
# Manual testing
1. Open Settings → Advanced
2. Toggle each checkbox
3. Select different log levels
4. Click "Clear Cache" - verify confirmation
5. Click "Reset All Settings" - verify confirmation
6. After reset, verify settings return to defaults
```
✅ **Pass Criteria**:
- All advanced settings functional
- Clear cache clears localStorage
- Reset settings restores defaults
- Confirmations prevent accidental actions

---

#### Afternoon Session (4 hours)

**Task 5.3: Implement Performance Monitoring**
- [ ] Create performance monitor component
- [ ] Show metrics when enabled
- [ ] Log performance data
- [ ] Add toggle in settings

**Implementation Checklist**:
- [ ] Use existing `src/lib/performance-monitor.ts`
- [ ] Add UI overlay for metrics (if setting enabled)
- [ ] Show: page load time, API response times, render count
- [ ] Position in bottom-left corner
- [ ] Add close button

**Validation Loop 5.3**:
```bash
# Manual testing
1. Enable "Performance Monitoring" in Settings
2. Verify metrics overlay appears
3. Navigate app - verify metrics update
4. Disable setting - overlay disappears
5. Check console for performance logs
```
✅ **Pass Criteria**:
- Performance overlay shows when enabled
- Metrics are accurate
- No performance degradation
- Can disable easily

---

**Task 5.4: Implement Cache Search Results**
- [ ] Read setting in PartSearchDialog
- [ ] Enable/disable cache based on setting
- [ ] Clear cache when setting disabled
- [ ] Test search with cache on/off

**Implementation Checklist**:
- [ ] Import settings in PartSearchDialog
- [ ] Use existing `src/lib/search-cache.ts`
- [ ] Wrap cache calls with setting check
- [ ] Clear cache when toggling off

**Validation Loop 5.4**:
```bash
# Manual testing - Cache Enabled
1. Enable "Cache search results" in Settings
2. Open Part Search Dialog
3. Search for "resistor"
4. Close and reopen dialog
5. Search "resistor" again - should be instant (cached)

# Manual testing - Cache Disabled
1. Disable "Cache search results"
2. Search for "resistor"
3. Close and reopen dialog
4. Search "resistor" again - should fetch from API
```
✅ **Pass Criteria**:
- Cache works when enabled
- Cache cleared when disabled
- Search still works in both modes
- No cache-related errors

---

**Task 5.5: Implement Log Level Control**
- [ ] Create console wrapper utility
- [ ] Read log level from settings
- [ ] Filter console messages based on level
- [ ] Test with different log levels

**Implementation Checklist**:
- [ ] Create `src/lib/logger.ts`
- [ ] Export `logger.error()`, `logger.warn()`, `logger.info()`, `logger.debug()`
- [ ] Replace `console.log` calls with logger
- [ ] Filter based on settings log level

**Validation Loop 5.5**:
```bash
# Manual testing
1. Set log level to "error" in Settings
2. Check console - should only show errors
3. Set log level to "info"
4. Check console - should show info, warn, error
5. Set log level to "debug"
6. Check console - should show all logs
```
✅ **Pass Criteria**:
- Log filtering works correctly
- Performance not impacted
- Existing logs still captured
- Settings apply immediately

---

### **DAY 6: Integration & Polish**

#### Morning Session (4 hours)

**Task 6.1: Save & Cancel Button Logic**
- [ ] Implement Save button handler
- [ ] Implement Cancel button handler
- [ ] Add "unsaved changes" detection
- [ ] Add confirmation on close with unsaved changes

**Implementation Checklist**:
- [ ] Track dirty state (settings changed but not saved)
- [ ] Save button commits to store and API
- [ ] Cancel button reverts to last saved state
- [ ] Show warning dialog if closing with unsaved changes
- [ ] Disable Save button if no changes

**Validation Loop 6.1**:
```bash
# Manual testing
1. Open Settings dialog
2. Change theme to Dark
3. Verify Save button enabled
4. Click Cancel - verify changes not saved
5. Change theme again
6. Close dialog (X button) - verify warning dialog
7. Choose "Save" - changes should save
8. Reopen - verify saved theme applied
```
✅ **Pass Criteria**:
- Save button only enabled when changes exist
- Cancel reverts changes
- Close warning prevents data loss
- All changes persist after save

---

**Task 6.2: Settings Export/Import**
- [ ] Add "Export Settings" button
- [ ] Generate JSON file with all settings
- [ ] Add "Import Settings" button
- [ ] Parse and validate imported settings
- [ ] Apply imported settings

**Implementation Checklist**:
- [ ] Create download function for settings JSON
- [ ] Add file input for import
- [ ] Validate imported JSON schema
- [ ] Merge imported settings with defaults
- [ ] Show success/error toast

**Validation Loop 6.2**:
```bash
# Manual testing - Export
1. Configure several settings
2. Click "Export Settings"
3. Verify JSON file downloads
4. Open file - verify all settings present

# Manual testing - Import
1. Reset all settings to defaults
2. Click "Import Settings"
3. Select previously exported file
4. Verify all settings restored
5. Try importing invalid JSON - should show error
```
✅ **Pass Criteria**:
- Export creates valid JSON file
- Import reads and applies settings
- Invalid imports show error
- No data loss during import/export

---

#### Afternoon Session (4 hours)

**Task 6.3: Apply Font Size Setting**
- [ ] Create CSS custom properties for font sizes
- [ ] Apply to table, dialogs, and inputs
- [ ] Test with small, medium, large
- [ ] Ensure readability at all sizes

**Implementation Checklist**:
- [ ] Add `data-font-size` attribute to `<html>`
- [ ] Define CSS variables: `--font-size-base`, `--font-size-table`, etc.
- [ ] Update component styles to use variables
- [ ] Test with all three sizes

**Validation Loop 6.3**:
```bash
# Manual testing
1. Set font size to "Small" in Settings
2. Verify table text is smaller
3. Set font size to "Large"
4. Verify table text is larger
5. Check dialogs, buttons, inputs - all should scale
6. Ensure no text overflow or layout breaks
```
✅ **Pass Criteria**:
- All three font sizes work
- Text scales proportionally
- No layout breaks
- Readability maintained

---

**Task 6.4: Apply Table Row Height Setting**
- [ ] Create CSS classes for row heights
- [ ] Apply to EditableBOMTable
- [ ] Test with compact, comfortable, spacious
- [ ] Verify alignment and spacing

**Implementation Checklist**:
- [ ] Define classes: `.table-row-compact`, `.table-row-comfortable`, `.table-row-spacious`
- [ ] Set padding and line-height for each
- [ ] Apply class to table based on setting
- [ ] Test with large datasets

**Validation Loop 6.4**:
```bash
# Manual testing
1. Set row height to "Compact"
2. Open BOM table with 20+ items
3. Verify rows are tighter, more fit on screen
4. Set to "Spacious"
5. Verify rows are taller, more whitespace
6. Ensure cell content doesn't overflow
```
✅ **Pass Criteria**:
- Compact mode maximizes visible rows
- Spacious mode improves readability
- Cell alignment correct in all modes
- No visual glitches

---

**Task 6.5: Apply Toast Position Setting**
- [ ] Update toast configuration
- [ ] Position based on setting
- [ ] Test all four positions
- [ ] Ensure toasts don't overlap UI elements

**Implementation Checklist**:
- [ ] Update `src/hooks/use-toast.ts` or toast provider
- [ ] Read position from settings
- [ ] Apply CSS positioning
- [ ] Test with multiple simultaneous toasts

**Validation Loop 6.5**:
```bash
# Manual testing
1. Set toast position to "Top Right"
2. Trigger a toast (e.g., save project)
3. Verify toast appears in top right
4. Set to "Bottom Left"
5. Trigger toast - should appear bottom left
6. Test all 4 positions
7. Trigger multiple toasts - verify stacking
```
✅ **Pass Criteria**:
- Toasts appear in correct position
- All 4 positions work
- Multiple toasts stack properly
- Toasts don't cover important UI

---

### **DAY 7: Testing & Bug Fixes**

#### Full Day Session (8 hours)

**Task 7.1: Comprehensive Manual Testing**
- [ ] Test all 15-20 settings individually
- [ ] Test settings persistence (refresh, close browser)
- [ ] Test settings across different projects
- [ ] Test edge cases (invalid values, empty strings, etc.)

**Testing Checklist**:

**Appearance Settings**:
- [ ] Light theme applies correctly
- [ ] Dark theme applies correctly
- [ ] System theme detects OS preference
- [ ] Font size small/medium/large all work
- [ ] Table row height compact/comfortable/spacious all work
- [ ] Toast position all 4 corners work

**Import/Export Settings** ✅:
- [x] Add missing parts checkbox pre-checks correctly
- [x] Default unit applies to imports
- [x] Default currency applies to imports
- [x] Default export format pre-selects
- [x] Include empty fields works
- [x] Auto-download works

**Table Settings**:
- [ ] Default sort applies on load
- [ ] Auto-save delay 0ms, 500ms, 1000ms, 2000ms all work
- [ ] Confirm delete shows/hides confirmation
- [ ] Row numbers show/hide correctly

**User Profile**:
- [ ] Name updates save to database
- [ ] Email updates save to database
- [ ] Invalid email shows error

**Advanced Settings**:
- [ ] Performance monitoring shows/hides overlay
- [ ] Cache search results enables/disables cache
- [ ] Log level filters console correctly
- [ ] Clear cache clears localStorage
- [ ] Reset settings returns to defaults

**Validation Loop 7.1**:
```bash
# Automated test script (create test-settings.js)
1. Loop through all settings
2. Change each value
3. Save settings
4. Refresh page
5. Verify value persisted
6. Reset to default
7. Verify default restored
```
✅ **Pass Criteria**: All settings work as expected, no regressions

---

**Task 7.2: Cross-Browser Testing**
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Edge
- [ ] Test in Safari (if available)

**Validation Loop 7.2**:
For each browser:
1. Open application
2. Open Settings dialog
3. Test theme switching
4. Test settings persistence
5. Test import/export
6. Check console for errors

✅ **Pass Criteria**: Settings work in all browsers, no browser-specific bugs

---

**Task 7.3: Electron-Specific Testing**
- [ ] Test in Electron app
- [ ] Test developer tools toggle
- [ ] Test file dialogs for import/export
- [ ] Test window persistence

**Validation Loop 7.3**:
```bash
# Package and run Electron app
npm run electron-pack

# Test settings in packaged app
1. Open packaged Electron app
2. Configure settings
3. Close app completely
4. Reopen app
5. Verify settings persisted
```
✅ **Pass Criteria**: All settings work in Electron, file dialogs work, persistence works

---

**Task 7.4: Performance Testing**
- [ ] Test with large datasets (100+ BOM items)
- [ ] Test settings save performance
- [ ] Test theme switching performance
- [ ] Profile component render times

**Validation Loop 7.4**:
```bash
# Use browser DevTools Performance tab
1. Start recording
2. Open Settings dialog
3. Change multiple settings
4. Save settings
5. Stop recording
6. Analyze: should be < 100ms for all operations
```
✅ **Pass Criteria**: No performance degradation, settings operations < 100ms

---

**Task 7.5: Bug Fixes & Edge Cases**
- [ ] Fix any bugs found in testing
- [ ] Handle edge cases (null values, undefined, empty strings)
- [ ] Add defensive programming (try-catch, fallbacks)
- [ ] Improve error messages

**Common Edge Cases to Test**:
- [ ] Settings API returns error → show toast, use localStorage fallback
- [ ] localStorage is full → show error, offer to export settings
- [ ] Invalid settings JSON → validate, use defaults for invalid fields
- [ ] User deleted in database → create new settings record
- [ ] Concurrent updates → last write wins, consider optimistic locking

**Validation Loop 7.5**:
For each edge case:
1. Trigger error condition
2. Verify graceful handling
3. Verify user-friendly error message
4. Verify app remains functional

✅ **Pass Criteria**: All edge cases handled gracefully, no crashes

---

### **DAY 8: Documentation & Code Review**

#### Morning Session (4 hours)

**Task 8.1: Code Documentation**
- [ ] Add JSDoc comments to all new functions
- [ ] Document complex logic
- [ ] Add inline comments for non-obvious code
- [ ] Update README if needed

**Documentation Checklist**:
```typescript
/**
 * Fetches user settings from the server and syncs with localStorage
 * @returns Promise<AppSettings> - The merged settings object
 * @throws Error if API call fails and no localStorage fallback exists
 */
async fetchSettings(): Promise<AppSettings> {
  // Implementation
}
```

**Validation Loop 8.1**:
```bash
# Generate API documentation
npx typedoc src/lib/store.ts src/types/settings.ts

# Review generated docs for completeness
```
✅ **Pass Criteria**: All public functions documented, complex logic explained

---

**Task 8.2: User Documentation**
- [ ] Create settings user guide
- [ ] Document each setting with screenshot
- [ ] Add FAQ section
- [ ] Create video walkthrough (optional)

**Documentation Structure**:
```markdown
# Settings Guide

## Appearance Settings
### Theme
Controls the color scheme of the application...
[Screenshot of theme selector]

### Font Size
Adjusts the text size throughout the app...
[Screenshot of font size selector]

...

## FAQ
**Q: My settings aren't saving**
A: Check your browser's localStorage...
```

**Validation Loop 8.2**:
- [ ] Review documentation for clarity
- [ ] Test all documented procedures
- [ ] Fix any discrepancies

✅ **Pass Criteria**: Complete user guide, all settings explained

---

#### Afternoon Session (4 hours)

**Task 8.3: Code Review Preparation**
- [ ] Run linter and fix issues
- [ ] Format code consistently
- [ ] Remove console.logs (keep logger calls)
- [ ] Remove commented code
- [ ] Remove debug code

**Validation Loop 8.3**:
```bash
# Run ESLint
npx eslint src/components/SettingsDialog.tsx --fix

# Format with Prettier
npx prettier --write "src/**/*.{ts,tsx}"

# Check for TODO/FIXME comments
grep -r "TODO\|FIXME" src/

# Build production bundle
npm run build
```
✅ **Pass Criteria**: Clean code, no linter errors, production build succeeds

---

**Task 8.4: Create Pull Request**
- [ ] Create feature branch
- [ ] Commit all changes
- [ ] Write descriptive PR description
- [ ] Add screenshots/videos
- [ ] Request code review

**PR Description Template**:
```markdown
# Settings Management System - MVP

## Summary
Implements comprehensive settings system with 5 categories and 15-20 individual settings.

## Changes
- Added UserSettings Prisma model
- Created SettingsDialog component with 5 tabs
- Added settings API endpoints (GET/PATCH)
- Integrated settings throughout application
- Added settings import/export functionality

## Testing
- [x] Manual testing (all browsers)
- [x] Electron testing
- [x] Performance testing
- [x] Edge case testing

## Screenshots
[Add screenshots of each settings tab]

## Breaking Changes
None

## Migration Required
Yes - run `npm run db:push` to add UserSettings table
```

**Validation Loop 8.4**:
```bash
# Create branch
git checkout -b feature/settings-system

# Commit changes
git add .
git commit -m "feat: implement settings management system"

# Push to remote
git push origin feature/settings-system

# Create PR on GitHub
```
✅ **Pass Criteria**: PR created, clear description, all files committed

---

### **DAY 9: QA Testing & Feedback**

#### Morning Session (4 hours)

**Task 9.1: QA Testing Round 1**
- [ ] QA tester runs test plan
- [ ] Log all bugs in issue tracker
- [ ] Prioritize bugs (critical, high, medium, low)
- [ ] Create bug fix plan

**Test Plan**:
1. Install feature branch
2. Run `npm run db:push`
3. Run `npm run dev`
4. Follow Settings User Guide
5. Test each setting
6. Test edge cases
7. Report bugs

**Validation Loop 9.1**:
- [ ] Review all bugs
- [ ] Categorize by severity
- [ ] Estimate fix time
- [ ] Update sprint board

✅ **Pass Criteria**: All bugs logged, priorities assigned

---

**Task 9.2: Bug Fixes - Critical & High Priority**
- [ ] Fix critical bugs (blockers)
- [ ] Fix high priority bugs (major issues)
- [ ] Retest after each fix
- [ ] Update PR with fixes

**Validation Loop 9.2**:
For each bug:
1. Reproduce issue
2. Identify root cause
3. Implement fix
4. Write test case
5. Verify fix works
6. Commit fix with issue number

```bash
git commit -m "fix: settings not persisting on logout (#123)"
```
✅ **Pass Criteria**: All critical and high priority bugs fixed

---

#### Afternoon Session (4 hours)

**Task 9.3: Bug Fixes - Medium & Low Priority**
- [ ] Fix medium priority bugs
- [ ] Fix low priority bugs (if time permits)
- [ ] Document any deferred bugs
- [ ] Update known issues list

**Validation Loop 9.3**:
- [ ] Retest all fixed bugs
- [ ] Verify no regressions
- [ ] Update bug tracker

✅ **Pass Criteria**: Medium bugs fixed, low bugs documented or deferred

---

**Task 9.4: Stakeholder Demo**
- [ ] Prepare demo environment
- [ ] Create demo script
- [ ] Walk through all features
- [ ] Gather feedback
- [ ] Note requested changes

**Demo Script**:
1. Open Settings from header
2. Demonstrate theme switching (instant visual change)
3. Show import/export defaults (explain time savings)
4. Show table behavior settings
5. Demonstrate settings persistence (refresh page)
6. Show settings export/import (backup/restore)
7. Q&A

**Validation Loop 9.4**:
- [ ] Note all feedback
- [ ] Prioritize requested changes
- [ ] Update backlog for future sprints

✅ **Pass Criteria**: Demo completed, feedback documented

---

### **DAY 10: Final Polish & Deployment**

#### Morning Session (4 hours)

**Task 10.1: Final Refinements**
- [ ] Implement quick wins from stakeholder feedback
- [ ] Polish UI (spacing, alignment, colors)
- [ ] Improve error messages
- [ ] Add loading states where missing
- [ ] Final accessibility check

**Accessibility Checklist**:
- [ ] All form inputs have labels
- [ ] Tab navigation works throughout dialog
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader compatible

**Validation Loop 10.1**:
```bash
# Run accessibility audit
npx @axe-core/cli http://localhost:3000

# Manual keyboard navigation test
1. Open Settings with keyboard (Tab to button, Enter)
2. Navigate tabs with arrow keys
3. Navigate form fields with Tab
4. Activate controls with Space/Enter
5. Close dialog with Esc
```
✅ **Pass Criteria**: No accessibility violations, keyboard navigation smooth

---

**Task 10.2: Production Build Testing**
- [ ] Create production build
- [ ] Test production build locally
- [ ] Verify all settings work in production
- [ ] Check bundle size
- [ ] Optimize if needed

**Validation Loop 10.2**:
```bash
# Create production build
npm run build

# Start production server
npm run start

# Test in production mode
1. Open http://localhost:3000
2. Test all settings
3. Verify no console errors
4. Check Network tab - verify API calls work

# Check bundle size
npx bundlesize

# Analyze bundle
npx @next/bundle-analyzer
```
✅ **Pass Criteria**: Production build works, bundle size acceptable (< 500KB added)

---

#### Afternoon Session (4 hours)

**Task 10.3: Create Migration Guide**
- [ ] Document database migration steps
- [ ] Document settings migration from old system (if applicable)
- [ ] Create rollback plan
- [ ] Test migration on staging

**Migration Guide**:
```markdown
# Settings System Migration

## Prerequisites
- Backup database: `npm run db:backup`
- Review changes: `git diff main feature/settings-system`

## Migration Steps
1. Pull feature branch: `git checkout feature/settings-system`
2. Install dependencies: `npm install`
3. Apply schema: `npm run db:push`
4. Verify migration: `npx prisma studio` (check UserSettings table)
5. Start app: `npm run dev`
6. Verify settings work

## Rollback Plan
1. Stop application
2. Restore database: `npm run db:restore`
3. Checkout main: `git checkout main`
4. Restart app: `npm run dev`
```

**Validation Loop 10.3**:
- [ ] Test migration on fresh database
- [ ] Test migration on database with existing data
- [ ] Test rollback procedure

✅ **Pass Criteria**: Migration guide complete, tested, rollback plan verified

---

**Task 10.4: Final Code Review**
- [ ] Address code review comments
- [ ] Refactor any code smells
- [ ] Verify test coverage
- [ ] Squash commits if needed
- [ ] Update PR description

**Validation Loop 10.4**:
```bash
# Address review comments
git commit -m "refactor: extract settings validation to utility"

# Squash commits (if requested)
git rebase -i HEAD~10

# Force push to update PR
git push origin feature/settings-system --force
```
✅ **Pass Criteria**: All review comments addressed, PR approved

---

**Task 10.5: Deployment**
- [ ] Merge PR to main
- [ ] Tag release
- [ ] Deploy to staging
- [ ] Smoke test on staging
- [ ] Deploy to production
- [ ] Monitor for errors

**Deployment Checklist**:
```bash
# Merge PR
git checkout main
git merge feature/settings-system
git push origin main

# Tag release
git tag -a v1.5.0 -m "Add settings management system"
git push origin v1.5.0

# Deploy to staging
npm run deploy:staging

# Smoke test staging
curl https://staging.bom-app.com/api/settings

# Deploy to production
npm run deploy:production

# Monitor logs
npm run logs:production
```

**Post-Deployment Monitoring** (first 24 hours):
- [ ] Monitor error logs
- [ ] Monitor API performance
- [ ] Monitor user feedback
- [ ] Be ready to hotfix or rollback

**Validation Loop 10.5**:
- [ ] Settings work in production
- [ ] No error spikes in logs
- [ ] Database migrations successful
- [ ] Users can access settings

✅ **Pass Criteria**: Deployed to production, no critical errors, users can use settings

---

## Complete Task Checklist

### Infrastructure (Day 1) ✅ COMPLETE
- [x] Type definitions created (`src/types/settings.ts`)
- [x] Prisma schema updated with UserSettings model
- [x] Settings API endpoints created (`/api/settings`)
- [x] Zustand store updated with settings state
- [x] localStorage sync implemented

### UI Components (Day 2) ✅
- [x] SettingsDialog component created
- [x] Tab navigation implemented
- [x] Settings button added to SharedHeader
- [x] Dialog open/close state management
- [x] Theme switching logic implemented

### Settings Tabs (Days 3-5)
#### Appearance Tab ✅
- [x] Theme selector (light/dark/system)
- [x] Font size selector (small/medium/large)
- [x] Table row height selector
- [x] Toast position selector
- [x] Live preview of changes

#### Import/Export Tab ✅
- [x] Import settings (checkbox, unit, currency)
- [x] Export settings (format, empty fields, auto-download)
- [x] Integration with ImportPreviewDialog
- [x] Integration with ExportDialog

#### Table Behavior Tab
- [ ] Default sort column/direction
- [ ] Auto-save delay slider
- [ ] Confirm before delete checkbox
- [ ] Show row numbers checkbox
- [ ] Integration with EditableBOMTable

#### User Profile Tab
- [ ] Name input with validation
- [ ] Email input with validation
- [ ] Save to User table
- [ ] Success/error feedback

#### Advanced Tab
- [ ] Performance monitoring toggle
- [ ] Cache search results toggle
- [ ] Log level selector
- [ ] Developer tools toggle (Electron)
- [ ] Clear cache button
- [ ] Reset all settings button

### Integration (Day 6)
- [ ] Save/Cancel button logic
- [ ] Unsaved changes detection
- [ ] Settings export to JSON
- [ ] Settings import from JSON
- [ ] Font size CSS implementation
- [ ] Table row height CSS implementation
- [ ] Toast position implementation

### Testing (Day 7)
- [ ] Manual testing all settings
- [ ] Cross-browser testing
- [ ] Electron-specific testing
- [ ] Performance testing
- [ ] Edge case handling
- [ ] Bug fixes

### Documentation (Day 8)
- [ ] Code documentation (JSDoc)
- [ ] User guide created
- [ ] FAQ section
- [ ] Code review preparation
- [ ] Pull request created

### QA & Feedback (Day 9)
- [ ] QA testing round 1
- [ ] Critical bugs fixed
- [ ] High priority bugs fixed
- [ ] Medium/low priority bugs addressed
- [ ] Stakeholder demo completed
- [ ] Feedback incorporated

### Deployment (Day 10)
- [ ] Final UI polish
- [ ] Accessibility audit passed
- [ ] Production build tested
- [ ] Migration guide created
- [ ] Code review approved
- [ ] Deployed to production

---

## Validation & Testing

### Unit Tests (Optional but Recommended)
```typescript
// src/lib/__tests__/settings.test.ts
describe('Settings Store', () => {
  it('should load default settings', () => {
    // Test implementation
  })
  
  it('should update settings in store and localStorage', () => {
    // Test implementation
  })
  
  it('should sync settings to server', () => {
    // Test implementation
  })
})
```

### Integration Tests
```typescript
// src/components/__tests__/SettingsDialog.test.tsx
describe('SettingsDialog', () => {
  it('should render all tabs', () => {
    // Test implementation
  })
  
  it('should save settings on Save button click', () => {
    // Test implementation
  })
  
  it('should warn on close with unsaved changes', () => {
    // Test implementation
  })
})
```

### E2E Tests (Playwright)
```typescript
// e2e/settings.spec.ts
test('settings persistence across sessions', async ({ page }) => {
  await page.goto('http://localhost:3000')
  await page.click('text=Settings')
  await page.click('text=Dark')
  await page.click('text=Save')
  
  // Refresh page
  await page.reload()
  
  // Verify theme persisted
  const html = await page.locator('html')
  await expect(html).toHaveAttribute('data-theme', 'dark')
})
```

---

## Risk Mitigation

### Risk 1: Settings Not Persisting
**Mitigation**:
- Implement dual storage (localStorage + database)
- Add fallback to localStorage if API fails
- Add retry logic for API calls
- Log all persistence operations

### Risk 2: Theme Switching Causes Flash
**Mitigation**:
- Load theme before rendering app
- Use inline script in HTML head
- Apply theme class immediately
- Use CSS transitions for smooth changes

### Risk 3: Settings Conflicts Across Devices
**Mitigation**:
- Implement last-write-wins strategy
- Add timestamp to settings updates
- Consider adding conflict resolution UI (future)
- Document sync behavior

### Risk 4: Performance Impact
**Mitigation**:
- Debounce settings save operations
- Use React.memo for settings components
- Lazy load settings dialog
- Profile and optimize as needed

### Risk 5: Browser Compatibility
**Mitigation**:
- Test on all major browsers
- Use polyfills for older browsers
- Gracefully degrade features if needed
- Document browser requirements

---

## Success Metrics

### Quantitative Metrics
- [ ] **Code Coverage**: > 80% for settings module
- [ ] **Bundle Size**: < 500KB increase
- [ ] **Load Time**: Settings dialog opens < 200ms
- [ ] **Save Time**: Settings save completes < 300ms
- [ ] **Browser Support**: Works in Chrome, Firefox, Edge, Safari
- [ ] **Electron Support**: Works in packaged Electron app

### Qualitative Metrics
- [ ] **User Satisfaction**: Settings improve workflow
- [ ] **Error Rate**: < 1% of settings operations fail
- [ ] **Bug Count**: < 5 bugs reported in first week
- [ ] **Documentation Quality**: Users can configure settings without help
- [ ] **Code Quality**: Passes code review without major issues

### Acceptance Criteria
- [ ] All 15-20 settings functional
- [ ] Settings persist across sessions
- [ ] Settings apply immediately (no refresh needed)
- [ ] Settings export/import works
- [ ] No regressions in existing features
- [ ] Passes accessibility audit
- [ ] Works in all supported browsers
- [ ] Works in Electron app
- [ ] Documentation complete
- [ ] Deployed to production

---

## Post-Sprint Activities

### Retrospective Questions
1. **What went well?**
   - Which tasks were completed ahead of schedule?
   - What technical approaches worked well?
   
2. **What could be improved?**
   - Which tasks took longer than expected?
   - What roadblocks were encountered?
   
3. **Action items for next sprint**
   - What technical debt was created?
   - What features should be prioritized next?

### Future Enhancements (Backlog)
- [ ] Keyboard shortcut customization
- [ ] Column visibility preferences
- [ ] Data validation rule configuration
- [ ] Internationalization/localization
- [ ] Settings sync across devices (real-time)
- [ ] Settings version control (undo/redo)
- [ ] Settings templates (presets)
- [ ] Team settings (organization-wide defaults)

---

## Appendix

### Useful Commands
```bash
# Development
npm run dev                # Start dev server
npm run build              # Production build
npm run start              # Start production server

# Database
npm run db:push            # Apply schema changes
npm run db:generate        # Regenerate Prisma Client
npm run db:studio          # Open Prisma Studio

# Testing
npm run test               # Run unit tests
npm run test:e2e           # Run E2E tests
npm run lint               # Run ESLint
npm run format             # Run Prettier

# Electron
npm run electron-dev       # Electron development
npm run electron-pack      # Package Electron app
```

### Key File Locations
```
Settings Implementation Files:
├── src/types/settings.ts              # Type definitions
├── src/lib/settings-defaults.ts       # Default values
├── src/lib/store.ts                   # Settings state management
├── src/components/SettingsDialog.tsx  # Main UI component
├── src/app/api/settings/route.ts      # API endpoints
└── prisma/schema.prisma               # Database schema

Documentation Files:
├── docs/SPRINT_SETTINGS_MVP.md        # This file
└── docs/SETTINGS_USER_GUIDE.md        # User documentation (to create)
```

### Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Electron Documentation](https://www.electronjs.org/docs)

---

**Sprint Status**: 🚀 **IN PROGRESS** - Day 4 Complete
**Last Updated**: November 1, 2025
**Next Review**: Day 5 Start

**Progress**: 4/10 days complete (40%)

### Completed Deliverables (Day 1):
- ✅ `src/types/settings.ts` - Complete TypeScript interfaces and defaults (~150 lines)
- ✅ `prisma/schema.prisma` - UserSettings model added and migrated
- ✅ `src/app/api/settings/route.ts` - GET/PATCH endpoints (~140 lines)
- ✅ `src/lib/store.ts` - Settings state management (~110 lines)
- ✅ `scripts/test-settings-api.ts` - API validation script

### Completed Deliverables (Day 2):
- ✅ `src/lib/theme.ts` - Theme management utility with system detection (~95 lines)
- ✅ `src/components/SettingsDialog.tsx` - Complete settings dialog with tabs and Appearance UI (~207 lines)
- ✅ `src/components/SharedHeader.tsx` - Integrated Settings button (~328 lines)
- ✅ `src/app/layout.tsx` - Theme initialization script to prevent flash (~57 lines)
- ✅ `src/lib/store.ts` - Enhanced with theme application calls (~782 lines)

### Completed Deliverables (Day 3):
- ✅ `src/components/SettingsDialog.tsx` - Import/Export tab UI with all controls (~150 lines)
- ✅ `src/components/ImportPreviewDialog.tsx` - Settings integration for import defaults (~100 lines)
- ✅ `src/components/ExportDialog.tsx` - Settings integration for export options (~120 lines)
- ✅ Generated Prisma client with UserSettings model

### Next Up (Day 4):
- Build Table Behavior settings tab UI
- Implement settings integration with EditableBOMTable
- Apply sort settings to table
- Implement auto-save delay functionality
- Add confirm delete and row numbers features

---

## Sign-off

**Product Owner**: _________________ Date: _______  
**Tech Lead**: _________________ Date: _______  
**QA Lead**: _________________ Date: _______

---

*End of Sprint Document*
