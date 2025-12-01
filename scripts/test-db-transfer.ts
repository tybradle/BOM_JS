import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { createDatabaseArchiveBuffer, extractDatabaseArchive } from '@/lib/database/archive'
import { resolveDatabasePath } from '@/lib/database/paths'
import { validateDatabaseSchema } from '@/lib/database/validation'

interface TableCounts {
  projects: number
  locations: number
  items: number
}

async function collectCounts(databasePath: string): Promise<TableCounts> {
  const client = new PrismaClient({
    datasources: {
      db: {
        url: `file:${databasePath}`
      }
    }
  })

  try {
    const [projects, locations, items] = await Promise.all([
      client.bOMProject.count(),
      client.location.count(),
      client.bOMItem.count()
    ])

    return { projects, locations, items }
  } finally {
    await client.$disconnect()
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function main() {
  console.log('Running database transfer smoke test...')

  const liveDatabasePath = resolveDatabasePath()
  if (!(await fileExists(liveDatabasePath))) {
    console.warn('No database file found. Skipping transfer test.')
    return
  }
  const archiveBuffer = await createDatabaseArchiveBuffer(liveDatabasePath)

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bom-db-test-'))

  try {
    const { databasePath: extractedDatabasePath } = await extractDatabaseArchive(archiveBuffer, tempDir)

    await validateDatabaseSchema(extractedDatabasePath)

    const [liveCounts, extractedCounts] = await Promise.all([
      collectCounts(liveDatabasePath),
      collectCounts(extractedDatabasePath)
    ])

    if (JSON.stringify(liveCounts) !== JSON.stringify(extractedCounts)) {
      console.error('Row count mismatch detected:', { liveCounts, extractedCounts })
      throw new Error('Database counts diverged after round-trip archive process.')
    }

    console.log('✔ Database transfer test passed.')
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error('Database transfer test failed:', error)
  process.exit(1)
})
