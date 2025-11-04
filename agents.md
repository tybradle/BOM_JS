# BOM Management Framework - Agentic Architecture Guide

## Overview

The BOM Management Framework is a comprehensive, locally-deployable application designed for Bill of Materials (BOM) translation and management. Built with modern web technologies, it provides an Excel-like interface for managing BOM data with support for multiple export formats compatible with PLM systems.

## 🤖 Agentic Instructions

### Primary Agent Role: Build Agent
As the **Build** agent for this framework, your responsibilities include:

1. **Feature Implementation**: End-to-end implementation of new features, from API to UI
2. **Code Quality**: Maintain TypeScript best practices, proper error handling, and clean code
3. **Database Management**: Handle Prisma schema changes, migrations, and database operations
4. **Testing & Validation**: Ensure new features work correctly and don't break existing functionality
5. **Documentation**: Update relevant documentation when implementing features

### Development Principles

#### 1. Incremental Development
- Apply changes safely and incrementally
- Explain your plan briefly before large edits
- Prefer small, reviewable diffs
- Use tests or quick checks to validate changes when appropriate

#### 2. Code Standards
- **TypeScript**: All code must be fully typed with proper interfaces
- **Error Handling**: Use try-catch blocks with meaningful error messages
- **API Responses**: Follow consistent response patterns with proper HTTP status codes
- **State Management**: Use Zustand for client state, optimistic updates where appropriate

#### 3. Database Operations
- Always use Prisma ORM for database operations
- Include proper error handling for database failures
- Use transactions for multi-table operations
- Follow the established naming conventions in schema.prisma

#### 4. UI/UX Standards
- Use shadcn/ui components consistently
- Follow the established design system with Tailwind CSS
- Implement proper loading states and error boundaries
- Ensure responsive design for mobile compatibility

### Key Implementation Patterns

#### API Route Pattern
```typescript
// File: src/app/api/[resource]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Database operation
    const result = await db.resource.findMany()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch resource:', error)
    return NextResponse.json(
      { error: 'Failed to fetch resource' },
      { status: 500 }
    )
  }
}
```

#### Store Action Pattern
```typescript
// In useBOMStore
fetchResource: async () => {
  set({ loading: true, error: null })
  try {
    const response = await fetch('/api/resource')
    if (!response.ok) throw new Error('Failed to fetch')
    const data = await response.json()
    set({ data, loading: false })
  } catch (error) {
    set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false })
  }
}
```

#### Component Pattern
```typescript
'use client'

import { useState } from 'react'
import { useBOMStore } from '@/lib/store'
import { Button } from '@/components/ui/button'

export function ComponentName() {
  const { state, action } = useBOMStore()
  const [localState, setLocalState] = useState()
  
  return (
    <div className="space-y-4">
      {/* Component JSX */}
    </div>
  )
}
```

### Critical Architecture Components

#### 1. Database Schema (prisma/schema.prisma)
- **Core Models**: User, BOMProject, Location, BOMItem, BOMExport
- **Master Data**: MasterPart, Supplier, Manufacturer, Category
- **Settings**: UserSettings with JSON storage
- **Enums**: ProjectStatus, ItemStatus, ExportFormat

#### 2. State Management (src/lib/store.ts)
- **Zustand Store**: Centralized state with devtools
- **Optimistic Updates**: UI updates immediately, API calls in background
- **Error Handling**: Graceful error boundaries and user feedback
- **Settings Integration**: LocalStorage + server sync with debouncing

#### 3. API Architecture
- **RESTful Design**: Consistent endpoint patterns
- **Error Handling**: Standardized error responses
- **Validation**: Input validation with detailed feedback
- **File Operations**: Proper multipart/form-data handling

#### 4. Component Architecture
- **Atomic Design**: Reusable component patterns
- **shadcn/ui**: Consistent component library
- **TypeScript**: Full type safety throughout
- **Responsive**: Mobile-first design approach

### Development Workflow

#### 1. Environment Setup
```bash
npm run dev          # Start development server on port 3002
npm run db:push      # Apply schema changes
npm run db:generate  # Generate Prisma client
```

#### 2. Database Changes
```bash
# 1. Modify prisma/schema.prisma
# 2. Run: npm run db:push
# 3. Run: npm run db:generate
# 4. Update TypeScript types as needed
```

#### 3. Testing
- Use existing test scripts in `/scripts/` directory
- Test API endpoints manually before UI integration
- Validate database operations with test data
- Check error handling paths

#### 4. Build & Deploy
```bash
npm run build        # Production build
npm run start        # Start production server
npm run electron-pack # Build desktop application
```

### Feature Implementation Guidelines

#### 1. New API Endpoints
- Create route in appropriate `/src/app/api/` directory
- Follow naming convention: `[resource]/[id]/[action]/route.ts`
- Include proper error handling and validation
- Update store actions to consume the API

#### 2. New UI Components
- Place in `/src/components/` for business logic
- Use `/src/components/ui/` for reusable UI elements
- Follow existing component patterns
- Include proper TypeScript interfaces

#### 3. Database Changes
- Modify `prisma/schema.prisma`
- Run migration commands
- Update TypeScript types in `/src/types/`
- Update store interfaces as needed

#### 4. Settings Integration
- Add new settings to `/src/types/settings.ts`
- Update `DEFAULT_SETTINGS` object
- Implement UI controls in `SettingsDialog.tsx`
- Add API handlers in `/src/app/api/settings/route.ts`

### Common Tasks

#### Adding a New Export Format
1. Update `ExportFormat` enum in schema.prisma
2. Add export logic in `/src/app/api/projects/[id]/export/route.ts`
3. Update format dropdown in `ExportDialog.tsx`
4. Test with sample data

#### Adding New Import Features
1. Create parsing logic in `/src/lib/csv-parser.ts` or similar
2. Add validation in `/src/lib/database/validation.ts`
3. Update `ImportPreviewDialog.tsx` for new UI
4. Add API endpoints as needed

#### Database Management Features
1. Use `/src/lib/database/` utilities for common operations
2. Follow archive patterns in `/src/lib/database/archive.ts`
3. Update `DatabaseToolsDialog.tsx` for UI
4. Add proper error handling and validation

### Performance Considerations

#### 1. Database Optimization
- Use appropriate indexes (see schema.prisma)
- Implement pagination for large datasets
- Use efficient query patterns with Prisma
- Cache frequently accessed data

#### 2. Frontend Optimization
- Implement virtual scrolling for large tables
- Use React.memo for expensive components
- Debounce search and filter operations
- Lazy load non-critical components

#### 3. Memory Management
- Clean up event listeners and subscriptions
- Use proper React cleanup patterns
- Monitor for memory leaks in long-running operations

### Security Considerations

#### 1. Input Validation
- Validate all user inputs on both client and server
- Sanitize data before database operations
- Use parameterized queries (Prisma handles this)
- Implement proper error message sanitization

#### 2. File Operations
- Validate file types and sizes
- Use secure file handling practices
- Implement proper access controls
- Clean up temporary files

### Troubleshooting Common Issues

#### 1. Database Connection Issues
- Check `DATABASE_URL` in `.env` file
- Ensure database file exists and is accessible
- Run `npm run db:push` to sync schema
- Check Prisma client generation

#### 2. Port Conflicts
- Application runs on port 3002 by default
- Use `npm run kill-port` to clear stuck processes
- Check for other applications using the port

#### 3. Build Issues
- Clear Next.js cache: `rm -rf .next`
- Regenerate Prisma client: `npm run db:generate`
- Check TypeScript compilation errors
- Verify all imports are correct

### Documentation Standards

#### 1. Code Comments
- Add JSDoc comments for complex functions
- Explain business logic where not obvious
- Document API endpoints with expected inputs/outputs
- Include examples for complex operations

#### 2. Update Documentation
- Update `README.md` for major feature changes
- Add implementation notes to `/docs/` directory
- Update feature summaries when completing sprints
- Document any breaking changes

This architecture provides a solid foundation for BOM management while maintaining flexibility for future enhancements and scale. As the Build agent, focus on maintaining code quality, following established patterns, and implementing features incrementally with proper testing and validation.

## Technology Stack

### Core Framework
- **Next.js 15** with App Router - Full-stack React framework with server-side rendering
- **TypeScript 5** - Type-safe JavaScript development
- **React 19** - UI component library with latest features

### Database & Storage
- **Prisma ORM** - Type-safe database access with migration support
- **SQLite** - Local file-based database for portability
- **JSON Metadata** - Flexible storage for extensible data

### UI & Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - High-quality, accessible React components
- **Lucide React** - Comprehensive icon library
- **Framer Motion** - Animation library for smooth transitions

### State Management
- **Zustand** - Lightweight state management
- **React Query** - Server state management and caching

### Additional Technologies
- **Socket.IO** - Real-time communication capabilities
- **Electron** - Desktop application wrapper (optional)
- **AdmZip** - ZIP file manipulation for database backups
- **PapaParse & XLSX** - CSV and Excel file parsing
- **UUID** - Unique identifier generation

## Architecture Patterns

### 1. Layered Architecture

```
┌─────────────────────────────────────┐
│         Presentation Layer          │
│  (React Components, Next.js Pages)  │
├─────────────────────────────────────┤
│         Business Logic Layer        │
│     (API Routes, Services)         │
├─────────────────────────────────────┤
│         Data Access Layer           │
│    (Prisma ORM, Database Models)   │
├─────────────────────────────────────┤
│         Data Storage Layer          │
│        (SQLite Database)           │
└─────────────────────────────────────┘
```

### 2. Component Architecture

#### UI Component Structure
- **Atomic Design**: Components follow atomic design principles
- **Compound Components**: Complex UI built from smaller, reusable components
- **Custom Hooks**: Business logic extracted into reusable hooks

#### Key Components
- `SharedHeader` - Navigation and global controls
- `EditableBOMTable` - Excel-like table with inline editing
- `ImportPreviewDialog` - Data import with validation
- `ExportDialog` - Multiple format export functionality
- `LocationTabs` - Tabbed interface for project locations
- `SettingsDialog` - Application configuration

### 3. State Management Pattern

#### Zustand Store Structure
```typescript
interface BOMStore {
  // State
  projects: BOMProject[]
  currentProject: BOMProject | null
  locations: Location[]
  bomItems: BOMItem[]
  settings: AppSettings | null
  
  // Actions
  fetchProjects: () => Promise<void>
  createProject: (data) => Promise<void>
  updateBOMItem: (id, updates) => Promise<void>
  // ... other actions
}
```

- **Centralized State**: All application state in one store
- **Optimistic Updates**: UI updates immediately, API calls in background
- **Error Boundaries**: Graceful error handling at component level

### 4. API Architecture

#### RESTful API Design
```
/api/projects          - CRUD operations for projects
/api/projects/[id]/items - BOM item management
/api/import            - Data import endpoints
/api/export            - Data export endpoints
/api/database          - Database management
/api/settings          - Application settings
```

#### API Pattern
- **Standardized Responses**: Consistent response structure
- **Error Handling**: Proper HTTP status codes with detailed messages
- **Validation**: Input validation with detailed error feedback

### 5. Database Design

#### Entity Relationship Model
```
User (1) ──── (N) BOMProject
BOMProject (1) ── (N) Location
Location (1) ──── (N) BOMItem
BOMProject (1) ── (N) BOMExport
```

#### Key Entities
- **BOMProject**: Project metadata and configuration
- **Location**: Physical/logical locations within projects
- **BOMItem**: Individual BOM components with specifications
- **BOMExport**: Export history and tracking
- **MasterPart**: Centralized parts database
- **UserSettings**: Personalized application preferences

### 6. File System Organization

```
src/
├── app/                  # Next.js App Router
│   ├── api/             # API endpoints
│   ├── bom/             # BOM management pages
│   └── layout.tsx       # Root layout
├── components/          # React components
│   ├── ui/              # Base UI components
│   └── *.tsx            # Business components
├── lib/                 # Utilities and stores
│   ├── store.ts         # Zustand store
│   ├── db.ts            # Prisma client
│   └── utils.ts         # Helper functions
├── hooks/               # Custom React hooks
└── types/               # TypeScript definitions
```

## Key Features Implementation

### 1. Excel-like Table Editing
- **Inline Editing**: Click-to-edit with keyboard navigation
- **Cell Validation**: Real-time validation with visual feedback
- **Bulk Operations**: Select multiple items for batch actions
- **Sorting & Filtering**: Dynamic table manipulation

### 2. Import/Export System
- **Multi-format Support**: CSV, JSON, XML, Excel
- **Validation Pipeline**: Comprehensive data validation
- **Error Reporting**: Detailed import/export feedback
- **Template Generation**: Export templates for data entry

### 3. Project Management
- **Hierarchical Organization**: Projects → Locations → Items
- **Metadata Management**: Extensible metadata storage
- **Version Control**: Project versioning and history
- **Access Control**: User-based permissions framework

### 4. Database Management
- **Automated Backups**: Scheduled database exports
- **Import/Restore**: Database migration capabilities
- **Archive System**: Compressed backup storage
- **Integrity Checks**: Database validation tools

## Development Workflow

### 1. Development Environment
```bash
npm run dev          # Start development server
npm run db:push      # Apply schema changes
npm run db:generate  # Generate Prisma client
```

### 2. Database Migrations
```bash
npm run db:migrate   # Run pending migrations
npm run db:reset     # Reset database to clean state
```

### 3. Build Process
```bash
npm run build        # Production build
npm run start        # Start production server
```

## Deployment Architecture

### 1. Local Deployment
- **Standalone Server**: Node.js server with embedded Next.js
- **SQLite Database**: File-based storage for portability
- **Static Assets**: Optimized asset delivery

### 2. Electron Integration
- **Desktop Application**: Wraps web app in Electron shell
- **File System Access**: Direct file operations for imports/exports
- **Native Menus**: Platform-specific menu integration
- **Auto-updater**: Automated application updates

## Security Considerations

### 1. Data Protection
- **Local Storage**: Data remains on local machine
- **Input Validation**: Comprehensive input sanitization
- **Error Handling**: No sensitive data in error messages

### 2. Access Control
- **User Authentication**: Framework for user management
- **Project Permissions**: Role-based access control
- **API Security**: Request validation and rate limiting

## Performance Optimizations

### 1. Database Optimizations
- **Indexing Strategy**: Strategic indexes for common queries
- **Query Optimization**: Efficient database queries
- **Connection Pooling**: Database connection management

### 2. Frontend Optimizations
- **Component Memoization**: Prevent unnecessary re-renders
- **Lazy Loading**: Code splitting for large components
- **Virtual Scrolling**: Efficient handling of large datasets

## Extensibility Points

### 1. Plugin Architecture
- **Export Formats**: Add new export format handlers
- **Import Parsers**: Support new file formats
- **Validation Rules**: Custom validation logic

### 2. Theme System
- **Component Theming**: Customizable component appearance
- **Dark/Light Mode**: Built-in theme switching
- **Brand Customization**: Company-specific theming

## Future Architectural Considerations

### 1. Scalability
- **Database Migration**: Path to PostgreSQL/MySQL
- **Microservices**: Service decomposition for large scale
- **Cloud Integration**: Cloud storage and synchronization

### 2. Advanced Features
- **Real-time Collaboration**: Multi-user editing capabilities
- **Workflow Integration**: PLM system integration
- **Analytics Dashboard**: Usage metrics and reporting

This architecture provides a solid foundation for BOM management while maintaining flexibility for future enhancements and scale.
