import fs from 'fs'
import path from 'path'
import { getDatabasePath as getEnvDatabasePath, getUserDataDirectory } from '@/lib/env'

const DB_FILENAME = 'custom.db'
const DB_RELATIVE_DIR = path.join('prisma', 'db')
const BACKUP_DIR_NAME = 'backups'
const ARCHIVE_GLOB_DIRS = [
  path.join('prisma', 'db', 'backups'),
  path.join('db', 'backups'),
  path.join('Samples', 'Import Sample'),
]

const databaseEnvOverride = process.env.DATABASE_FILE_PATH

function pathExists(candidate: string | undefined): candidate is string {
  return Boolean(candidate && fs.existsSync(candidate))
}

function resolveCandidatePaths(): string[] {
  const cwd = process.cwd()
  const cwdCandidate = path.join(cwd, DB_RELATIVE_DIR, DB_FILENAME)
  const nextServerCandidate = path.join(__dirname, '..', '..', '..', '..', DB_RELATIVE_DIR, DB_FILENAME)
  const electronProcess = process as NodeJS.Process & { resourcesPath?: string }
  const resourcesCandidate = typeof electronProcess.resourcesPath === 'string'
    ? path.join(electronProcess.resourcesPath, DB_RELATIVE_DIR, DB_FILENAME)
    : ''

  return [
    databaseEnvOverride ?? '',
    cwdCandidate,
    nextServerCandidate,
    resourcesCandidate
  ].filter(Boolean) as string[]
}

export function resolveDatabasePath(): string {
  // Priority 1: Explicit environment override
  if (databaseEnvOverride) {
    return databaseEnvOverride
  }
  
  // Priority 2: Use environment-aware path from env.ts
  // This handles dev vs production automatically
  const envPath = getEnvDatabasePath()
  if (fs.existsSync(envPath)) {
    return envPath
  }
  
  // Priority 3: Try legacy candidate paths for backwards compatibility
  const candidates = resolveCandidatePaths()
  for (const candidate of candidates) {
    if (pathExists(candidate)) {
      return candidate
    }
  }
  
  // Fall back to environment-aware path (will be created on first use)
  return envPath
}

export function resolveDatabaseDirectory(): string {
  return path.dirname(resolveDatabasePath())
}

export function resolveBackupDirectory(): string {
  const dbDir = resolveDatabaseDirectory()
  return path.join(dbDir, BACKUP_DIR_NAME)
}

export async function ensureDirectory(targetDir: string): Promise<void> {
  await fs.promises.mkdir(targetDir, { recursive: true })
}

export function getDatabaseFilename(): string {
  return DB_FILENAME
}

export function getArchiveDirectories(): string[] {
  const isDevelopment = process.env.NODE_ENV !== 'production'
  
  // Use environment-aware user data directory
  const userDataDir = getUserDataDirectory()
  const baseCandidates = [userDataDir]
  
  // In development, also include project root
  if (isDevelopment) {
    baseCandidates.push(process.cwd())
  }
  
  const electronProcess = process as NodeJS.Process & { resourcesPath?: string; env?: NodeJS.ProcessEnv }

  if (typeof electronProcess.resourcesPath === 'string') {
    baseCandidates.push(electronProcess.resourcesPath)
  }

  const archiveDirs = new Set<string>()
  for (const base of baseCandidates) {
    for (const relative of ARCHIVE_GLOB_DIRS) {
      const candidate = path.join(base, relative)
      if (fs.existsSync(candidate)) {
        archiveDirs.add(candidate)
      }
    }
  }

  if (archiveDirs.size === 0) {
    // Default to database directory + backups
    const dbDir = resolveDatabaseDirectory()
    archiveDirs.add(path.join(dbDir, BACKUP_DIR_NAME))
  }

  return Array.from(archiveDirs)
}
