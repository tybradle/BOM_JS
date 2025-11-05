# Development Workflow Guide

## Environment Setup

### Initial Setup
```bash
# Install dependencies
npm install

# Set up database
npm run db:push      # Apply schema changes
npm run db:generate  # Generate Prisma client

# Start development server
npm run dev          # Runs on port 3002
```

### Environment Variables
- Copy `.env.example` to `.env`
- Configure `DATABASE_URL` for SQLite
- Set any other required environment variables

## Database Operations

### Schema Changes
1. Modify `prisma/schema.prisma`
2. Run `npm run db:push` to apply changes
3. Run `npm run db:generate` to update client
4. Update TypeScript types in `/src/types/`

### Common Database Commands
```bash
npm run db:push      # Apply schema without migration
npm run db:migrate   # Run pending migrations
npm run db:reset     # Reset to clean state
npm run db:studio    # Open Prisma Studio
npm run db:generate  # Regenerate Prisma client
```

### Database Utilities
- Use `/src/lib/database/` utilities for common operations
- Follow archive patterns in `/src/lib/database/archive.ts`
- Implement validation with `/src/lib/database/validation.ts`

## Development Commands

### Running the Application
```bash
npm run dev          # Development server (port 3002)
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint checking
npm run type-check   # TypeScript checking
```

### Testing
```bash
# Use existing test scripts
npm run test:api     # Test API endpoints
npm run test:db      # Test database operations
npm run test:import  # Test import functionality
```

### Electron Development
```bash
npm run electron:dev # Development with Electron
npm run electron-pack # Build desktop application
```

## Code Development Patterns

### API Route Development
1. Create route in `/src/app/api/[resource]/route.ts`
2. Follow naming convention: `[resource]/[id]/[action]/route.ts`
3. Include proper error handling and validation
4. Update store actions to consume the API

### Component Development
1. Place business components in `/src/components/`
2. Use `/src/components/ui/` for reusable UI elements
3. Follow existing component patterns
4. Include proper TypeScript interfaces

### Store Development
1. Update `/src/lib/store.ts` for new state
2. Follow Zustand patterns for actions
3. Implement optimistic updates where appropriate
4. Include proper error handling

## File Organization

### Adding New Features
1. **API**: Create routes in `/src/app/api/`
2. **Components**: Add to `/src/components/`
3. **Types**: Update `/src/types/`
4. **Utilities**: Add to `/src/lib/`
5. **Hooks**: Add to `/src/hooks/`

### File Naming Conventions
- **Components**: PascalCase (e.g., `ComponentName.tsx`)
- **Utilities**: camelCase (e.g., `utilityFunction.ts`)
- **Types**: camelCase with descriptive names (e.g., `databaseTypes.ts`)
- **API Routes**: `route.ts` in appropriate directory structure

## Quality Assurance

### Code Review Checklist
- [ ] TypeScript types are properly defined
- [ ] Error handling is implemented
- [ ] API responses follow standard patterns
- [ ] Components use shadcn/ui consistently
- [ ] Database operations use Prisma
- [ ] Loading states are implemented
- [ ] Responsive design is considered

### Testing Strategy
- Test API endpoints manually before UI integration
- Validate database operations with test data
- Check error handling paths
- Verify import/export functionality
- Test with different file formats

## Performance Considerations

### Database Optimization
- Use appropriate indexes (defined in schema.prisma)
- Implement pagination for large datasets
- Use efficient query patterns with Prisma
- Cache frequently accessed data

### Frontend Optimization
- Implement virtual scrolling for large tables
- Use React.memo for expensive components
- Debounce search and filter operations
- Lazy load non-critical components

## Troubleshooting

### Common Issues
1. **Port Conflicts**: Application runs on port 3002
   - Use `npm run kill-port` to clear stuck processes
2. **Database Connection**: Check `DATABASE_URL` in `.env`
3. **Build Issues**: Clear Next.js cache with `rm -rf .next`
4. **TypeScript Errors**: Regenerate Prisma client

### Debug Commands
```bash
# Check database connection
npm run db:studio

# Clear caches
rm -rf .next
npm run db:generate

# Check for port conflicts
netstat -ano | findstr :3002
```

## Deployment

### Production Build
```bash
npm run build        # Production build
npm run start        # Start production server
```

### Electron Packaging
```bash
npm run electron-pack # Build desktop application
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Configure production database URL
- Set up proper logging configuration