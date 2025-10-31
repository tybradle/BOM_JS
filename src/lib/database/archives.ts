import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import type { DatabaseArchiveEntry } from '@/types/database'
import { getArchiveDirectories } from './paths'

const MAX_ARCHIVE_SIZE_BYTES = 500 * 1024 * 1024 // 500 MB guardrail

async function statIfExists(filePath: string): Promise<fs.Stats | null> {
  try {
    const stats = await fsPromises.stat(filePath)
    return stats
  } catch {
    return null
  }
}

export async function collectDatabaseArchives(): Promise<DatabaseArchiveEntry[]> {
  const directories = getArchiveDirectories()
  const archives: DatabaseArchiveEntry[] = []

  for (const directory of directories) {
    let entries: string[]
    try {
      entries = await fsPromises.readdir(directory)
    } catch {
      continue
    }

    for (const entryName of entries) {
      if (!entryName.toLowerCase().endsWith('.zip')) {
        continue
      }

      const fullPath = path.join(directory, entryName)
      const stats = await statIfExists(fullPath)
      if (!stats) continue
      if (!stats.isFile()) continue
      if (stats.size > MAX_ARCHIVE_SIZE_BYTES) continue

      archives.push({
        name: entryName,
        size: stats.size,
        location: directory,
        modifiedAt: stats.mtime.toISOString(),
        path: fullPath
      })
    }
  }

  return archives.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime())
}

export function isPathWithinArchiveDirectories(targetPath: string): boolean {
  const directories = getArchiveDirectories()
  const normalizedTarget = path.resolve(targetPath)
  const lowerTarget = normalizedTarget.toLowerCase()
  return directories.some((dir) => {
    const normalizedDir = path.resolve(dir)
    const lowerDir = normalizedDir.toLowerCase()
    const prefix = (normalizedDir.endsWith(path.sep) ? normalizedDir : normalizedDir + path.sep).toLowerCase()
    return lowerTarget === lowerDir || lowerTarget.startsWith(prefix)
  })
}
