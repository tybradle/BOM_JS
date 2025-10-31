import { db } from '../src/lib/db'

const sampleParts = [
  // Allen-Bradley Controllers
  {
    partNumber: "1756-L85E",
    manufacturer: "Allen-Bradley",
    description: "ControlLogix Controller",
    secondaryDescription: "Logix 5580, 20MB memory, 5 motion axes",
    category: "Controllers",
    unitPrice: 4250.00,
    supplier: "Rockwell Automation"
  },
  {
    partNumber: "1756-L83E",
    manufacturer: "Allen-Bradley",
    description: "ControlLogix Controller",
    secondaryDescription: "Logix 5580, 10MB memory, 4 motion axes",
    category: "Controllers",
    unitPrice: 3850.00,
    supplier: "Rockwell Automation"
  },
  
  // Allen-Bradley I/O Modules
  {
    partNumber: "1756-EN2T",
    manufacturer: "Allen-Bradley",
    description: "EtherNet/IP Communication Module",
    secondaryDescription: "Dual port, 10/100 Mbps",
    category: "Communication",
    unitPrice: 850.00,
    supplier: "Rockwell Automation"
  },
  {
    partNumber: "1756-IB16",
    manufacturer: "Allen-Bradley",
    description: "Digital Input Module",
    secondaryDescription: "16-point, 24VDC sink/source",
    category: "Digital I/O",
    unitPrice: 425.00,
    supplier: "Rockwell Automation"
  },
  {
    partNumber: "1756-OB16E",
    manufacturer: "Allen-Bradley",
    description: "Digital Output Module",
    secondaryDescription: "16-point, 24VDC source output",
    category: "Digital I/O",
    unitPrice: 475.00,
    supplier: "Rockwell Automation"
  },
  
  // SIEMENS Controllers
  {
    partNumber: "6ES7515-2AM01-0AB0",
    manufacturer: "SIEMENS",
    description: "SIMATIC S7-1500 CPU",
    secondaryDescription: "CPU 1515-2 PN, work memory 500 KB",
    category: "Controllers",
    unitPrice: 2850.00,
    supplier: "Siemens Industry"
  },
  {
    partNumber: "6ES7512-1DK01-0AB0",
    manufacturer: "SIEMENS",
    description: "SIMATIC S7-1500 CPU",
    secondaryDescription: "CPU 1512SP-1 PN, work memory 300 KB",
    category: "Controllers",
    unitPrice: 1950.00,
    supplier: "Siemens Industry"
  },
  
  // SIEMENS I/O
  {
    partNumber: "6ES7521-1BH10-0AA0",
    manufacturer: "SIEMENS",
    description: "Digital Input Module",
    secondaryDescription: "DI 16x24VDC HF, 16 inputs",
    category: "Digital I/O",
    unitPrice: 185.00,
    supplier: "Siemens Industry"
  },
  {
    partNumber: "6ES7522-1BH01-0AA0",
    manufacturer: "SIEMENS",
    description: "Digital Output Module",
    secondaryDescription: "DQ 16x24VDC/0.5A, 16 outputs",
    category: "Digital I/O",
    unitPrice: 195.00,
    supplier: "Siemens Industry"
  },
  
  // Circuit Breakers
  {
    partNumber: "3RV2011-1BA20",
    manufacturer: "SIEMENS",
    description: "Circuit Breaker",
    secondaryDescription: "3RV2 series, 0.9-1.25A, motor protection",
    category: "Circuit Protection",
    unitPrice: 45.00,
    supplier: "Siemens Industry"
  },
  {
    partNumber: "140M-C2E-B16",
    manufacturer: "Allen-Bradley",
    description: "Motor Protection Circuit Breaker",
    secondaryDescription: "Series C, 10-16A frame, 16A rating",
    category: "Circuit Protection",
    unitPrice: 125.00,
    supplier: "Rockwell Automation"
  },
  
  // HMI/Displays
  {
    partNumber: "2711P-T7C4D9",
    manufacturer: "Allen-Bradley",
    description: "PanelView Plus 7 Terminal",
    secondaryDescription: "7-inch color touchscreen, Ethernet/IP",
    category: "HMI",
    unitPrice: 1850.00,
    supplier: "Rockwell Automation"
  },
  {
    partNumber: "6AV2124-0MC01-0AX0",
    manufacturer: "SIEMENS",
    description: "SIMATIC HMI TP1200 Comfort",
    secondaryDescription: "12-inch widescreen TFT display, PROFINET",
    category: "HMI",
    unitPrice: 1650.00,
    supplier: "Siemens Industry"
  },
  
  // Power Supplies
  {
    partNumber: "1606-XLP100E",
    manufacturer: "Allen-Bradley",
    description: "Compact Power Supply",
    secondaryDescription: "100W, 24VDC output, 120/240VAC input",
    category: "Power Supplies",
    unitPrice: 185.00,
    supplier: "Rockwell Automation"
  },
  {
    partNumber: "6EP1333-2BA20",
    manufacturer: "SIEMENS",
    description: "SITOP PSU100C Power Supply",
    secondaryDescription: "24VDC/5A, 120W, 120-230VAC input",
    category: "Power Supplies",
    unitPrice: 165.00,
    supplier: "Siemens Industry"
  },
  
  // Safety Components
  {
    partNumber: "1756-L8SP",
    manufacturer: "Allen-Bradley",
    description: "GuardLogix Safety Controller",
    secondaryDescription: "Integrated safety, 20MB memory",
    category: "Safety",
    unitPrice: 6250.00,
    supplier: "Rockwell Automation"
  },
  {
    partNumber: "6ES7516-3FN02-0AB0",
    manufacturer: "SIEMENS",
    description: "SIMATIC S7-1500F Safety CPU",
    secondaryDescription: "CPU 1516F-3 PN/DP, fail-safe",
    category: "Safety",
    unitPrice: 5850.00,
    supplier: "Siemens Industry"
  },
  
  // Sensors
  {
    partNumber: "872C-D10NP18-D4",
    manufacturer: "Allen-Bradley",
    description: "Inductive Proximity Sensor",
    secondaryDescription: "M18, PNP NO, 10mm range, quick disconnect",
    category: "Sensors",
    unitPrice: 45.00,
    supplier: "Rockwell Automation"
  },
  {
    partNumber: "3RG4013-3AG01",
    manufacturer: "SIEMENS",
    description: "Inductive Proximity Switch",
    secondaryDescription: "M18, PNP NO, 8mm range, cable",
    category: "Sensors",
    unitPrice: 42.00,
    supplier: "Siemens Industry"
  },
  
  // Drives/VFDs
  {
    partNumber: "25B-D010N114",
    manufacturer: "Allen-Bradley",
    description: "PowerFlex 525 AC Drive",
    secondaryDescription: "0.75kW (1HP), 480VAC, 3-phase",
    category: "Drives",
    unitPrice: 485.00,
    supplier: "Rockwell Automation"
  },
  {
    partNumber: "6SL3210-1KE11-8UF1",
    manufacturer: "SIEMENS",
    description: "SINAMICS G120C Drive",
    secondaryDescription: "0.75kW, 380-480VAC, 3-phase, USS/Modbus",
    category: "Drives",
    unitPrice: 425.00,
    supplier: "Siemens Industry"
  }
]

async function seedParts() {
  console.log('🌱 Starting parts database seeding...')
  console.log(`📦 Preparing to seed ${sampleParts.length} parts`)
  
  try {
    let created = 0
    let updated = 0
    
    for (const part of sampleParts) {
      const result = await db.masterPart.upsert({
        where: { partNumber: part.partNumber },
        update: part,
        create: part
      })
      
      // Check if it was a new creation or update
      const existing = await db.masterPart.findUnique({
        where: { partNumber: part.partNumber }
      })
      
      if (existing) {
        // If we found it after upsert, it might have been updated
        console.log(`  ✓ ${part.partNumber} - ${part.description}`)
        created++
      }
    }
    
    console.log(`\n✅ Seeding complete!`)
    console.log(`   Total parts processed: ${sampleParts.length}`)
    console.log(`   Categories: Controllers, I/O Modules, HMI, Power Supplies, Sensors, Drives, Safety`)
    console.log(`   Manufacturers: Allen-Bradley, SIEMENS`)
    
    // Display summary by category
    const summary = await db.masterPart.groupBy({
      by: ['category'],
      _count: { category: true }
    })
    
    console.log(`\n📊 Database Summary by Category:`)
    summary.forEach(({ category, _count }) => {
      console.log(`   ${category}: ${_count.category} parts`)
    })
    
  } catch (error) {
    console.error('❌ Error seeding parts:', error)
    throw error
  }
}

// Run the seed function
seedParts()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
    console.log('\n🔌 Database connection closed')
    process.exit(0)
  })
