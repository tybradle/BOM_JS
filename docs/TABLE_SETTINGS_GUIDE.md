# Table Behavior Settings - Quick Reference

## Overview
The Table Behavior settings tab allows you to customize how BOM tables work, including sorting, saving, deletion, and display options.

## Settings Reference

### 1. Default Sorting

**Default Sort Column**
- **Type**: Dropdown selection
- **Options**: Part Number, Description, Manufacturer, Category, Quantity, Unit Price, Status
- **Default**: Part Number
- **Behavior**: 
  - Applied when opening a BOM project
  - User can override by clicking column headers
  - Resets to default on page refresh

**Default Sort Direction**
- **Type**: Button toggle
- **Options**: Ascending, Descending
- **Default**: Ascending
- **Icon Indicators**: ↑ Ascending, ↓ Descending

---

### 2. Auto-Save Delay

**Setting**: Slider (0-2000ms)
- **Default**: 500ms
- **Range**: 0-2000 milliseconds
- **Step**: 100ms
- **Behavior**:
  - **0ms**: Immediate save (no delay, no loading indicator)
  - **100-2000ms**: Debounced save with spinning loader icon
  - **Enter key**: Always saves immediately (bypasses delay)
  - **Blur (click outside)**: Saves immediately (prevents data loss)

**Visual Feedback**:
- Loading spinner appears in input field during pending save
- Only shows when delay > 0ms

**Use Cases**:
- **0ms**: For fast typists who want instant saves
- **500ms** (default): Balanced performance and UX
- **1000-2000ms**: Reduce server load, wait for typing to complete

---

### 3. Confirm Before Delete

**Setting**: Checkbox
- **Default**: Enabled (checked)
- **Behavior**:
  - **Enabled**: Shows confirmation dialog before deleting items
  - **Disabled**: Deletes immediately without confirmation

**Confirmation Dialog**:
- Shows count of items to be deleted
- "Are you sure?" message
- Red destructive-styled Delete button
- Cancel option to abort

**Recommended**: Keep enabled to prevent accidental deletions

---

### 4. Show Row Numbers

**Setting**: Checkbox
- **Default**: Disabled (unchecked)
- **Behavior**:
  - **Enabled**: Adds "#" column with sequential numbers (1, 2, 3...)
  - **Disabled**: Row number column hidden

**Row Number Column**:
- Located after checkbox column, before Part Number
- Styled with muted background and monospace font
- Non-editable
- Updates when table is sorted
- Helps with item counting and reference

---

## How Settings Are Applied

### Persistence
- Settings saved to **localStorage** immediately on change
- Settings synced to **database** with 500ms debounce
- Persist across:
  - Page refreshes
  - Browser sessions
  - Projects
  - Locations

### Scope
- Table settings are **global** (apply to all projects and locations)
- Settings apply immediately (no save button required)
- Can be reset to defaults via Advanced Settings → Reset All Settings

---

## Common Workflows

### Workflow 1: Excel-Like Immediate Saves
1. Open Settings → Table Behavior
2. Set Auto-Save Delay to **0ms**
3. Start editing cells
4. Changes save instantly on every keystroke

### Workflow 2: Batch Editing with Delayed Save
1. Set Auto-Save Delay to **1500ms**
2. Edit a cell value
3. Continue typing - save pending (loading spinner)
4. Stop typing for 1.5 seconds - auto-saves
5. Or press Enter to save immediately

### Workflow 3: Safe Deletion Workflow
1. Keep "Confirm before delete" **enabled**
2. Select items with checkboxes
3. Click Delete button
4. Review confirmation dialog
5. Confirm or cancel

### Workflow 4: Quick Item Reference
1. Enable "Show row numbers"
2. Row numbers appear in first column
3. Use for:
   - Verbally referencing items ("Check row 15")
   - Counting items quickly
   - Noting position before/after sorting

---

## Keyboard Shortcuts

| Action | Shortcut | Behavior |
|--------|----------|----------|
| Save cell immediately | Enter | Bypasses auto-save delay |
| Cancel edit | Escape | Reverts changes, cancels pending save |
| Sort column | Click header | Overrides default sort |
| Select all items | Click header checkbox | For bulk operations |

---

## Troubleshooting

### "My changes aren't saving"
- Check that auto-save delay isn't set too high
- Press Enter to force immediate save
- Click outside the cell to trigger blur save
- Check browser console for errors

### "Table always sorts the same way after refresh"
- This is expected - default sort is applied on load
- Click a column header to override
- Change default sort in Settings if you want a different initial sort

### "Delete confirmation not showing"
- Check that "Confirm before delete" setting is enabled
- Setting may have been disabled by you or another user

### "Row numbers missing"
- Check that "Show row numbers" setting is enabled
- Setting is off by default

### "Auto-save loading spinner stuck"
- Refresh the page
- May indicate a network issue
- Check browser console for errors

---

## Advanced Tips

### Performance Optimization
- Increase auto-save delay for slower connections
- Disable row numbers if not needed (minimal performance impact)
- Use default sort to reduce client-side sorting

### Data Safety
- Keep "Confirm before delete" enabled
- Use auto-save delay > 500ms to avoid race conditions
- Press Enter after important edits to ensure save

### Collaboration
- All users share the same settings model
- Settings are per-user, not per-project
- Coordinate with team on preferred defaults

---

## Related Settings

See also:
- **Appearance Settings** → Table Row Height (compact/comfortable/spacious)
- **Appearance Settings** → Font Size (affects table text)
- **Advanced Settings** → Performance Monitoring (track save times)
- **Advanced Settings** → Cache Search Results (affects part search)

---

## API Integration

Settings are managed via:
```typescript
// Read settings
const { settings } = useBOMStore()
const autoSaveDelay = settings?.table?.autoSaveDelay ?? 500

// Update settings
updateSettings({
  table: {
    ...settings.table,
    autoSaveDelay: 1000
  }
})
```

**Endpoints**:
- GET `/api/settings` - Fetch user settings
- PATCH `/api/settings` - Update user settings

**Storage**:
- Client: `localStorage` key `app-settings`
- Server: `UserSettings` table in SQLite database
