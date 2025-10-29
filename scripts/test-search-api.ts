// Test the search API directly without HTTP
import { db } from '../src/lib/db'

async function testSearch() {
  console.log('🔍 Testing Master Parts Search...\n')
  
  // Test 1: Search for "allen"
  console.log('Test 1: Search for "allen"')
  const allenParts = await db.masterPart.findMany({
    where: {
      OR: [
        { partNumber: { contains: 'allen' } },
        { description: { contains: 'allen' } },
        { manufacturer: { contains: 'allen' } }
      ]
    },
    take: 5,
    orderBy: { partNumber: 'asc' }
  })
  console.log(`  Found ${allenParts.length} parts:`)
  allenParts.forEach(p => {
    console.log(`  - ${p.partNumber} | ${p.manufacturer} | ${p.description} | $${p.unitPrice}`)
  })
  
  // Test 2: Search for "1756"
  console.log('\nTest 2: Search for "1756"')
  const controllerParts = await db.masterPart.findMany({
    where: {
      OR: [
        { partNumber: { contains: '1756' } },
        { description: { contains: '1756' } }
      ]
    },
    orderBy: { partNumber: 'asc' }
  })
  console.log(`  Found ${controllerParts.length} parts:`)
  controllerParts.forEach(p => {
    console.log(`  - ${p.partNumber} | ${p.description}`)
  })
  
  // Test 3: Filter by manufacturer
  console.log('\nTest 3: Filter by SIEMENS manufacturer')
  const siemensParts = await db.masterPart.findMany({
    where: { manufacturer: 'SIEMENS' },
    orderBy: { partNumber: 'asc' }
  })
  console.log(`  Found ${siemensParts.length} SIEMENS parts:`)
  siemensParts.forEach(p => {
    console.log(`  - ${p.partNumber} | ${p.description} | ${p.category}`)
  })
  
  // Test 4: Filter by category
  console.log('\nTest 4: Filter by Controllers category')
  const controllers = await db.masterPart.findMany({
    where: { category: 'Controllers' },
    orderBy: { partNumber: 'asc' }
  })
  console.log(`  Found ${controllers.length} controllers:`)
  controllers.forEach(p => {
    console.log(`  - ${p.partNumber} | ${p.manufacturer} | $${p.unitPrice}`)
  })
  
  // Test 5: Total count
  console.log('\nTest 5: Total parts in database')
  const total = await db.masterPart.count()
  console.log(`  Total parts: ${total}`)
  
  console.log('\n✅ All search tests completed!')
}

testSearch()
  .catch(error => {
    console.error('❌ Error during testing:', error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
    process.exit(0)
  })
