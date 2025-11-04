/**
 * Environment-aware configuration
 * Handles differences between development and production environments
 * 
 * CRITICAL FOR PRODUCTION:
 * - Database paths must be user-writable (not in app installation directory)
 * - Temp directories must be in appropriate OS locations
 * - File paths must work in packaged Electron apps
 */

import path from 'path'
import os from 'os'

const isDevelopment = process.env.NODE_ENV !== 'production'

/**
 * Get the appropriate temp directory for the current environment
 * 
 * Development: Uses project workspace temp/
 * Production: Uses OS temp directory or Electron userData
 */
export function getTempDirectory(): string {
  if (isDevelopment) {
    // Development: Use project temp directory
    return path.join(process.cwd(), 'temp')
  }
  
  // Production: Try to use Electron's userData path
  // If not available, fall back to OS temp directory
  try {
    // Check if running in Electron
    if (process.versions && 'electron' in process.versions) {
      // Attempt to get app from electron module
      // This works in main process or with remote
      const electron = require('electron')
      const app = electron.app || electron.remote?.app
      
      if (app && typeof app.getPath === 'function') {
        return path.join(app.getPath('userData'), 'temp')
      }
    }
  } catch (err) {
    // Not in Electron or app not available, continue to fallback
  }
  
  // Fallback: Use OS temp directory
  return path.join(os.tmpdir(), 'bom-management-framework')
}

/**
 * Get the upload directory for temporary file uploads
 */
export function getUploadDirectory(): string {
  return path.join(getTempDirectory(), 'uploads')
}

/**
 * Get the user data directory
 * This is where user-specific application data should be stored
 * 
 * Development: Uses project workspace
 * Production: Uses %USERPROFILE%/BOM_SUITE or equivalent
 */
export function getUserDataDirectory(): string {
  if (isDevelopment) {
    // Development: Use project root
    return process.cwd()
  }
  
  // Production: Use user home directory
  const userHome = process.env.USERPROFILE || process.env.HOME || os.homedir()
  return path.join(userHome, 'BOM_SUITE')
}

/**
 * Get the database file path
 * This is where the SQLite database should be stored
 * 
 * IMPORTANT: This should match the DATABASE_URL in .env
 * but provides a fallback for production
 */
export function getDatabasePath(): string {
  // Check for explicit override from environment
  if (process.env.DATABASE_FILE_PATH) {
    return process.env.DATABASE_FILE_PATH
  }
  
  if (isDevelopment) {
    // Development: Use project db directory
    return path.join(process.cwd(), 'db', 'custom.db')
  }
  
  // Production: Use user data directory
  return path.join(getUserDataDirectory(), 'masterdb.db')
}

/**
 * Get the database URL for Prisma
 * 
 * Returns a file:// URL that Prisma can use
 */
export function getDatabaseURL(): string {
  const dbPath = getDatabasePath()
  
  // Convert Windows backslashes to forward slashes for file:// URL
  const normalizedPath = dbPath.replace(/\\/g, '/')
  
  return `file:${normalizedPath}`
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return !isDevelopment
}

/**
 * Check if running in Electron
 */
export function isElectron(): boolean {
  return Boolean(process.versions && 'electron' in process.versions)
}

/**
 * Get the appropriate port for the Next.js server
 */
export function getServerPort(): number {
  const envPort = process.env.PORT || process.env.NEXT_PUBLIC_PORT
  if (envPort) {
    return parseInt(envPort, 10)
  }
  
  // Default ports
  return isDevelopment ? 3002 : 3000
}

/**
 * Get the server URL for the current environment
 */
export function getServerURL(): string {
  const port = getServerPort()
  return `http://localhost:${port}`
}

/**
 * Logging helper for environment debugging
 */
export function logEnvironmentInfo(): void {
  console.log('\n=== Environment Configuration ===')
  console.log('Mode:', isDevelopment ? 'Development' : 'Production')
  console.log('Electron:', isElectron())
  console.log('Platform:', process.platform)
  console.log('Node version:', process.version)
  console.log('CWD:', process.cwd())
  console.log('Temp directory:', getTempDirectory())
  console.log('Upload directory:', getUploadDirectory())
  console.log('User data directory:', getUserDataDirectory())
  console.log('Database path:', getDatabasePath())
  console.log('Database URL:', getDatabaseURL())
  console.log('Server URL:', getServerURL())
  console.log('===================================\n')
}
