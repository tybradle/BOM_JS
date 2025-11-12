import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkTables() {
  try {
    console.log('Checking database tables...')
    
    // Try to query BinLabel table
    const count = await prisma.binLabel.count()
    console.log(`✅ BinLabel table exists with ${count} records`)
    
    // Check other tables
    const projectCount = await prisma.bOMProject.count()
    console.log(`✅ BOMProject table exists with ${projectCount} records`)
    
    const locationCount = await prisma.location.count()
    console.log(`✅ Location table exists with ${locationCount} records`)
    
  } catch (error: any) {
    console.error('❌ Error checking tables:', error.message)
    console.error('Error code:', error.code)
    
    if (error.code === 'P2021') {
      console.log('\n⚠️  Table does not exist. Running db:push might fix this.')
    }
  } finally {
    await prisma.$disconnect()
  }
}

checkTables()
