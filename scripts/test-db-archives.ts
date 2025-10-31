import fs from 'fs/promises'
import path from 'path'
import { collectDatabaseArchives, isPathWithinArchiveDirectories } from '@/lib/database/archives'

async function ensureDirectory(dir: string) {
  await fs.mkdir(dir, { recursive: true })
}

async function touchFile(filePath: string, sizeBytes = 1) {
  const buffer = Buffer.alloc(sizeBytes, 0)
  await fs.writeFile(filePath, buffer)
  const now = new Date()
  await fs.utimes(filePath, now, now)
}

async function run() {
  const projectRoot = process.cwd()
  const backupsDir = path.join(projectRoot, 'db', 'backups')
  await ensureDirectory(backupsDir)

  const archiveA = path.join(backupsDir, 'test-archive-a.zip')
  const archiveB = path.join(backupsDir, 'test-archive-b.zip')
  const ignoredFile = path.join(backupsDir, 'ignore.txt')

  await touchFile(archiveA, 10)
  // Delay to ensure different modified time ordering
  await new Promise((resolve) => setTimeout(resolve, 10))
  await touchFile(archiveB, 20)
  await touchFile(ignoredFile, 5)

  try {
    const archives = await collectDatabaseArchives()

    const paths = archives.map((archive) => archive.path)

    if (!paths.includes(archiveA) || !paths.includes(archiveB)) {
      throw new Error('Expected archives were not discovered.')
    }

    if (paths.includes(ignoredFile)) {
      throw new Error('Non-zip files should not be included in archive list.')
    }

    if (archives.length > 1) {
      const first = new Date(archives[0].modifiedAt).getTime()
      const second = new Date(archives[1].modifiedAt).getTime()
      if (first < second) {
        throw new Error('Archives are not sorted by modified date descending.')
      }
    }

    if (!isPathWithinArchiveDirectories(archiveA)) {
      throw new Error('Archive path should be considered within allowed directories.')
    }

    const outsidePath = path.join(projectRoot, 'tmp', 'outside.zip')
    if (isPathWithinArchiveDirectories(outsidePath)) {
      throw new Error('External path should not be considered within archive directories.')
    }

    console.log('✔ Archive discovery test passed.')
  } finally {
    await fs.rm(archiveA, { force: true })
    await fs.rm(archiveB, { force: true })
    await fs.rm(ignoredFile, { force: true })
  }
}

run().catch(async (error) => {
  console.error('Archive discovery test failed:', error)
  process.exitCode = 1
})
