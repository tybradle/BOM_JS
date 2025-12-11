# AutoCAD BOM Extractor - Library

## Quick Start

```typescript
import { extractBOMFromImage } from './ollama-client'
import { processImage } from './ocr-engine'
import { generateExcelWorkbook } from './excel-generator'

// Extract BOM from image
const result = await processImage(imageBase64, 1)

// Generate Excel
const buffer = await generateExcelWorkbook(result.items, 'BOM')
```

## Modules

### `types.ts`
TypeScript type definitions for the extractor.

### `ollama-client.ts`
Ollama API integration for LLM inference.

**Key Functions:**
- `extractBOMFromImage(imageBase64)` - Extract BOM data
- `checkOllamaAvailability()` - Check if Ollama is running
- `ensureModelAvailable()` - Pull model if needed

### `pdf-processor.ts`
PDF to image conversion utilities.

**Key Functions:**
- `convertPDFToImages(buffer)` - Convert PDF pages to images
- `getPDFPageCount(buffer)` - Get number of pages
- `validatePDF(buffer)` - Validate PDF file

### `ocr-engine.ts`
Core OCR processing logic.

**Key Functions:**
- `processImage(imageBase64, pageNumber)` - Process single image
- `mergeExtractionResults(results)` - Merge multi-page results
- `validateExtractionResults(items)` - Validate extraction

### `excel-generator.ts`
Excel workbook generation.

**Key Functions:**
- `generateExcelWorkbook(items, fileName)` - Single sheet
- `generateMultiSheetWorkbook(fileData)` - Multiple sheets

## Configuration

### Model Selection
```typescript
// In ollama-client.ts
const MODEL_NAME = 'qwen2-vl:2b' // or 'qwen2-vl:7b'
```

### Confidence Threshold
```typescript
// In ocr-engine.ts
const CONFIDENCE_THRESHOLD = 0.8 // 0-1 range
```

### Prompt Engineering
```typescript
// In ollama-client.ts - createPrompt()
// Customize extraction prompt for better accuracy
```

## Error Handling

All functions throw descriptive errors:
```typescript
try {
  const result = await processImage(image, 1)
} catch (error) {
  console.error('Processing failed:', error.message)
}
```

## Testing

```bash
# Ensure Ollama is running
ollama serve

# Check model availability
ollama list | grep qwen2-vl

# Test extraction
npm run dev
# Navigate to /autocad-extractor
```

## Performance

### Memory Usage
- 2B model: ~2-3GB GPU RAM
- 7B model: ~5-6GB GPU RAM

### Processing Time
- Single page: 30-60 seconds
- Depends on: PDF complexity, GPU, model size

## Best Practices

1. **Validate inputs** - Check PDF before processing
2. **Handle errors** - Wrap API calls in try-catch
3. **Show progress** - Use ProcessingStatus component
4. **Review results** - Always show confidence scores
5. **Flag low confidence** - Highlight items needing review
