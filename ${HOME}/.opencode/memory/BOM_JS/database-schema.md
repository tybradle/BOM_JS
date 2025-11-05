# Database Schema Documentation

## Core Models

### User
- **Purpose**: User authentication and management
- **Key Fields**: id, email, name, createdAt, updatedAt
- **Relationships**: One-to-many with BOMProject

### BOMProject
- **Purpose**: Project metadata and configuration
- **Key Fields**: id, name, description, status, userId, metadata (JSON)
- **Relationships**: 
  - Many-to-one with User
  - One-to-many with Location and BOMExport

### Location
- **Purpose**: Physical/logical locations within projects
- **Key Fields**: id, name, description, projectId
- **Relationships**: 
  - Many-to-one with BOMProject
  - One-to-many with BOMItem

### BOMItem
- **Purpose**: Individual BOM components with specifications
- **Key Fields**: id, partNumber, description, quantity, unitPrice, locationId
- **Relationships**: 
  - Many-to-one with Location
  - Many-to-one with MasterPart (optional)

### MasterPart
- **Purpose**: Centralized parts database
- **Key Fields**: id, partNumber, description, category, supplier
- **Relationships**: One-to-many with BOMItem

### BOMExport
- **Purpose**: Export history and tracking
- **Key Fields**: id, projectId, format, filePath, createdAt
- **Relationships**: Many-to-one with BOMProject

### UserSettings
- **Purpose**: Personalized application preferences
- **Key Fields**: id, userId, settings (JSON)
- **Relationships**: One-to-one with User

## Enums
- **ProjectStatus**: ACTIVE, COMPLETED, ARCHIVED
- **ItemStatus**: ACTIVE, OBSOLETE, PENDING
- **ExportFormat**: CSV, JSON, XML, EXCEL

## Key Indexes
- User.email (unique)
- BOMProject.userId
- Location.projectId
- BOMItem.locationId
- BOMItem.partNumber
- MasterPart.partNumber (unique)

## Database Operations
- Use Prisma ORM for all operations
- Implement transactions for multi-table operations
- Include proper error handling
- Use validation from `/src/lib/database/validation.ts`