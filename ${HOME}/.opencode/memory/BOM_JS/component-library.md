# Component Library Documentation

## Core Business Components

### SharedHeader
- **Location**: `/src/components/SharedHeader.tsx`
- **Purpose**: Navigation and global controls
- **Features**: Project selection, user menu, global actions

### EditableBOMTable
- **Location**: `/src/components/editable-bom-table.tsx`
- **Purpose**: Excel-like table with inline editing
- **Features**: Cell validation, keyboard navigation, bulk operations

### ImportPreviewDialog
- **Location**: `/src/components/ImportPreviewDialog.tsx`
- **Purpose**: Data import with validation
- **Features**: File preview, validation feedback, import confirmation

### ExportDialog
- **Location**: `/src/components/ExportDialog.tsx`
- **Purpose**: Multiple format export functionality
- **Features**: Format selection, export options, progress tracking

### LocationTabs
- **Location**: `/src/components/LocationTabs.tsx`
- **Purpose**: Tabbed interface for project locations
- **Features**: Dynamic tabs, location switching, item counts

### SettingsDialog
- **Location**: `/src/components/SettingsDialog.tsx`
- **Purpose**: Application configuration
- **Features**: User preferences, system settings, theme selection

### DatabaseToolsDialog
- **Location**: `/src/components/DatabaseToolsDialog.tsx`
- **Purpose**: Database management operations
- **Features**: Backup, restore, archive management
- **Recent Updates (2025-01-07)**:
  - **Removed Prisma Studio**: Eliminated Prisma Studio launch functionality and related state
  - **Optimized Layout**: Changed from 3-column adaptive to fixed 2-column grid layout
  - **Fixed Button Overflow**: Resolved Master Parts Import button overflow issues
  - **Standardized Cards**: Applied consistent `min-h-[220px] flex flex-col` structure
  - **Grid Configuration**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-2`
  - **Button Layout**: Responsive grid for Master Parts Import buttons with `size="sm"`
  - **Text Optimization**: Shortened "Import Master Parts" to "Import Parts"
  - **Removed Imports**: Cleaned up unused `ServerCog` icon and related functions

### PartSearchDialog
- **Location**: `/src/components/PartSearchDialog.tsx`
- **Purpose**: Parts database search
- **Features**: Advanced search, filters, part selection

### DuplicateWarningDialog
- **Location**: `/src/components/DuplicateWarningDialog.tsx`
- **Purpose**: Duplicate detection and handling
- **Features**: Duplicate preview, merge options, conflict resolution

## UI Components (shadcn/ui)

### Form Components
- **Button**: Primary, secondary, destructive variants
- **Input**: Text, number, password inputs with validation
- **Select**: Dropdown selection with search
- **Checkbox**: Single and group checkboxes
- **Radio Group**: Radio button groups
- **Switch**: Toggle switches
- **Textarea**: Multi-line text input

### Layout Components
- **Card**: Container with header and content
- **Sheet**: Slide-out drawer
- **Dialog**: Modal dialogs
- **Tabs**: Tabbed navigation
- **Accordion**: Collapsible sections
- **Separator**: Visual dividers

### Display Components
- **Table**: Data tables with sorting and filtering
- **Badge**: Status indicators and labels
- **Avatar**: User avatars and placeholders
- **Progress**: Progress bars and indicators
- **Skeleton**: Loading placeholders

### Feedback Components
- **Alert**: Information, warning, error messages
- **Toast**: Notification system
- **Tooltip**: Hover tooltips
- **Popover**: Click-triggered popups

## Component Patterns

### Data Fetching Pattern
```typescript
const { data, loading, error } = useBOMStore()
const [localState, setLocalState] = useState()

useEffect(() => {
  fetchProjects()
}, [])
```

### Form Handling Pattern
```typescript
const [formData, setFormData] = useState(initialState)
const [errors, setErrors] = useState({})

const handleSubmit = async (e) => {
  e.preventDefault()
  try {
    await submitForm(formData)
  } catch (error) {
    setErrors(parseValidationErrors(error))
  }
}
```

### Optimistic Update Pattern
```typescript
const handleUpdate = async (id, updates) => {
  // Update UI immediately
  setOptimisticUpdate(id, updates)
  
  try {
    await api.update(id, updates)
  } catch (error) {
    // Rollback on error
    rollbackUpdate(id)
  }
}
```

### Responsive Grid Layout Pattern (Updated 2025-01-07)
```typescript
// Fixed 2-column layout for consistent appearance
<div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
  <div className="rounded-lg border p-4 shadow-sm min-h-[220px] flex flex-col">
    <div className="flex-1">Content area</div>
    <div className="mt-auto">Action buttons</div>
  </div>
</div>
```

### Button Overflow Prevention Pattern (Updated 2025-01-07)
```typescript
// Responsive button layout to prevent overflow
<div className="space-y-3">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
    <Button variant="outline" size="sm">Preview</Button>
    <Button variant="outline" size="sm">Clear</Button>
  </div>
  <Button className="w-full">Import Parts</Button>
</div>
```

## Styling Guidelines
- Use Tailwind CSS classes consistently
- Follow shadcn/ui design tokens
- Implement responsive design with mobile-first approach
- Use semantic HTML elements
- Maintain consistent spacing and typography
- **Updated**: Use fixed grid layouts instead of adaptive `auto-fit` for consistency

## TypeScript Patterns
- Define interfaces for all props
- Use generic types where appropriate
- Implement proper error boundaries
- Use discriminated unions for variant types
- **Updated**: Remove unused imports and state variables for cleaner code

## Recent Architecture Changes (2025-01-07)

### DatabaseToolsDialog Optimization
1. **Layout Simplification**: Removed adaptive grid in favor of fixed 2-column layout
2. **Component Cleanup**: Removed Prisma Studio functionality entirely
3. **Button Optimization**: Fixed overflow issues with responsive button layouts
4. **Visual Consistency**: Standardized card dimensions and spacing
5. **Code Quality**: Removed unused state, functions, and imports

### Performance Improvements
- Reduced component complexity by removing unused features
- Improved responsive behavior with predictable grid layouts
- Enhanced mobile experience with proper button sizing
- Maintained accessibility with semantic HTML structure