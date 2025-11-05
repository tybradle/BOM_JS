import fs from 'fs/promises'
import path from 'path'
import AdmZip from 'adm-zip'
import { ensureDirectory, getDatabaseFilename } from './paths'

const ARCHIVE_EXTENSION = '.zip'

export function getDatabaseArchiveExtension(): string {
  return ARCHIVE_EXTENSION
}

export interface ArchiveMetadata {
  filename: string
  size: number
  createdAt: Date
  description?: string
}

export interface ArchiveProgress {
  stage: string
  progress: number
  message?: string
}

export async function validateDatabaseFile(databasePath: string): Promise<void> {
  try {
    const stats = await fs.stat(databasePath)
    if (!stats.isFile()) {
      throw new Error(`Database path is not a file: ${databasePath}`)
    }
    
    if (stats.size === 0) {
      throw new Error('Database file is empty')
    }

    // Check if file is accessible
    await fs.access(databasePath, fs.constants.R_OK)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Database validation failed: ${error.message}`)
    }
    throw new Error('Database validation failed with unknown error')
  }
}

export async function createDatabaseArchiveBuffer(
  databasePath: string, 
  onProgress?: (progress: ArchiveProgress) => void
): Promise<Buffer> {
  try {
    onProgress?.({ stage: 'validating', progress: 10, message: 'Validating database file...' })
    await validateDatabaseFile(databasePath)

    onProgress?.({ stage: 'creating', progress: 30, message: 'Creating archive...' })
    const zip = new AdmZip()
    
    onProgress?.({ stage: 'adding', progress: 50, message: 'Adding database to archive...' })
    zip.addLocalFile(databasePath, '', getDatabaseFilename())

    onProgress?.({ stage: 'compressing', progress: 80, message: 'Compressing archive...' })
    const buffer = zip.toBuffer()

    onProgress?.({ stage: 'complete', progress: 100, message: 'Archive created successfully' })
    return buffer
  } catch (error) {
    onProgress?.({ 
      stage: 'error', 
      progress: 0, 
      message: error instanceof Error ? error.message : 'Unknown error during archive creation' 
    })
    throw error
  }
}

export interface ExtractedArchive {
  databasePath: string
  entryName: string
  originalSize: number
}

export async function validateArchiveBuffer(buffer: Buffer): Promise<void> {
  if (!buffer || buffer.length === 0) {
    throw new Error('Archive buffer is empty')
  }

  try {
    const zip = new AdmZip(buffer)
    const entries = zip.getEntries()
    
    if (entries.length === 0) {
      throw new Error('Archive contains no entries')
    }

    // Try to read the zip directory to validate it's a valid zip file
    zip.getEntries()
  } catch (error) {
    throw new Error(`Invalid archive format: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function extractDatabaseArchive(
  buffer: Buffer, 
  destinationDir: string,
  onProgress?: (progress: ArchiveProgress) => void
): Promise<ExtractedArchive> {
  try {
    onProgress?.({ stage: 'validating', progress: 10, message: 'Validating archive...' })
    await validateArchiveBuffer(buffer)

    onProgress?.({ stage: 'preparing', progress: 20, message: 'Preparing destination...' })
    await ensureDirectory(destinationDir)

    onProgress?.({ stage: 'reading', progress: 40, message: 'Reading archive contents...' })
    const zip = new AdmZip(buffer)
    const entries = zip.getEntries().filter((entry) => !entry.isDirectory)

    if (entries.length === 0) {
      throw new Error('The archive is empty or contains only directories.')
    }
    if (entries.length > 1) {
      throw new Error('The archive must contain exactly one SQLite database file.')
    }

    onProgress?.({ stage: 'validating-entries', progress: 60, message: 'Validating archive entries...' })
    const entry = entries[0]
    const expectedFilename = getDatabaseFilename()

    if (!entry.entryName.toLowerCase().endsWith(expectedFilename.toLowerCase())) {
      throw new Error(`Archive must contain a file named ${expectedFilename}. Found: ${entry.entryName}`)
    }

    const originalSize = entry.getData().length
    if (originalSize === 0) {
      throw new Error('Database file in archive is empty')
    }

    onProgress?.({ stage: 'extracting', progress: 80, message: 'Extracting database...' })
    const destinationPath = path.join(destinationDir, expectedFilename)
    const content = entry.getData()
    await fs.writeFile(destinationPath, content)

    // Validate the extracted file
    await validateDatabaseFile(destinationPath)

    onProgress?.({ stage: 'complete', progress: 100, message: 'Archive extracted successfully' })
    return {
      databasePath: destinationPath,
      entryName: entry.entryName,
      originalSize
    }
  } catch (error) {
    onProgress?.({ 
      stage: 'error', 
      progress: 0, 
      message: error instanceof Error ? error.message : 'Unknown error during archive extraction' 
    })
    throw error
  }
}

export async function getArchiveMetadata(archivePath: string): Promise<ArchiveMetadata> {
  try {
    const stats = await fs.stat(archivePath)
    const filename = path.basename(archivePath)
    
    return {
      filename,
      size: stats.size,
      createdAt: stats.birthtime || stats.ctime,
      description: `Database archive created ${stats.birthtime.toLocaleDateString()}`
    }
  } catch (error) {
    throw new Error(`Failed to get archive metadata: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function listArchives(archiveDir: string): Promise<ArchiveMetadata[]> {
  try {
    await ensureDirectory(archiveDir)
    const files = await fs.readdir(archiveDir)
    
    const archiveFiles = files.filter(file => file.endsWith(ARCHIVE_EXTENSION))
    const archives: ArchiveMetadata[] = []
    
    for (const file of archiveFiles) {
      const fullPath = path.join(archiveDir, file)
      try {
        const metadata = await getArchiveMetadata(fullPath)
        archives.push(metadata)
      } catch (error) {
        console.warn(`Failed to read metadata for archive ${file}:`, error)
        // Continue with other files even if one fails
      }
    }
    
    // Sort by creation date, newest first
    return archives.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  } catch (error) {
    throw new Error(`Failed to list archives: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function deleteArchive(archivePath: string): Promise<void> {
  try {
    await fs.access(archivePath, fs.constants.W_OK)
    await fs.unlink(archivePath)
  } catch (error) {
    if (error instanceof Error && error.message.includes('ENOENT')) {
      throw new Error('Archive file not found')
    }
    throw new Error(`Failed to delete archive: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
