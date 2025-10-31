/**
 * Upload Master Parts Database to Local Server
 * 
 * This script uploads parts.xml to the import API and displays progress.
 * Use this for testing the full HTTP import workflow without curl/PowerShell.
 * 
 * Usage:
 *   npx tsx scripts/upload-parts-database.ts
 *   npx tsx scripts/upload-parts-database.ts "path/to/parts.xml"
 */

import fs from 'fs'
import path from 'path'
import FormData from 'form-data'
import axios from 'axios'

const DEFAULT_FILE_PATH = path.join(__dirname, '..', 'Samples', 'Import Sample', 'parts.xml')
const API_URL = 'http://127.0.0.1:3002/api/parts/import'

async function uploadPartsDatabase(filePath: string) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Master Parts Database Upload')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log()

  // Validate file exists
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: File not found: ${filePath}`)
    console.log()
    console.log('Please provide a valid file path:')
    console.log('  npx tsx scripts/upload-parts-database.ts "path/to/parts.xml"')
    console.log()
    process.exit(1)
  }

  const stats = fs.statSync(filePath)
  const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2)

  console.log(`📁 File: ${path.basename(filePath)}`)
  console.log(`📊 Size: ${fileSizeMB} MB`)
  console.log(`📍 Path: ${filePath}`)
  console.log(`🌐 Target: ${API_URL}`)
  console.log()

  // Note: Skipping health check to avoid fetch dependencies
  // Assumes dev server is running on port 3002
  console.log('📡 Attempting connection to dev server...')
  console.log()
  console.log('📤 Uploading file...')
  const uploadStartTime = Date.now()

  try {
    // Create form data with file
    const form = new FormData()
    const fileStream = fs.createReadStream(filePath)
    form.append('file', fileStream, {
      filename: path.basename(filePath),
      contentType: 'application/xml'
    })

    // Upload to API using axios
    const response = await axios.post(API_URL, form, {
      headers: {
        ...form.getHeaders()
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 300000 // 5 minute timeout for large files
    })

    const uploadDuration = ((Date.now() - uploadStartTime) / 1000).toFixed(2)
    const result = response.data

    console.log('✅ Upload complete!')
    console.log()
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Import Summary')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log()
    
    if (result.summary) {
      const { totalParsed, imported, updated, errors, duration } = result.summary
      
      console.log(`📊 Total Parsed:  ${totalParsed.toLocaleString()}`)
      console.log(`✨ New Records:   ${imported.toLocaleString()}`)
      console.log(`🔄 Updated:       ${updated.toLocaleString()}`)
      console.log(`❌ Errors:        ${errors}`)
      console.log(`⏱️  Duration:      ${duration || uploadDuration + 's'}`)
      console.log()
      
      const successRate = ((totalParsed - errors) / totalParsed * 100).toFixed(1)
      console.log(`✅ Success Rate:  ${successRate}%`)
      
      if (errors > 0) {
        console.log()
        console.log(`⚠️  ${errors} parts skipped due to missing required fields`)
        console.log('   Check server logs for details')
      }
    } else {
      console.log(JSON.stringify(result, null, 2))
    }

    console.log()
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log()
    console.log('💡 Next Steps:')
    console.log('   1. Verify records: npx prisma studio')
    console.log('   2. Test search: npx tsx scripts/test-search-api.ts')
    console.log('   3. Use part catalog in BOM UI')
    console.log()

  } catch (error) {
    console.error('❌ Upload failed!')
    console.error()
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error(`Server responded with ${error.response.status}: ${error.response.statusText}`)
        console.error('Response data:', error.response.data)
      } else if (error.request) {
        console.error('No response from server. Is the dev server running?')
        console.error('Request was made but no response received')
      } else {
        console.error('Error:', error.message)
      }
    } else {
      console.error(error instanceof Error ? error.message : String(error))
    }
    
    console.log()
    console.log('Troubleshooting:')
    console.log('  • Ensure dev server is running: npm run dev')
    console.log('  • Check file path is correct')
    console.log('  • Verify enough disk space for database')
    console.log('  • Check server logs for detailed errors')
    console.log()
    process.exit(1)
  }
}

// Main execution
const customFilePath = process.argv[2]
const filePath = customFilePath || DEFAULT_FILE_PATH

uploadPartsDatabase(filePath).catch(error => {
  console.error('Unexpected error:', error)
  process.exit(1)
})
