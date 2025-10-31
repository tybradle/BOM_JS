import fs from 'fs/promises'
import path from 'path'
import AdmZip from 'adm-zip'
import { ensureDirectory, getDatabaseFilename } from './paths'

const ARCHIVE_EXTENSION = '.zip'

export function getDatabaseArchiveExtension(): string {
  return ARCHIVE_EXTENSION
}

export async function createDatabaseArchiveBuffer(databasePath: string): Promise<Buffer> {
  const zip = new AdmZip()
  zip.addLocalFile(databasePath, '', getDatabaseFilename())
  return zip.toBuffer()
}

export interface ExtractedArchive {
  databasePath: string
  entryName: string
}

export async function extractDatabaseArchive(buffer: Buffer, destinationDir: string): Promise<ExtractedArchive> {
  await ensureDirectory(destinationDir)
  const zip = new AdmZip(buffer)
  const entries = zip.getEntries().filter((entry) => !entry.isDirectory)

  if (entries.length === 0) {
    throw new Error('The archive is empty or contains only directories.')
  }
  if (entries.length > 1) {
    throw new Error('The archive must contain exactly one SQLite database file.')
  }

  const entry = entries[0]
  const expectedFilename = getDatabaseFilename()

  if (!entry.entryName.toLowerCase().endsWith(expectedFilename.toLowerCase())) {
    throw new Error(`Archive must contain a file named ${expectedFilename}.`)
  }

  const destinationPath = path.join(destinationDir, expectedFilename)
  const content = entry.getData()
  await fs.writeFile(destinationPath, content)

  return {
    databasePath: destinationPath,
    entryName: entry.entryName
  }
}
