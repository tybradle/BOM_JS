# BOM Management Framework - Agent Development Guide

## Project Overview
A comprehensive, locally-runnable framework for Bill of Materials (BOM) translation and management. Built with Next.js 15, TypeScript, React 19, Prisma ORM, and Electron for desktop distribution.

## Commands
```bash
npm run dev              # Start development server (port 3002)
npm run dev:clean        # Clear port conflicts and start dev server
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint
npm run test-local       # Run single test: node scripts/test-local.js
npm run test-db-*        # Database tests: test-db-transfer, test-db-archives
npm run db:push          # Apply Prisma schema changes
npm run db:generate      # Generate Prisma client (REQUIRED after schema changes)
npm run db:migrate       # Create and apply migrations
npm run db:reset         # Reset database
npm run db:reimport      # Reimport database from backup
npm run kill-port        # Clear port 3002 conflicts
npm run electron-dev     # Desktop app with hot reload
npm run electron-local   # Desktop production build
npm run electron-pack    # Package for distribution (all platforms)
npm run electron-pack-win   # Package for Windows
npm run electron-pack-mac   # Package for macOS
npm run electron-pack-linux # Package for Linux
npm run build:server     # Build custom server
npm run dist             # Build and package (no publish)
npm run dist-all         # Build and package all platforms
```

## MCP Tools Available
- **context7**: Look up library documentation and API references
- **sequentialthinking**: Break down complex problems into steps
- **playwright**: Test web UI functionality and capture screenshots
- **memorybank**: Store and retrieve project-specific knowledge

## Code Style Guidelines

### Imports & Formatting
- Use `@/` prefix for src imports (configured in tsconfig.json)
- Group imports: React → third-party → local components → types → utils
- Use shadcn/ui components consistently with `cn()` utility for className merging

### TypeScript & Types
- All code fully typed - avoid `any` (ESLint rule disabled but prefer proper types)
- Use Prisma-generated types from `@prisma/client`
- Define interfaces in `/src/types/` for custom data structures
- Use `const { id } = await params` for Next.js 15 route params

### Naming Conventions
- Components: PascalCase (e.g., `EditableBOMTable`)
- Files: kebab-case for components (e.g., `editable-bom-table.tsx`)
- Variables/Functions: camelCase
- Constants: UPPER_SNAKE_CASE
- API routes: `[resource]/[id]/[action]/route.ts` pattern

### Error Handling
- API routes: try-catch with meaningful error messages and proper HTTP status codes
- Components: Graceful error boundaries, user-friendly error messages
- Database: Always handle Prisma errors, use transactions for multi-table operations
- Use `error instanceof Error ? error.message : 'Unknown error'` pattern

### State Management
- Use Zustand store (`/src/lib/store.ts`) for shared application state
- Local component state only for transient UI (e.g., `editingCell`)
- Implement optimistic updates: UI updates immediately, API calls in background
- Include loading states and error handling in all async operations

### Database Operations
- Always use Prisma ORM with `db` from `@/lib/db`
- After schema changes: `npm run db:push` then `npm run db:generate`
- Include `author` relation and `_count` for item counts in queries
- Location-based BOM: always include `locationId` for BOM items (unique constraint)
- SQLite database with comprehensive schema for Users, Projects, Locations, BOMItems

### Component Patterns
- Use `'use client'` directive for client components
- Follow atomic design: reusable components in `/src/components/ui/`
- Business logic components in `/src/components/`
- Implement proper loading states and responsive design with Tailwind CSS

### Critical Architecture Notes
- **Custom server**: use `npm run dev` (wraps `server.ts`), NOT `next dev`
- **Socket.IO endpoint**: `/api/socketio` (configured in `src/lib/socket.ts`)
- **Default user**: `demo@bom-framework.com` auto-created if none exists
- **Port**: Development server runs on port 3002 (not 3000)
- **Electron**: Use `npm run electron-dev` for development, `npm run electron-pack` for distribution
- **Path mapping**: `@/*` maps to `./src/*` in tsconfig.json

## Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (30+ endpoints)
│   ├── bom/               # BOM management pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components (40+ components)
│   └── *.tsx             # Business logic components
├── lib/                  # Core utilities
│   ├── db.ts             # Prisma client
│   ├── store.ts          # Zustand state management
│   ├── socket.ts         # Socket.IO setup
│   └── utils.ts          # Utility functions
├── types/                # TypeScript definitions
└── hooks/                # Custom React hooks
```

## API Endpoints
- **Projects**: `/api/projects` - CRUD operations for BOM projects
- **Items**: `/api/projects/[id]/items` - BOM item management
- **Locations**: `/api/projects/[id]/locations` - Location-based organization
- **Parts**: `/api/parts/*` - Part search, import, and management
- **Database**: `/api/database/*` - Archive, export, import operations
- **Settings**: `/api/settings` - Application configuration
- **Performance**: `/api/performance/*` - Monitoring and stats

## Database Schema
- **User**: Authentication and user management
- **BOMProject**: Project metadata and organization
- **Location**: Project location/assembly organization
- **BOMItem**: Individual bill of materials items
- **BOMExport**: Export history and tracking
- **UserSettings**: User preferences and configuration

## Technology Stack
- **Frontend**: Next.js 15, React 19, TypeScript 5, Tailwind CSS 4
- **UI Components**: shadcn/ui with Radix UI primitives
- **Database**: Prisma ORM with SQLite
- **State Management**: Zustand with devtools
- **Real-time**: Socket.IO for live updates
- **Desktop**: Electron for cross-platform distribution
- **Build Tools**: TypeScript, ESLint, PostCSS, tsx

## Development Workflow
1. **Setup**: `npm install` → `npm run db:push` → `npm run db:generate`
2. **Development**: `npm run dev` (web) or `npm run electron-dev` (desktop)
3. **Testing**: `npm run test-local` for setup verification
4. **Database**: Use Prisma Studio (`npm run db:studio`) for data management
5. **Distribution**: `npm run electron-pack` for packaged applications

## Key Features
- **Excel-like Interface**: In-line editing with keyboard navigation
- **Import/Export**: CSV, JSON, and XML format support
- **Search & Filter**: Advanced part search and filtering
- **Bulk Operations**: Multi-select and batch modifications
- **Archive System**: Database backup and restore functionality
- **Real-time Updates**: Socket.IO powered live updates
- **Responsive Design**: Mobile-friendly interface
- **Type Safety**: Full TypeScript implementation