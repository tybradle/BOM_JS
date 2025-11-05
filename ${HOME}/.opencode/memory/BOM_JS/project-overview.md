# BOM Management Framework - Project Overview

## Project Summary
The BOM Management Framework is a comprehensive, locally-deployable application designed for Bill of Materials (BOM) translation and management. Built with modern web technologies, it provides an Excel-like interface for managing BOM data with support for multiple export formats compatible with PLM systems.

## Technology Stack
- **Next.js 15** with App Router - Full-stack React framework
- **TypeScript 5** - Type-safe development
- **React 19** - UI components with latest features
- **Prisma ORM** - Type-safe database access
- **SQLite** - Local file-based database
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Zustand** - Lightweight state management
- **Electron** - Desktop application wrapper

## Key Features
1. **Excel-like Table Editing** - Inline editing with validation
2. **Import/Export System** - Multi-format support (CSV, JSON, XML, Excel)
3. **Project Management** - Hierarchical organization (Projects → Locations → Items)
4. **Database Management** - Automated backups, archive system, integrity checks
5. **Real-time Communication** - Socket.IO integration
6. **Desktop Application** - Electron wrapper for native deployment

## Architecture
- **Layered Architecture** - Presentation → Business Logic → Data Access → Storage
- **Component Architecture** - Atomic design with compound components
- **State Management** - Zustand store with optimistic updates
- **API Architecture** - RESTful design with standardized responses
- **Database Design** - Entity relationship model with proper indexing

## Development Environment
- **Port**: 3002 (default)
- **Database**: SQLite with Prisma ORM
- **Build**: Next.js production build
- **Testing**: Manual testing with validation scripts

## Project Structure
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
├── hooks/               # Custom React hooks
└── types/               # TypeScript definitions
```

## Current Status
- Framework is fully functional with core BOM management features
- Database schema is stable with proper relationships
- UI components are built with shadcn/ui design system
- Import/export functionality supports multiple formats
- Desktop application packaging is configured
- Documentation is comprehensive and up-to-date

## Development Guidelines
- Follow TypeScript best practices with full typing
- Use Prisma ORM for all database operations
- Implement proper error handling with meaningful messages
- Use shadcn/ui components consistently
- Follow established API response patterns
- Maintain code quality with incremental development