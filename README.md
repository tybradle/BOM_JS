# BOM Management Framework

A comprehensive, locally-runnable framework for Bill of Materials (BOM) translation and management. This framework is designed to help designers build BOMs outside of the Eplan design cycle and generate XML outputs compatible with PLM systems.

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

6. Open [http://localhost:3002](http://localhost:3002) in your browser

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
- `npm run electron` - Run Electron app
- `npm run electron-dev` - Run Electron with development server
- `npm run electron-pack` - Build Electron package
- `npm run electron-pack-win` - Build Windows package
- `npm run electron-pack-mac` - Build macOS package
- `npm run electron-pack-linux` - Build Linux package

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

#### Setting Up for First Time
```bash
# 1. Install dependencies
npm install

# 2. Set up database
npm run db:push
npm run db:generate

# 3. (Optional) Seed with sample data
npx tsx scripts/seed-parts.ts

# 4. Start development server
npm run dev
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

## Production Deployment

### Building for Production
```bash
npm run build
npm run start
```

### Docker Deployment
The application can be containerized for easy deployment. The SQLite database makes it portable and self-contained.

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