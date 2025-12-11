# AutoCAD BOM Extractor - Setup Guide

## Overview

The AutoCAD BOM Extractor is a standalone feature that uses AI-powered OCR to extract Bill of Materials data from AutoCAD PDF drawings. It leverages Ollama with the Qwen2-VL vision model for accurate table extraction.

## Prerequisites

### 1. Ollama Installation

**Windows:**
```powershell
# Download and install from https://ollama.ai
# Or use winget
winget install Ollama.Ollama
```

**Verify Installation:**
```bash
ollama --version
```

### 2. Install Qwen2-VL Model

```bash
ollama pull qwen2-vl:2b
```

**Note:** The 2B model is optimized for 4GB GPU. For better accuracy with more VRAM, use:
```bash
ollama pull qwen2-vl:7b
```

### 3. Start Ollama Service

```bash
ollama serve
```

Ollama will run on `http://localhost:11434` by default.

## Feature Architecture

### Standalone Design
- **No database integration** - All processing is stateless
- **Direct workflow** - Upload → Process → Export
- **Self-contained** - All code in `/autocad-extractor/` directory

### File Structure
```
src/
├── app/
│   └── autocad-extractor/
│       ├── page.tsx                    # Main UI
│       └── api/
│           ├── upload/route.ts         # PDF upload
│           ├── process/route.ts        # OCR processing
│           └── export/route.ts         # Excel export
├── components/
│   └── autocad-extractor/
│       ├── FileUploader.tsx            # File selection
│       ├── ProcessingStatus.tsx        # Progress indicator
│       ├── ResultsTable.tsx            # Results display
│       └── ExportButton.tsx            # Excel download
└── lib/
    └── autocad-extractor/
        ├── types.ts                    # TypeScript types
        ├── ollama-client.ts            # Ollama integration
        ├── pdf-processor.ts            # PDF handling
        ├── ocr-engine.ts               # OCR logic
        └── excel-generator.ts          # Excel generation
```

## Usage Workflow

### 1. Access Feature
- Navigate to landing page
- Click "AutoCAD BOM Extractor" card
- Or go directly to `/autocad-extractor`

### 2. Upload PDF
- Drag and drop PDF file
- Or click to browse and select
- Supports AutoCAD BOM drawings

### 3. Processing
- PDF converts to image
- Ollama extracts table data
- Confidence scores calculated
- Low-confidence items flagged

### 4. Review Results
- View extracted items in table
- Check confidence scores
- Review flagged items
- Verify accuracy

### 5. Export to Excel
- Click "Export to Excel"
- Downloads formatted spreadsheet
- Includes confidence scores
- Flagged items highlighted

## Configuration

### Environment Variables

Create `.env.local` (optional):
```env
OLLAMA_HOST=http://localhost:11434
```

### Model Selection

Edit `src/lib/autocad-extractor/ollama-client.ts`:
```typescript
const MODEL_NAME = 'qwen2-vl:2b'  // Change to 7b for better accuracy
```

### Confidence Threshold

Edit `src/lib/autocad-extractor/ocr-engine.ts`:
```typescript
const CONFIDENCE_THRESHOLD = 0.8  // Adjust threshold (0-1)
```

## Troubleshooting

### Ollama Not Available
**Error:** "Ollama not available"

**Solution:**
1. Check Ollama is running: `ollama list`
2. Verify model installed: `ollama list | grep qwen2-vl`
3. Start service: `ollama serve`

### Low Extraction Accuracy
**Issue:** Many items flagged for review

**Solutions:**
1. Use higher quality PDF (300+ DPI)
2. Upgrade to 7B model for better accuracy
3. Adjust confidence threshold
4. Refine prompt in `ollama-client.ts`

### Processing Timeout
**Issue:** Processing takes too long

**Solutions:**
1. Reduce PDF file size
2. Use 2B model instead of 7B
3. Process single-page PDFs
4. Increase GPU memory allocation

### Excel Export Fails
**Issue:** Export button doesn't work

**Solutions:**
1. Check browser console for errors
2. Verify items were extracted
3. Check file permissions
4. Try different browser

## Performance Optimization

### GPU Memory (4GB)
- Use `qwen2-vl:2b` model
- Process one page at a time
- Close other GPU applications

### Processing Speed
- Average: 30-60 seconds per page
- Depends on: PDF complexity, GPU, model size

### Accuracy vs Speed
- **2B model**: Faster, good accuracy (~85%)
- **7B model**: Slower, better accuracy (~95%)

## Future Enhancements

### Planned Features
- [ ] Multi-page PDF support
- [ ] Batch processing (multiple files)
- [ ] Custom field mapping
- [ ] Training data collection
- [ ] Model fine-tuning
- [ ] Real-time preview
- [ ] Edit extracted data before export

### Integration Options
- [ ] Save to BOM database (optional)
- [ ] Direct import to BOM projects
- [ ] API endpoint for automation

## Support

### Common Issues
See troubleshooting section above.

### Model Documentation
- Qwen2-VL: https://ollama.ai/library/qwen2-vl
- Ollama: https://ollama.ai/docs

### Feature Requests
Submit via project repository issues.

## Technical Details

### Dependencies
```json
{
  "pdf-lib": "^1.17.1",
  "pdf-parse": "^1.1.1",
  "canvas": "^2.11.2",
  "ollama": "^0.5.0",
  "exceljs": "^4.4.0"
}
```

### API Endpoints
- `POST /api/autocad-extractor/upload` - Upload PDF
- `POST /api/autocad-extractor/process` - Process with OCR
- `POST /api/autocad-extractor/export` - Export to Excel

### Data Flow
```
PDF Upload → Validation → Image Conversion → 
Ollama Inference → JSON Parsing → Confidence Scoring → 
Results Display → Excel Generation → Download
```
