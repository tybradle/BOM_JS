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

## Styling Guidelines
- Use Tailwind CSS classes consistently
- Follow shadcn/ui design tokens
- Implement responsive design with mobile-first approach
- Use semantic HTML elements
- Maintain consistent spacing and typography

## TypeScript Patterns
- Define interfaces for all props
- Use generic types where appropriate
- Implement proper error boundaries
- Use discriminated unions for variant types