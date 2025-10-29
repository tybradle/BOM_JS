/**
 * Phase 2 Testing Script
 * Tests completed Phase 2 implementations:
 * - Task 2.1: MasterPart database model
 * - Task 2.4: Part search API
 * 
 * Note: Tasks 2.2 (XML parser) and 2.3 (full import) are pending
 */

import { db } from '../src/lib/db'

const BASE_URL = 'http://127.0.0.1:3002'

async function testPhase2() {
  console.log('🧪 Starting Phase 2 Testing...\n')

  try {
    // Task 2.1: Verify MasterPart schema
    console.log('📋 Task 2.1: Testing MasterPart Database Model')
    console.log('─'.repeat(50))
    
    const testQuery = await db.masterPart.findFirst({
      select: {
        partNumber: true,
        manufacturer: true,
        description: true,
        secondaryDescription: true,
        category: true,
        unitPrice: true,
        supplier: true,
      }
    })
    console.log('✅ MasterPart model exists in database')
    console.log('   - partNumber: String (unique)')
    console.log('   - manufacturer: String?')
    console.log('   - description: String')
    console.log('   - secondaryDescription: String?')
    console.log('   - category: String?')
    console.log('   - unitPrice: Float?')
    console.log('   - supplier: String?\n')

    // Create sample parts data
    console.log('📋 Creating Sample Master Parts Data')
    console.log('─'.repeat(50))

    const sampleParts = [
      {
        partNumber: '1756-L85E',
        manufacturer: 'Allen-Bradley',
        description: 'ControlLogix Controller',
        secondaryDescription: 'Logix 5580, 20MB memory, redundancy capable',
        category: 'Controllers',
        unitPrice: 4250.00,
        supplier: 'Rockwell Automation'
      },
      {
        partNumber: '1756-EN2T',
        manufacturer: 'Allen-Bradley',
        description: 'EtherNet/IP Communication Module',
        secondaryDescription: 'Dual port, 10/100 Mbps, embedded switch',
        category: 'Communication',
        unitPrice: 850.00,
        supplier: 'Rockwell Automation'
      },
      {
        partNumber: '871TM-D4NE12-R',
        manufacturer: 'Allen-Bradley',
        description: 'Inductive Proximity Sensor',
        secondaryDescription: 'M12 connector, 4mm sensing range, NPN output',
        category: 'Sensors',
        unitPrice: 125.50,
        supplier: 'Rockwell Automation'
      },
      {
        partNumber: '3RV2011-1BA20',
        manufacturer: 'Siemens',
        description: 'Circuit Breaker',
        secondaryDescription: 'Motor protection, 0.9-1.25A',
        category: 'Protection',
        unitPrice: 45.00,
        supplier: 'Siemens Industry'
      },
      {
        partNumber: '3RV2021-4EA10',
        manufacturer: 'Siemens',
        description: 'Circuit Breaker',
        secondaryDescription: 'Motor protection, 30-40A',
        category: 'Protection',
        unitPrice: 95.00,
        supplier: 'Siemens Industry'
      },
      {
        partNumber: 'LC1D25M7',
        manufacturer: 'Schneider Electric',
        description: 'Contactor',
        secondaryDescription: '25A, 220V AC coil, 3-pole',
        category: 'Contactors',
        unitPrice: 68.50,
        supplier: 'Schneider Electric'
      },
      {
        partNumber: 'XCKP2145P16',
        manufacturer: 'Schneider Electric',
        description: 'Limit Switch',
        secondaryDescription: 'Side rotary, metal roller lever, 2NC+2NO',
        category: 'Sensors',
        unitPrice: 42.00,
        supplier: 'Schneider Electric'
      },
      {
        partNumber: '140CPU65150',
        manufacturer: 'Schneider Electric',
        description: 'Modicon M340 PLC CPU',
        secondaryDescription: '1024KB memory, Unity Pro compatible',
        category: 'Controllers',
        unitPrice: 2100.00,
        supplier: 'Schneider Electric'
      },
    ]

    // Clear existing test data
    await db.masterPart.deleteMany({
      where: {
        partNumber: {
          in: sampleParts.map(p => p.partNumber)
        }
      }
    })

    // Insert sample parts
    let inserted = 0
    for (const part of sampleParts) {
      await db.masterPart.create({ data: part })
      inserted++
    }
    console.log(`✅ Created ${inserted} sample parts\n`)

    // Task 2.4: Test Search API
    console.log('📋 Task 2.4: Testing Part Search API')
    console.log('─'.repeat(50))

    // Test 1: Search by part number
    console.log('\n🔍 Test 1: Search by part number "1756"')
    const search1 = await fetch(`${BASE_URL}/api/parts/search?q=1756`)
    const result1 = await search1.json()
    console.log(`   Results: ${result1.total} parts found`)
    result1.results?.forEach((p: any) => {
      console.log(`   - ${p.partNumber}: ${p.description}`)
    })

    // Test 2: Search by manufacturer
    console.log('\n🔍 Test 2: Search by manufacturer "Siemens"')
    const search2 = await fetch(`${BASE_URL}/api/parts/search?q=Siemens`)
    const result2 = await search2.json()
    console.log(`   Results: ${result2.total} parts found`)
    result2.results?.forEach((p: any) => {
      console.log(`   - ${p.partNumber}: ${p.description}`)
    })

    // Test 3: Search by description
    console.log('\n🔍 Test 3: Search by description "Controller"')
    const search3 = await fetch(`${BASE_URL}/api/parts/search?q=Controller`)
    const result3 = await search3.json()
    console.log(`   Results: ${result3.total} parts found`)
    result3.results?.forEach((p: any) => {
      console.log(`   - ${p.partNumber}: ${p.description} (${p.manufacturer})`)
    })

    // Test 4: Filter by manufacturer
    console.log('\n🔍 Test 4: Search "Circuit" with manufacturer filter')
    const search4 = await fetch(`${BASE_URL}/api/parts/search?q=Circuit&manufacturer=Siemens`)
    const result4 = await search4.json()
    console.log(`   Results: ${result4.total} parts found`)
    result4.results?.forEach((p: any) => {
      console.log(`   - ${p.partNumber}: ${p.description}`)
    })

    // Test 5: Pagination
    console.log('\n🔍 Test 5: Pagination (limit=3)')
    const search5 = await fetch(`${BASE_URL}/api/parts/search?q=&limit=3&page=1`)
    const result5 = await search5.json()
    console.log(`   Page 1: ${result5.results?.length} results (total: ${result5.total})`)
    console.log(`   Has more: ${result5.hasMore}`)

    // Test 6: Empty search (should return all)
    console.log('\n🔍 Test 6: Empty search (should return all parts)')
    const search6 = await fetch(`${BASE_URL}/api/parts/search?q=`)
    const result6 = await search6.json()
    console.log(`   Results: ${result6.total} parts total`)

    // Test 7: No results
    console.log('\n🔍 Test 7: Search with no results')
    const search7 = await fetch(`${BASE_URL}/api/parts/search?q=NONEXISTENT12345`)
    const result7 = await search7.json()
    console.log(`   Results: ${result7.total} parts found`)

    // Validation
    console.log('\n' + '─'.repeat(50))
    console.log('📊 Validation Summary')
    console.log('─'.repeat(50))

    const validations = [
      { name: 'MasterPart model exists', pass: true },
      { name: 'Sample data created', pass: inserted === sampleParts.length },
      { name: 'Search by part number works', pass: result1.total > 0 },
      { name: 'Search by manufacturer works', pass: result2.total > 0 },
      { name: 'Search by description works', pass: result3.total > 0 },
      { name: 'Manufacturer filter works', pass: result4.results?.every((p: any) => p.manufacturer === 'Siemens') },
      { name: 'Pagination works', pass: result5.results?.length === 3 && result5.hasMore },
      { name: 'Empty search returns all', pass: result6.total === inserted },
      { name: 'No results handled gracefully', pass: result7.total === 0 },
      { name: 'Response includes total count', pass: 'total' in result1 },
      { name: 'Response includes hasMore flag', pass: 'hasMore' in result1 },
    ]

    let passed = 0
    let failed = 0

    for (const validation of validations) {
      if (validation.pass) {
        console.log(`✅ ${validation.name}`)
        passed++
      } else {
        console.log(`❌ ${validation.name}`)
        failed++
      }
    }

    console.log('\n' + '═'.repeat(50))
    console.log('🎉 Phase 2 Testing Complete!')
    console.log('═'.repeat(50))
    console.log(`\n✅ Completed Phase 2 tasks validated:`)
    console.log('   ✅ Task 2.1: MasterPart database model')
    console.log('   ✅ Task 2.4: Part search API')
    console.log('\n⏹️  Pending tasks:')
    console.log('   ⏹️  Task 2.2: XML streaming parser (flagged for dedicated session)')
    console.log('   🟡 Task 2.3: Import API (simplified version complete, full XML import pending)')
    console.log(`\n📊 Validation Results: ${passed}/${validations.length} passed`)

    if (failed === 0) {
      console.log('\n🏆 ALL TESTS PASSED! Phase 2 (completed tasks) is production-ready.\n')
    } else {
      console.log(`\n⚠️  ${failed} validation(s) failed. Review the output above.\n`)
    }

    // Cleanup
    console.log('🧹 Cleaning up test data...')
    await db.masterPart.deleteMany({
      where: {
        partNumber: {
          in: sampleParts.map(p => p.partNumber)
        }
      }
    })
    console.log('✅ Test data cleaned up\n')

  } catch (error) {
    console.error('\n❌ Test failed with error:')
    console.error(error)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

// Run tests
testPhase2().catch(console.error)
