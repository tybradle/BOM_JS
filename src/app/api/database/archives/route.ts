import { NextResponse } from 'next/server'
import { collectDatabaseArchives } from '@/lib/database/archives'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const archives = await collectDatabaseArchives()
    return NextResponse.json({ archives })
  } catch (error) {
    console.error('[database-archives] Failed to enumerate archives', error)
    const message = error instanceof Error ? error.message : 'Failed to enumerate archives'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


