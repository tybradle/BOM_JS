# Glenair Catalog Data Files

This directory contains Glenair Series 80 connector catalog data in both split and legacy formats.

## Split Files (Preferred - More Efficient)

The catalog is split into 4 category-specific files for easier debugging and maintenance:

### Data Files
- **`arrangements.json`** - Contact arrangement tables (2 tables, ~51KB)
  - Shell types and contact configurations
  - Pages: 39
  
- **`phm.json`** - PHM sizing table (1 table, ~2.4KB)
  - Potting Hub Module sizing for shell size to PHM size mapping
  - Pages: 172
  
- **`pins.json`** - Pin contact specifications (2 tables, ~25KB)
  - Pin contact specs with wire size compatibility
  - Pages: 289-290
  
- **`sockets.json`** - Socket contact specifications (2 tables, ~24KB)
  - Socket contact specs with wire size compatibility
  - Pages: 291-292

### Metadata Files
Each category has a corresponding metadata file:
- `arrangements-metadata.json`
- `phm-metadata.json`
- `pins-metadata.json`
- `sockets-metadata.json`

## Legacy Files (Backward Compatibility)

- **`default-catalog.json`** - Combined catalog file (deprecated, kept for backward compatibility)
- **`metadata.json`** - Legacy metadata file

## Usage

The seed route (`/api/glenair/seed`) automatically:
1. Tries to load from split files first (more efficient)
2. Falls back to legacy combined file if split files don't exist
3. Combines all split files into a single catalog for database seeding

## Regenerating Files

To regenerate all files from source data:

```bash
node scripts/transform-glenair-catalog.js
```

This will create both split files and legacy files.

## File Structure

Each data file follows this structure:
```json
{
  "tables": [
    {
      "page": 39,
      "headers": ["Column1", "Column2", ...],
      "data": [
        { "Column1": "value", "Column2": "value", ... }
      ],
      "type": "Contact Arrangements"
    }
  ]
}
```

Each metadata file follows this structure:
```json
{
  "name": "Glenair Series 80 - Category Name",
  "category": "category_code",
  "version": "2024.1",
  "description": "Description of the category",
  "source": "Glenair Extractor - all_validated_tables.json",
  "pages": [page_numbers],
  "transformedAt": "ISO timestamp",
  "tableCount": number,
  "format": "bom-js-v1"
}
```
