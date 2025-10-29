# BOM Management Framework - AI Coding Agent Instructions

## Project Overview
This is a **locally-runnable, Electron-packaged** Bill of Materials (BOM) management system for industrial automation design. The application translates BOMs into PLM-compatible XML (specifically Eplan format) and runs entirely offline with SQLite persistence.

**Dual Runtime Environment:** The app runs both as a Next.js web app (dev) and packaged Electron desktop app (production). The custom server (`server.ts`) integrates Next.js with Socket.IO for real-time features.

## Critical Architecture Patterns

### Custom Server Architecture
- **DO NOT use `npm run dev` directly** - use `npm run dev` which wraps the custom `server.ts` via nodemon
- `server.ts` creates an HTTP server that handles both Next.js requests AND Socket.IO connections
- Socket.IO endpoint: `/api/socketio` (setup in `src/lib/socket.ts`)
- Production uses `tsx server.ts` to run the compiled Next.js standalone server

### Database & ORM
- **SQLite with Prisma** - database file at `db/custom.db`
- After schema changes: `npm run db:push` then `npm run db:generate`
- **Location-based BOM organization**: Projects contain Locations (tabs), Locations contain BOMItems
- Unique constraint: `[projectId, locationId, partNumber]` - part numbers unique per location, not globally
- Default user is auto-created as `demo@bom-framework.com` if none exists (see `src/app/api/projects/route.ts`)

### State Management Strategy
- **Zustand store** (`src/lib/store.ts`) is the single source of truth for UI state
- Pattern: API route handlers return data → Zustand actions fetch and update store → Components read from store
- DO NOT duplicate state between React state and Zustand - always use Zustand for shared/persistent data
- Local component state (like `editingCell`) is fine for transient UI-only state

### Location Tabs Pattern
The BOM uses a location-based workflow:
1. Projects have multiple Locations (e.g., "Panel 1", "Field Devices")
2. Each Location has its own BOM items
3. UI shows location tabs - selecting a location filters items
4. When creating items, ALWAYS include `locationId` in the request body
5. Location auto-selection: First location auto-selected on load if none selected (see `fetchLocations` in store)

## Development Workflows

### Running the Application
```bash
# Development (hot reload via nodemon)
npm run dev

# Production build and run
npm run build
npm run start

# Electron development (runs Next.js + Electron)
npm run electron-dev

# Package for distribution
npm run electron-pack      # Current platform
npm run dist-all           # All platforms
```

### Database Workflows
```bash
# After modifying prisma/schema.prisma
npm run db:push            # Apply schema changes
npm run db:generate        # Regenerate Prisma Client (REQUIRED after schema changes)

# Reset database (development only)
npm run db:reset
```

### Adding New API Routes
Pattern example from `src/app/api/projects/route.ts`:
1. Use `db` from `@/lib/db` (singleton Prisma client)
2. Always include `author` relation and `_count` for item counts
3. Handle default user creation if `authorId` missing
4. Return detailed error messages with appropriate status codes
5. Export format should be tracked in `BOMExport` table

### Editable Table Pattern
The main BOM editing UI (`src/components/editable-bom-table.tsx`) implements Excel-like editing:
- Click cell → inline editing with Input/Select components
- Enter saves, Escape cancels
- Update calls `onItemUpdate` which triggers Zustand `updateBOMItem` → API PATCH → optimistic UI update
- Multi-select with checkboxes for bulk operations
- Column sorting stored in local component state (not persisted)

## Export System

### Eplan XML Format (Primary Use Case)
See `src/app/api/projects/[id]/export/route.ts` for XML generation. The XML structure follows Eplan PLM requirements:
- Root `<EPLAN>` element with version and namespace
- Project properties (name, description, version, timestamps)
- Parts array with indexed Part elements
- Required fields: PartNumber, Description, Quantity, Unit
- Optional: Manufacturer, Supplier, Category, Status

When adding export formats, create generator functions like `generateEplanXML()` and store exports in `BOMExport` table.

## TypeScript Conventions

### Path Aliases
- Use `@/` for `src/` directory (configured in `tsconfig.json`)
- Example: `import { db } from '@/lib/db'`

### Type Safety Patterns
- Prisma generates types automatically - import from `@prisma/client`
- Zustand store has explicit interfaces (see `BOMItem`, `BOMProject`, `Location` interfaces)
- API route params are async: `const { id } = await params` (Next.js 15 pattern)
- Avoid `any` - TypeScript strict mode enabled but `noImplicitAny: false` for pragmatism

## Common Pitfalls

1. **Forgetting `locationId`**: When creating BOM items, locationId is REQUIRED (unique constraint includes it)
2. **Not regenerating Prisma Client**: After schema changes, must run `npm run db:generate` or imports fail
3. **Direct Next.js server usage**: Don't use `next start` - use `npm run start` (runs custom server.ts)
4. **Socket.IO path mismatch**: Always use `/api/socketio` path - configured in both server and client
5. **Electron file paths**: In production Electron build, use `path.join(__dirname, ...)` for resource paths
6. **TypeScript build errors ignored**: `next.config.ts` has `ignoreBuildErrors: true` - fix types but don't let build errors block you

## Key Files Reference

- `server.ts` - Custom server integrating Next.js + Socket.IO
- `prisma/schema.prisma` - Database schema (Location-based BOM structure)
- `src/lib/store.ts` - Zustand state management (all API actions)
- `src/lib/db.ts` - Prisma client singleton
- `src/components/editable-bom-table.tsx` - Excel-like BOM editing UI
- `src/app/api/projects/[id]/export/route.ts` - Eplan XML generation
- `public/electron.js` - Electron main process (spawns server in production)

## Testing & Debugging

- Development logs written to `dev.log` and `server.log` (via `tee` in scripts)
- Prisma query logging enabled in development (see `src/lib/db.ts`)
- Electron DevTools available in development via `npm run electron-dev`
- WebSocket debugging: Open `/examples/websocket/page.tsx` for Socket.IO echo test

## Project-Specific Terminology

- **Package**: A BOM project (packageName + projectNumber form project identity)
- **Location**: Physical or logical grouping within a project (e.g., control panel, field devices)
- **Part Number**: The unique identifier for a BOM item within a location
- **Eplan XML**: The target export format for PLM system integration
- **Item Status**: ACTIVE, OBSOLETE, PENDING, DISCONTINUED (enum in schema)
- **Project Status**: DRAFT, ACTIVE, COMPLETED, ARCHIVED (enum in schema)
