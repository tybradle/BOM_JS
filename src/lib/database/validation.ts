import { PrismaClient } from '@prisma/client'

const REQUIRED_TABLES = [
  'User',
  'BOMProject',
  'Location',
  'BOMItem',
  'BOMExport'
]

export interface DatabaseValidationResult {
  tables: string[]
  integrity: string
}

export async function validateDatabaseSchema(databaseFilePath: string): Promise<DatabaseValidationResult> {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${databaseFilePath}`
      }
    }
  })

  try {
    const tables = await prisma.$queryRaw<Array<{ name: string }>>`SELECT name FROM sqlite_master WHERE type = 'table'`
    const tableNames = tables.map((table) => table.name)

    const missingTables = REQUIRED_TABLES.filter((table) => !tableNames.includes(table))
    if (missingTables.length > 0) {
      throw new Error(`Database schema mismatch. Missing tables: ${missingTables.join(', ')}`)
    }

    const integrityResults = await prisma.$queryRawUnsafe<Array<{ integrity_check: string }>>('PRAGMA integrity_check;')
    const integrity = integrityResults[0]?.integrity_check ?? 'unknown'

    if (integrity !== 'ok') {
      throw new Error('Database integrity check failed.')
    }

    return {
      tables: tableNames,
      integrity
    }
  } finally {
    await prisma.$disconnect()
  }
}
