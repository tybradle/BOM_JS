# BOM Management Framework - AI Coding Agent Instructions

## Project Overview

This is a **locally-runnable, Electron-packaged** Bill of Materials (BOM) management system for industrial automation design. The application translates BOMs into PLM-compatible XML (specifically Eplan format) and runs entirely offline with SQLite persistence.

**Dual Runtime Environment:** The app runs both as a Next.js web app (dev) and packaged Electron desktop app (production). The custom server (`server.ts`) integrates Next.js with Socket.IO for real-time features.

### Core Features
- **Location-based BOM organization**: Projects contain Locations (tabs), Locations contain BOMItems
- **Excel-like editing interface**: Inline cell editing with keyboard navigation
- **Multi-format import/export**: CSV, JSON, Excel, and Eplan XML
- **Master parts catalog**: Searchable database of parts with manufacturer information
- **Database management**: Export/import database archives, Prisma Studio integration
- **Settings management**: Comprehensive user preferences system
- **Offline-first**: All data stored locally in SQLite database

### Target Use Case
Industrial automation designers who need to build BOMs outside of Eplan design cycle and generate XML outputs compatible with PLM systems.

## Build and Test Commands

### Development Commands
```bash
# Development (hot reload via nodemon)
npm run dev

# Clean development (kills port 3002 first)
npm run dev:clean

# Production build and run
npm run build
npm run start

# Electron development (runs Next.js + Electron)
npm run electron-dev

# Package for distribution
npm run electron-pack      # Current platform
npm run dist-all           # All platforms (Windows, Mac, Linux)
```

### Database Commands
```bash
# After modifying prisma/schema.prisma
npm run db:push            # Apply schema changes
npm run db:generate        # Regenerate Prisma Client (REQUIRED after schema changes)

# Reset database (development only)
npm run db:reset

# Reimport database from backup
npm run db:reimport
```

### Testing Commands
```bash
# Phase 1 testing (database fields, export mapping, spare column, location grouping)
npx tsx scripts/test-phase1.ts

# Phase 2 testing (MasterPart model, part search API)
npx tsx scripts/test-phase2.ts

# Database transfer smoke test (round-trip export/import)
npm run test-db-transfer

# Database archive validation
npm run test-db-archives

# Search API testing
npx tsx scripts/test-search-api.ts
```

### Utility Commands
```bash
# Kill port 3002 (used by development server)
npm run kill-port

# Launch Prisma Studio (database GUI)
# Available via API endpoint: POST /api/database/studio

# Lint code
npm run lint
```

## Coding Style and Conventions

### TypeScript Configuration
- **Strict mode enabled** but `noImplicitAny: false` for pragmatism
- **Path aliases**: Use `@/` for `src/` directory (configured in `tsconfig.json`)
- **Type safety**: Avoid `any` type, use explicit interfaces and Prisma-generated types
- **Async route params**: `const { id } = await params` (Next.js 15 pattern)

### ESLint Configuration
The project uses a permissive ESLint configuration that prioritizes developer productivity:

**Disabled Rules:**
- `@typescript-eslint/no-explicit-any`: Allowed for flexibility
- `@typescript-eslint/no-unused-vars`: Disabled for development convenience
- `react-hooks/exhaustive-deps`: Disabled to avoid dependency array issues
- `prefer-const`: Disabled to allow `let` usage
- Various other rules disabled for pragmatic development

**Key Principle:** Build errors are ignored during development (`ignoreBuildErrors: true` in `next.config.ts`) but should be fixed before production.

### Component Patterns
- **Use shadcn/ui components**: All UI components should use the shadcn/ui library
- **Tailwind CSS**: Use utility classes with `cn()` helper for conditional classes
- **Server Components**: API routes and data fetching should be server-side
- **Client Components**: UI interactions and state management should be client-side (`'use client'`)
- **File naming**: Use kebab-case for component files (`editable-bom-table.tsx`)

### API Route Patterns
- **Error handling**: Return detailed error messages with appropriate status codes
- **Data relations**: Always include relevant relations (e.g., `author` relation for projects)
- **Count fields**: Include `_count` for item counts in list responses
- **Default user**: Handle default user creation if `authorId` missing
- **Export tracking**: Store exports in `BOMExport` table for audit trail

### State Management
- **Zustand store** (`src/lib/store.ts`) is the single source of truth for UI state
- **Pattern**: API route handlers return data → Zustand actions fetch and update store → Components read from store
- **DO NOT duplicate state** between React state and Zustand - always use Zustand for shared/persistent data
- **Local component state** (like `editingCell`) is fine for transient UI-only state

## Architecture

### Custom Server Architecture
- **Custom server**: `server.ts` integrates Next.js with Socket.IO
- **DO NOT use `npm run dev` directly** - use `npm run dev` which wraps the custom `server.ts` via nodemon
- **Socket.IO endpoint**: `/api/socketio` (setup in `src/lib/socket.ts`)
- **Production**: Uses `tsx server.ts` to run the compiled Next.js standalone server
- **Graceful shutdown**: Handles SIGTERM, SIGINT, and SIGBREAK signals

### Database & ORM
- **SQLite with Prisma**: Database file at `db/custom.db`
- **Location-based BOM organization**: Projects contain Locations, Locations contain BOMItems
- **Unique constraint**: `[projectId, locationId, partNumber]` - part numbers unique per location, not globally
- **Prisma Client**: Singleton pattern in `src/lib/db.ts` with query logging in development
- **Master Parts**: Separate `MasterPart` model for parts catalog with search capabilities

### Key Data Models
```prisma
model BOMProject {
  id            String        @id @default(cuid())
  projectNumber String        @unique
  packageName   String
  name          String?
  description   String?
  status        ProjectStatus @default(DRAFT)
  version       String        @default("1.0")
  authorId      String
  exports       BOMExport[]
  items         BOMItem[]     @relation("ProjectItems")
  author        User          @relation(fields: [authorId], references: [id])
  locations     Location[]
}

model Location {
  id         String      @id @default(cuid())
  name       String
  exportName String?
  order      Int         @default(0)
  projectId  String
  exports    BOMExport[] @relation("LocationExports")
  items      BOMItem[]
  project    BOMProject  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@unique([projectId, name])
}

model BOMItem {
  id                   String     @id @default(cuid())
  partNumber           String
  description          String
  secondaryDescription String?
  quantity             Float
  unit                 String
  unitPrice            Float?
  manufacturer         String?
  supplier             String?
  category             String?
  referenceDesignator  String?
  isSpare              Boolean    @default(false)
  status               ItemStatus @default(ACTIVE)
  order                Int        @default(0)
  projectId            String
  locationId           String
  location             Location   @relation(fields: [locationId], references: [id], onDelete: Cascade)
  project              BOMProject @relation("ProjectItems", fields: [projectId], references: [id], onDelete: Cascade)
  
  @@unique([projectId, locationId, partNumber])
}
```

### Location Tabs Pattern
The BOM uses a location-based workflow:
1. Projects have multiple Locations (e.g., "Panel 1", "Field Devices")
2. Each Location has its own BOM items
3. UI shows location tabs - selecting a location filters items
4. When creating items, ALWAYS include `locationId` in the request body
5. Location auto-selection: First location auto-selected on load if none selected

### Export System
**Eplan XML Format (Primary Use Case)**
- Root `<EPLAN>` element with version and namespace
- Project properties (name, description, version, timestamps)
- Parts array with indexed Part elements
- Required fields: PartNumber, Description, Quantity, Unit
- Optional: Manufacturer, Supplier, Category, Status
- **P_ARTICLE field mapping**:
  - `P_ARTICLE_MANUFACTURER` → `manufacturer`
  - `P_ARTICLE_DESCR1` → `description`
  - `P_ARTICLE_DESCR2` → `secondaryDescription`
  - `P_ARTICLE_ORDERNR` → `partNumber`
  - `P_ARTICLE_DEVTAG` → `referenceDesignator`
  - `P_ARTICLE_QUANTITY_IN_PROJECT_UNIT` → `quantity`
  - `P_ARTICLE_SALESPRICE_1` → `unitPrice`
  - `P_ARTICLE_SPARE` → `isSpare` (1 for true, 0 for false)

### Performance Optimizations
- **Search caching**: LRU cache for part search results (`src/lib/search-cache.ts`)
- **Performance monitoring**: Query timing and cache hit/miss tracking (`src/lib/performance-monitor.ts`)
- **Selective field projection**: API routes select only needed fields for better performance
- **Pagination**: Search results are paginated with `hasMore` flag

### Settings System
- **Hierarchical settings**: `AppSettings` interface with nested categories
- **Local storage**: Settings persisted in `localStorage` with `app-settings` key
- **Server sync**: Settings automatically synced to server with debounced updates
- **Default fallback**: `DEFAULT_SETTINGS` used when no user settings exist
- **Type safety**: Full TypeScript interfaces with validation functions

### Common Pitfalls

1. **Forgetting `locationId`**: When creating BOM items, locationId is REQUIRED (unique constraint includes it)
2. **Not regenerating Prisma Client**: After schema changes, must run `npm run db:generate` or imports fail
3. **Direct Next.js server usage**: Don't use `next start` - use `npm run start` (runs custom server.ts)
4. **Socket.IO path mismatch**: Always use `/api/socketio` path - configured in both server and client
5. **Electron file paths**: In production Electron build, use `path.join(__dirname, ...)` for resource paths
6. **TypeScript build errors ignored**: `next.config.ts` has `ignoreBuildErrors: true` - fix types but don't let build errors block you

### Key Files Reference

- `server.ts` - Custom server integrating Next.js + Socket.IO
- `prisma/schema.prisma` - Database schema (Location-based BOM structure)
- `src/lib/store.ts` - Zustand state management (all API actions)
- `src/lib/db.ts` - Prisma client singleton
- `src/components/editable-bom-table.tsx` - Excel-like BOM editing UI
- `src/app/api/projects/[id]/export/route.ts` - Eplan XML generation
- `public/electron.js` - Electron main process (spawns server in production)
- `src/types/settings.ts` - Settings type definitions and defaults
- `src/lib/theme.ts` - Theme management utilities

### Testing & Debugging

- **Development logs**: Written to `dev.log` and `server.log` (via `tee` in scripts)
- **Prisma query logging**: Enabled in development (see `src/lib/db.ts`)
- **Electron DevTools**: Available in development via `npm run electron-dev`
- **WebSocket debugging**: Open `/examples/websocket/page.tsx` for Socket.IO echo test
- **Database testing**: Use provided test scripts for comprehensive validation

### Project-Specific Terminology

- **Package**: A BOM project (packageName + projectNumber form project identity)
- **Location**: Physical or logical grouping within a project (e.g., control panel, field devices)
- **Part Number**: The unique identifier for a BOM item within a location
- **Eplan XML**: The target export format for PLM system integration
- **Item Status**: ACTIVE, OBSOLETE, PENDING, DISCONTINUED (enum in schema)
- **Project Status**: DRAFT, ACTIVE, COMPLETED, ARCHIVED (enum in schema)
- **Master Part**: Parts catalog entry that can be added to BOMs
- **Kitting Location**: Eplan XML element representing a Location in the BOM
