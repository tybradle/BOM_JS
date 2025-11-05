# API Endpoints Documentation

## Core API Routes

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get specific project
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### Project Items
- `GET /api/projects/[id]/items` - Get project BOM items
- `POST /api/projects/[id]/items` - Create BOM item
- `PUT /api/projects/[id]/items/[itemId]` - Update BOM item
- `DELETE /api/projects/[id]/items/[itemId]` - Delete BOM item

### Locations
- `GET /api/locations` - List all locations
- `GET /api/locations/[locationId]` - Get specific location
- `GET /api/locations/[locationId]/part-numbers` - Get parts at location
- `POST /api/locations/[locationId]/part-numbers` - Add part to location

### Parts Management
- `GET /api/parts/search` - Search parts database
- `POST /api/parts/batch-create` - Create multiple parts
- `GET /api/parts/check-missing` - Check for missing parts
- `POST /api/parts/import` - Import parts from file

### Import/Export
- `POST /api/import` - Import data from file
- `GET /api/projects/[id]/export` - Export project data
- `GET /api/projects/[id]/export/[format]` - Export in specific format

### Database Management
- `POST /api/database/archive` - Create database archive
- `GET /api/database/archives` - List available archives
- `POST /api/database/import` - Import database from archive
- `POST /api/database/studio` - Database studio operations

### Settings
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings

### Health & Performance
- `GET /api/health` - Application health check
- `GET /api/performance/stats` - Performance statistics

### Users
- `GET /api/users` - List users
- `POST /api/users` - Create user

## API Response Patterns

### Success Response
```json
{
  "data": {...},
  "success": true,
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "error": "Error description",
  "success": false,
  "code": "ERROR_CODE"
}
```

### Validation Error
```json
{
  "error": "Validation failed",
  "success": false,
  "validationErrors": [
    {
      "field": "fieldName",
      "message": "Error message"
    }
  ]
}
```

## Standard HTTP Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## File Upload Patterns
- Use `multipart/form-data` for file uploads
- Validate file types and sizes
- Return upload progress for large files
- Clean up temporary files after processing