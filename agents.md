# BOM Management Framework - Agent Development Guide

## Commands
```bash
npm run dev              # Start development server (port 3002)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint
npm run test-local       # Run single test: node scripts/test-local.js
npm run test-db-*        # Database tests: test-db-transfer, test-db-archives
npm run db:push          # Apply Prisma schema changes
npm run db:generate      # Generate Prisma client (REQUIRED after schema changes)
npm run kill-port        # Clear port 3002 conflicts
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

### Component Patterns
- Use `'use client'` directive for client components
- Follow atomic design: reusable components in `/src/components/ui/`
- Business logic components in `/src/components/`
- Implement proper loading states and responsive design with Tailwind CSS

### Critical Architecture Notes
- Custom server: use `npm run dev` (wraps `server.ts`), NOT `next dev`
- Socket.IO endpoint: `/api/socketio` (configured in `src/lib/socket.ts`)
- Default user: `demo@bom-framework.com` auto-created if none exists
- Electron: Use `npm run electron-dev` for development, `npm run electron-pack` for distribution