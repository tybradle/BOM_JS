# Dependency Cleanup - January 5, 2025

## Removed Dependencies

### Successfully Removed (Actually Unused):
1. **@dnd-kit/core** - Drag and drop functionality (not implemented)
2. **@dnd-kit/sortable** - Drag and drop sorting (not implemented)  
3. **@dnd-kit/utilities** - Drag and drop utilities (not implemented)
4. **@mdxeditor/editor** - MDX editor (no MDX content in project)
5. **@reactuses/core** - React hooks library (not used)
6. **@tanstack/react-query** - Server state management (not used, Zustand is used instead)
7. **@tanstack/react-table** - Table library (custom table implementation used)
8. **@hookform/resolvers** - Form validation resolvers (not used)
9. **next-auth** - Authentication (not implemented)
10. **@next-intl** - Internationalization (not implemented)
11. **react-markdown** - Markdown rendering (no markdown content)
12. **react-syntax-highlighter** - Code syntax highlighting (not used)

### Initially Removed But Restored (Actually Used):
13. **recharts** - Used in src/components/ui/chart.tsx for chart components
14. **embla-carousel-react** - Used in src/components/ui/carousel.tsx for carousel components
15. **vaul** - Used in src/components/ui/drawer.tsx for drawer components
16. **react-day-picker** - Used in src/components/ui/calendar.tsx for calendar components
17. **input-otp** - Used in src/components/ui/input-otp.tsx for OTP input components
18. **react-resizable-panels** - Used in src/components/ui/resizable.tsx for resizable panels
19. **lru-cache** - Used in src/lib/search-cache.ts for search caching functionality
20. **axios** - Used in deprecated scripts (xml-import/reimport-database.ts, upload-parts-database.ts)

## Impact

### Net Packages Removed: 12
### Node Modules Size Reduction: ~30-40MB
### Install Time Improvement: Moderate
### Security Surface: Reduced (fewer potential vulnerabilities)

## Remaining Dependencies Status

### Actually Used (Kept):
- **Core**: react, react-dom, next, typescript
- **Database**: @prisma/client, prisma (devDep)
- **UI Components**: All @radix-ui/* packages (actively used)
- **Styling**: tailwindcss, class-variance-authority, clsx, tailwind-merge
- **State Management**: zustand
- **File Processing**: csv-parse, xlsx, adm-zip, papaparse, sax
- **Utilities**: uuid, date-fns, sonner, cmdk, lucide-react
- **Real-time**: socket.io, socket.io-client
- **Image Processing**: sharp
- **Build Tools**: tsx (devDep)
- **UI Components**: recharts, embla-carousel-react, vaul, react-day-picker, input-otp, react-resizable-panels
- **Caching**: lru-cache
- **HTTP Client**: axios (deprecated scripts only)

### Potentially Unused (To Review Later):
- framer-motion - Animation library (minimal animations, could use CSS)
- electron-is-dev - Electron dev detection (only used in Electron files)

## Rationale

The removed dependencies were identified through comprehensive codebase analysis:
- Searched all TypeScript/JavaScript files for import statements
- Verified actual usage in source code vs UI component library
- Confirmed dependencies were adding bloat without functionality
- Prioritized removing large packages and those with security implications
- Restored dependencies that were actually being used in shadcn/ui components

## Lessons Learned

1. **shadcn/ui components** include many dependencies that aren't obvious from main application code
2. **UI component libraries** often have transitive dependencies that appear unused at first glance
3. **Comprehensive search** needed across all files including component libraries
4. **Deprecated scripts** may still use dependencies (axios in xml-import scripts)

## Next Steps

1. Monitor application functionality to ensure no regressions
2. Consider removing framer-motion if CSS animations suffice
3. Review electron-is-dev usage in Electron-specific builds
4. Consider removing axios if deprecated scripts are cleaned up
5. Regular dependency audits to prevent future bloat