/**
 * Re-import Master Parts Database with Clean Slate
 * 
 * This script:
 * 1. Backs up current database
 * 2. Deletes old database
 * 3. Recreates schema
 * 4. Imports parts.xml with progress bar
 * 
 * Usage: npx tsx scripts/reimport-database.ts
 */

import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import FormData from 'form-data'
import axios from 'axios'

const DB_PATH = path.join(__dirname, '..', 'db', 'custom.db')
const PARTS_FILE = path.join(__dirname, '..', 'Samples', 'Import Sample', 'parts.xml')
const API_URL = 'http://127.0.0.1:3002/api/parts/import'

// ANSI escape codes for terminal colors and cursor control
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
}

function printHeader(text: string) {
  console.log()
  console.log(colors.cyan + '='.repeat(60) + colors.reset)
  console.log(colors.cyan + text + colors.reset)
  console.log(colors.cyan + '='.repeat(60) + colors.reset)
  console.log()
}

function printStep(step: number, text: string) {
  console.log(colors.blue + `Step ${step}:` + colors.reset + ' ' + text)
}

function printSuccess(text: string) {
  console.log(colors.green + '✓ ' + text + colors.reset)
}

function printError(text: string) {
  console.log(colors.red + '✗ ' + text + colors.reset)
}

function printWarning(text: string) {
  console.log(colors.yellow + '⚠ ' + text + colors.reset)
}

function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { 
      shell: true,
      stdio: 'inherit'
    })
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Command failed with code ${code}`))
      }
    })
    
    proc.on('error', reject)
  })
}

function drawProgressBar(current: number, total: number, width: number = 40): string {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0
  const filled = Math.round((current / total) * width)
  const empty = width - filled
  
  const bar = colors.green + '█'.repeat(filled) + colors.gray + '░'.repeat(empty) + colors.reset
  const stats = `${current.toLocaleString()} / ${total.toLocaleString()} (${percentage}%)`
  
  return `[${bar}] ${stats}`
}

async function uploadWithProgress(filePath: string): Promise<void> {
  const fileStats = fs.statSync(filePath)
  const fileSizeMB = (fileStats.size / 1024 / 1024).toFixed(2)
  
  console.log()
  console.log(`File: ${path.basename(filePath)}`)
  console.log(`Size: ${fileSizeMB} MB`)
  console.log()
  
  // Create form data
  const form = new FormData()
  const fileStream = fs.createReadStream(filePath)
  form.append('file', fileStream, {
    filename: path.basename(filePath),
    contentType: 'application/xml'
  })
  
  let uploadProgress = 0
  
  // Show upload progress
  process.stdout.write('Uploading: ' + drawProgressBar(0, 100))
  
  const response = await axios.post(API_URL, form, {
    headers: {
      ...form.getHeaders()
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    timeout: 900000, // 15 minute timeout (allows for processing time)
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        uploadProgress = Math.round((progressEvent.loaded / progressEvent.total) * 100)
        process.stdout.write('\r' + 'Uploading: ' + drawProgressBar(uploadProgress, 100))
      }
    }
  })
  
  process.stdout.write('\n')
  printSuccess('Upload complete!')
  console.log()
  console.log(colors.yellow + 'Processing and importing parts...' + colors.reset)
  console.log(colors.gray + '(This may take 10-12 minutes for large files)' + colors.reset)
  
  // Display import results
  if (response.data && response.data.summary) {
    const { totalParsed, imported, updated, errors, duration } = response.data.summary
    
    console.log(colors.cyan + 'Import Summary:' + colors.reset)
    console.log('─'.repeat(60))
    console.log(`Total Parsed:  ${colors.blue}${totalParsed.toLocaleString()}${colors.reset}`)
    console.log(`New Records:   ${colors.green}${imported.toLocaleString()}${colors.reset}`)
    console.log(`Updated:       ${colors.yellow}${updated.toLocaleString()}${colors.reset}`)
    console.log(`Errors:        ${errors > 0 ? colors.red : colors.green}${errors}${colors.reset}`)
    if (duration) {
      console.log(`Duration:      ${colors.gray}${duration}${colors.reset}`)
    }
    
    const successRate = ((totalParsed - errors) / totalParsed * 100).toFixed(1)
    console.log()
    console.log(`Success Rate:  ${colors.green}${successRate}%${colors.reset}`)
    
    if (errors > 0) {
      console.log()
      printWarning(`${errors} parts skipped due to missing required fields`)
      console.log(colors.gray + '  Check server logs for details' + colors.reset)
    }
  }
}

async function main() {
  try {
    printHeader('Master Parts Database Re-import')
    
    // Step 1: Backup existing database
    printStep(1, 'Backing up existing database...')
    if (fs.existsSync(DB_PATH)) {
      const backupPath = DB_PATH + `.backup.${Date.now()}`
      fs.copyFileSync(DB_PATH, backupPath)
      printSuccess(`Backed up to: ${path.basename(backupPath)}`)
    } else {
      printWarning('No existing database found (fresh install)')
    }
    console.log()
    
    // Step 2: Delete old database
    printStep(2, 'Deleting old database...')
    if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH)
      printSuccess('Database deleted')
    } else {
      printSuccess('No database to delete')
    }
    console.log()
    
    // Step 3: Recreate schema
    printStep(3, 'Recreating database schema...')
    await runCommand('npm', ['run', 'db:push'])
    printSuccess('Schema created')
    console.log()
    
    // Step 4: Check server
    printStep(4, 'Checking dev server...')
    try {
      await axios.get('http://127.0.0.1:3002/api/health', { timeout: 3000 })
      printSuccess('Dev server is running')
    } catch (error) {
      printError('Dev server is NOT running!')
      console.log()
      console.log(colors.yellow + 'Please start the dev server in another terminal:' + colors.reset)
      console.log(colors.gray + '  npm run dev' + colors.reset)
      console.log()
      process.exit(1)
    }
    console.log()
    
    // Step 5: Upload and import
    printStep(5, 'Uploading and importing parts database...')
    
    if (!fs.existsSync(PARTS_FILE)) {
      printError(`Parts file not found: ${PARTS_FILE}`)
      process.exit(1)
    }
    
    const startTime = Date.now()
    await uploadWithProgress(PARTS_FILE)
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
    
    console.log()
    printHeader('✓ Re-import Complete!')
    console.log(`Total time: ${colors.cyan}${totalTime}s${colors.reset}`)
    console.log()
    console.log(colors.gray + 'Next steps:' + colors.reset)
    console.log('  1. Verify records: ' + colors.blue + 'npx prisma studio' + colors.reset)
    console.log('  2. Test search: ' + colors.blue + 'npx tsx scripts/test-search-api.ts' + colors.reset)
    console.log('  3. Use in BOM UI: ' + colors.blue + 'http://127.0.0.1:3002' + colors.reset)
    console.log()
    
  } catch (error) {
    console.log()
    printError('Re-import failed!')
    console.log()
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error(`Server error ${error.response.status}: ${error.response.statusText}`)
        console.error(error.response.data)
      } else if (error.request) {
        console.error('No response from server')
      } else {
        console.error(error.message)
      }
    } else {
      console.error(error instanceof Error ? error.message : String(error))
    }
    
    console.log()
    console.log(colors.gray + 'Troubleshooting:' + colors.reset)
    console.log('  • Ensure dev server is running: npm run dev')
    console.log('  • Check server logs for errors')
    console.log('  • Verify file path is correct')
    console.log()
    process.exit(1)
  }
}

main()
