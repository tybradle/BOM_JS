# BOM Management Framework

A comprehensive, locally-runnable framework for Bill of Materials (BOM) translation and management. This framework is designed to help designers build BOMs outside of the Eplan design cycle and generate XML outputs compatible with PLM systems.

## 🚀 Quick Start

```bash
# 1. Install and setup
npm install
npm run db:push

# 2. Choose your testing method:
npm run dev              # Web browser (fastest)
npm run electron-dev       # Desktop with hot reload  
npm run electron-local     # Desktop production build
npm run test-local         # Check setup

# 3. For distribution:
npm run electron-pack
```

**Key Difference**: `electron-dev` wraps localhost, `electron-local` tests true desktop app.

## Features

### Core Functionality
- **Project Management**: Create and manage multiple BOM projects
- **Item Management**: Add, edit, delete, and duplicate BOM items
- **Excel-like Interface**: In-line editing with keyboard navigation
- **Import/Export**: Support for CSV, JSON, and XML formats
- **Search & Filter**: Advanced search and filtering capabilities
- **Bulk Operations**: Select and modify multiple items at once

### Technical Features
- **Local Database**: SQLite with Prisma ORM for data persistence
- **Modern UI**: Built with Next.js 15, TypeScript, and shadcn/ui components
- **Real-time Updates**: State management with Zustand
- **Responsive Design**: Mobile-friendly interface
- **Type Safety**: Full TypeScript implementation

## Technology Stack

### Core Framework
- **Next.js 15** with App Router
- **TypeScript 5** for type safety
- **React 19** for UI components

### Database & Storage
- **Prisma ORM** for database management
- **SQLite** for local data storage
- **JSON metadata** for flexible data storage

### UI & Styling
- **Tailwind CSS 4** for styling
- **shadcn/ui** component library
- **Lucide React** for icons
- **Framer Motion** for animations

### State Management
- **Zustand** for client-side state
- **React Query** for server state

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm package manager (yarn not recommended due to specific scripts)
- Git for version control
- Windows, macOS, or Linux operating system

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd BOM_JS
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment configuration:
   ```bash
   # For DEVELOPMENT:
   # Create .env file in project root with:
   DATABASE_URL="file:./db/custom.db"
   NODE_ENV="development"
   
   # For PRODUCTION (Electron packaging):
   # The DATABASE_URL will be automatically handled by the app
   # Database will be created at: %USERPROFILE%/BOM_SUITE/masterdb.db
   # No .env file needed in production build
   ```
   
   **IMPORTANT - Production vs Development Paths**:
   - **Development**: Database stored in project's `db/` folder (relative path)
   - **Production**: Database stored in user's home directory for write access
   - See [Production Deployment Guide](docs/PRODUCTION_DEPLOYMENT.md) for packaging instructions

4. Set up the database:
   ```bash
   # Push database schema to create initial database
   npm run db:push
   
   # Generate Prisma client for database access
   npm run db:generate
   
   # (Optional) Seed database with sample data
   npx tsx scripts/seed-parts.ts
   ```

5. Start the development server:
   ```bash
   # Standard development mode
   npm run dev
   
   # Or clean development mode (kills any existing process on port 3002 first)
   npm run dev:clean
   ```

6. Choose your testing method:

### Web Development (Browser)
```bash
npm run dev
```
Then open [http://localhost:3002](http://localhost:3002) in your browser

### Desktop Development (Electron)
```bash
# For development with hot reload
npm run electron-dev

# For testing local workspace build (recommended for testing desktop features)
npm run electron-local

# Quick setup check
npm run test-local
```

**Note**: The application runs on port 3002 by default (not 3000) to avoid conflicts with other applications.

### Troubleshooting Setup Issues

#### Port Already in Use
If you get "Port 3002 is already in use" error:
```bash
# Kill any process using port 3002
npm run kill-port

# Then restart development server
npm run dev
```

#### Database Issues
If you encounter database-related errors:
```bash
# Reset database completely (WARNING: This deletes all data)
npm run db:reset

# Then regenerate and setup again
npm run db:generate
npm run db:push
```

#### Dependency Issues
If you encounter dependency conflicts:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install
```

#### Electron Issues

**Electron window doesn't appear:**
```bash
# Check if build exists
npm run test-local

# If no build, create it first
npm run build
npm run electron-local
```

**Electron shows blank page:**
```bash
# Check console for errors
# In Electron: Press F12 to open DevTools

# Verify build completed successfully
npm run build

# Try development mode
npm run electron-dev
```

**Port conflicts in development mode:**
```bash
# Kill existing processes
npm run kill-port

# Use different port
PORT=3003 npm run electron-dev
```

**File access issues in production:**
```bash
# Check database permissions
# Database should be in user-writable location

# Test local workspace
npm run test-local

# Reset database if needed
npm run db:reset
```

## Usage

### Creating a Project
1. Click the "+" button in the Projects sidebar
2. Enter project name and description
3. Click "Create Project"

### Adding BOM Items
1. Select a project from the sidebar
2. Click "Add Item" button
3. Fill in the item details:
   - Part Number (required)
   - Description (required)
   - Quantity (required)
   - Unit (required)
   - Manufacturer (optional)
   - Supplier (optional)
   - Category (optional)

### Excel-like Editing
- **Click any cell** to start editing
- **Press Enter** to save changes
- **Press Escape** to cancel editing
- **Use column headers** to sort data
- **Select multiple items** for bulk operations

### Importing Data
1. Click "Import" button
2. Paste CSV data with headers:
   ```
   Part Number,Description,Quantity,Unit,Manufacturer,Supplier,Category
   PLC-001,Programmable Logic Controller,1,PCS,Siemens,Automation Supply Co.,Control
   ```
3. Click "Import Items"

### Exporting Data
1. Select export format from the Export dropdown:
   - **XML**: Eplan-compatible format for PLM integration
   - **JSON**: Structured data format
   - **CSV**: Spreadsheet-compatible format
2. File downloads automatically

## Database Schema

### Core Models
- **BOMProject**: Project information and metadata
- **BOMItem**: Individual BOM items with specifications
- **BOMExport**: Export history and records
- **User**: User management (extensible for authentication)
- **Supplier**: Supplier information database
- **Manufacturer**: Manufacturer information database
- **Category**: Hierarchical category system

### Key Features
- **Unique Constraints**: Part numbers are unique within projects
- **Indexing**: Optimized for common queries
- **Relations**: Proper foreign key relationships
- **Metadata**: JSON fields for flexible data storage

## API Endpoints

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project

### BOM Items
- `GET /api/projects/[id]/items` - Get project items
- `POST /api/projects/[id]/items` - Add new item
- `PATCH /api/bom-items/[id]` - Update item
- `DELETE /api/bom-items/[id]` - Delete item

### Import/Export
- `POST /api/projects/[id]/export` - Export project data
- `POST /api/import` - Import BOM data

### Users
- `GET /api/users` - List users
- `POST /api/users` - Create user

## Development

### Available Scripts

#### Core Development
- `npm run dev` - Start development server on port 3002
- `npm run dev:clean` - Kill port 3002 then start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

#### Database Management
- `npm run db:push` - Push schema changes to database
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:reset` - Reset database (WARNING: Deletes all data)
- `npm run db:reimport` - Reimport database from archive

#### Database Testing & Utilities
- `npm run test-db-transfer` - Test database export/import functionality
- `npm run test-db-archives` - Validate archive discovery and ordering

#### Electron Desktop App
- `npm run electron` - Run Electron app (uses default main process)
- `npm run electron-dev` - Run Electron with development server (localhost:3002)
- `npm run electron-local` - Build and run Electron from local files (no dev server)
- `npm run electron-pack` - Build Electron package
- `npm run electron-pack-win` - Build Windows package
- `npm run electron-pack-mac` - Build macOS package
- `npm run electron-pack-linux` - Build Linux package

##### Local Workspace Testing
- `npm run test-local` - Check local workspace setup and requirements

##### Port Management
- `npm run kill-port [port]` - Kill process on specified port (defaults to 3002)

### Development Server Details

The application uses a custom server configuration (`server.ts`) that:
- Runs on port 3002 by default (configurable via PORT environment variable)
- Integrates Socket.IO for real-time functionality
- Handles both Next.js requests and WebSocket connections
- Includes graceful shutdown handling

#### Custom Server Configuration
- **Host**: 127.0.0.1 (localhost only)
- **Default Port**: 3002 (customizable with `PORT` environment variable)
- **Socket.IO Path**: `/api/socketio`
- **Graceful Shutdown**: Handles SIGTERM, SIGINT, and Windows SIGBREAK signals

### Development Workflow

#### Understanding Electron vs Web Development

The framework supports both web browser and Electron desktop environments. Each has different use cases:

| Feature | Web (`npm run dev`) | Electron (`npm run electron-*`) |
|---------|---------------------|------------------------------|
| **Development Speed** | ⚡ Faster reload | 🐢 Slower startup |
| **Desktop Features** | ❌ No file access | ✅ Full file system |
| **Native Menus** | ❌ Browser menu | ✅ Custom menus |
| **Production Testing** | ❌ Not representative | ✅ True desktop experience |
| **Hot Reload** | ✅ Instant | ⚠️ Limited |
| **Debugging** | ✅ Browser DevTools | ✅ Electron DevTools |

#### Electron Testing Commands Explained

```bash
# Development Mode (Hot Reload + Dev Server)
npm run electron-dev
# → Starts dev server on localhost:3002
# → Wraps in Electron desktop window
# → Good for UI development with desktop context

# Local Workspace Mode (Production Build)
npm run electron-local  
# → Builds production version first
# → Runs from local files (no server)
# → Tests true desktop application
# → Best for testing file operations, menus, etc.

# Distribution Mode (Packaged App)
npm run electron-pack
# → Creates distributable desktop app
# → Tests final packaged version
# → Ready for deployment
```

#### Setting Up for First Time
```bash
# 1. Install dependencies
npm install

# 2. Set up database
npm run db:push
npm run db:generate

# 3. (Optional) Seed with sample data
npx tsx scripts/seed-parts.ts

# 4. Choose your development method:
#    - For web development: npm run dev
#    - For desktop development: npm run electron-dev
#    - For testing local build: npm run electron-local
```

#### Making Database Changes
```bash
# 1. Modify schema.prisma

# 2. Push changes to database
npm run db:push

# 3. Regenerate Prisma client
npm run db:generate
```

#### Testing Database Functionality
```bash
# Test export/import round-trip
npm run test-db-transfer

# Test archive functionality
npm run test-db-archives
```

### Project Structure
```
├── prisma/              # Database schema and migrations
│   └── schema.prisma    # Prisma database schema
├── scripts/             # Utility and testing scripts
│   ├── kill-port.js      # Port management utility
│   ├── seed-parts.ts    # Database seeding script
│   └── test-*.ts       # Various testing scripts
├── src/
│   ├── app/             # Next.js app router
│   │   ├── api/        # API routes
│   │   │   ├── database/    # Database management endpoints
│   │   │   ├── projects/    # Project CRUD operations
│   │   │   ├── import/      # Data import functionality
│   │   │   └── settings/   # Application settings
│   │   ├── bom/         # BOM management pages
│   │   │   └── [projectId]/ # Dynamic project routes
│   │   ├── page.tsx     # Landing page
│   │   └── layout.tsx   # Root layout with theme handling
│   ├── components/       # React components
│   │   ├── ui/          # shadcn/ui base components
│   │   ├── editable-bom-table.tsx    # Excel-like table component
│   │   ├── ImportPreviewDialog.tsx    # Import preview functionality
│   │   ├── ExportDialog.tsx           # Export functionality
│   │   ├── DatabaseToolsDialog.tsx    # Database management UI
│   │   └── SettingsDialog.tsx        # Application settings
│   ├── lib/             # Utilities and stores
│   │   ├── store.ts     # Zustand state management
│   │   ├── db.ts        # Prisma client configuration
│   │   ├── utils.ts     # Helper functions
│   │   └── theme.ts     # Theme management
│   ├── hooks/           # Custom React hooks
│   └── types/           # TypeScript type definitions
├── public/              # Static assets
├── server.ts           # Custom Next.js server with Socket.IO
└── db/                 # SQLite database files (created automatically)
```

## Configuration

### Environment Variables
Create a `.env` file with:
```
DATABASE_URL="file:./db/custom.db"
```

### Database Configuration
The framework uses SQLite by default for local development. The database file is located at `db/custom.db`.

- The landing page **Database Tools** dialog supports exporting zipped backups, importing archives (uploaded or previously exported), and launching Prisma Studio. See `docs/DATABASE_MANAGEMENT_DIALOG.md` for the complete workflow.
- Automated checks:
   - `npm run test-db-transfer` – round-trip export/import smoke test (requires `db/custom.db`).
   - `npm run test-db-archives` – validates archive discovery ordering and path guardrails.

## Testing and Deployment

### Testing Methods Comparison

#### 1. Web Browser Testing (`npm run dev`)
```bash
npm run dev
# Opens: http://localhost:3002 in browser
```
**Use Cases:**
- ✅ UI/UX development
- ✅ Component testing
- ✅ Quick iteration
- ✅ Code reviews
- ✅ Browser compatibility testing

**Limitations:**
- ❌ No file system access
- ❌ No desktop menus
- ❌ No native integrations

#### 2. Electron Development (`npm run electron-dev`)
```bash
npm run electron-dev
# Starts dev server + wraps in Electron
```
**Use Cases:**
- ✅ Desktop UI testing
- ✅ Menu integration testing
- ✅ Electron-specific features
- ✅ Development with hot reload

**Limitations:**
- ⚠️ Still uses localhost (not true production)
- ⚠️ Slower than web dev

#### 3. Local Workspace Testing (`npm run electron-local`)
```bash
npm run electron-local
# Builds + runs from local files
```
**Use Cases:**
- ✅ **True desktop application testing**
- ✅ File import/export testing
- ✅ Production environment simulation
- ✅ Performance testing
- ✅ End-to-end workflows

**Benefits:**
- 🎯 Tests actual desktop app
- 🎯 No localhost dependency
- 🎯 Production build optimization
- 🎯 File system access

#### 4. Packaged Testing (`npm run electron-pack`)
```bash
npm run electron-pack
# Creates distributable + runs it
```
**Use Cases:**
- ✅ Final deployment testing
- ✅ Distribution validation
- ✅ Cross-platform testing

### Recommended Testing Workflow

```bash
# 1. Quick development
npm run dev

# 2. Desktop feature development
npm run electron-dev

# 3. Production testing
npm run electron-local

# 4. Final validation
npm run electron-pack
```

### Quick Setup Validation
```bash
# Check everything is ready for testing
npm run test-local
```

## Production Deployment

### Desktop Application (Recommended)

The BOM Management Framework is optimized for distribution as a desktop application using Electron.

#### Quick Build
```bash
# Build and package for Windows
npm run electron-pack-win

# Build for all platforms
npm run dist-all
```

#### Build Process Details
```bash
# 1. Clean previous builds
Remove-Item -Recurse -Force dist, .next

# 2. Build Next.js application (standalone mode)
npm run build

# 3. Verify standalone build
npm run test-standalone

# 4. Package with Electron
npm run electron-pack-win
```

#### Output Structure
```
dist/
├── BOM Management Framework Setup 1.0.0.exe  # Installer (~150-200 MB)
└── win-unpacked/                              # Unpacked application
    └── BOM Management Framework.exe           # Main executable
```

#### Build Optimization
- **Standalone Mode**: Uses Next.js standalone output (85% size reduction)
- **Bundle Size**: ~77 MB (vs 500+ MB with full node_modules)
- **Startup Time**: ~333ms server startup
- **Production Ready**: Optimized for performance and size

### Installation
1. **Run Installer**: Double-click `BOM Management Framework Setup 1.0.0.exe`
2. **Choose Install Location**: Default is `C:\Program Files\BOM Management Framework`
3. **Create Shortcuts**: Desktop and Start Menu shortcuts created automatically
4. **Launch**: Click desktop shortcut or find in Start Menu

### System Requirements
- **OS**: Windows 10/11 (64-bit)
- **RAM**: 4 GB minimum, 8 GB recommended
- **Disk Space**: 500 MB for application + database
- **Display**: 1280x800 minimum resolution

### Web Server Deployment (Alternative)
For web-based deployment:
```bash
npm run build
npm run start
```

### Docker Deployment
The application can be containerized for easy deployment. The SQLite database makes it portable and self-contained.

### Distribution
See [PACKAGING_GUIDE.md](docs/PACKAGING_GUIDE.md) for detailed packaging and distribution instructions.

## Extending the Framework

### Adding New Features
1. **Database Models**: Add to `prisma/schema.prisma`
2. **API Endpoints**: Create in `src/app/api/`
3. **UI Components**: Add to `src/components/`
4. **State Management**: Extend in `src/lib/store.ts`

### Custom Export Formats
Add new export formats in `/api/projects/[id]/export/route.ts` by extending the `generate*` functions.

### Authentication Integration
The framework includes User models and can be extended with NextAuth.js for full authentication.

## License

This framework is designed for internal use and can be customized based on specific requirements.

## Support

For issues and feature requests, please refer to the project documentation or contact the development team.