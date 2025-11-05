// Simple test script to verify archive functionality
const { createDatabaseArchiveBuffer } = require('./src/lib/database/archive');
const { resolveDatabasePath } = require('./src/lib/database/paths');

async function testArchive() {
  try {
    console.log('Testing archive creation...');
    const dbPath = resolveDatabasePath();
    console.log('Database path:', dbPath);
    
    const buffer = await createDatabaseArchiveBuffer(dbPath, (progress) => {
      console.log(`Progress: ${progress.stage} - ${progress.progress}%`);
    });
    
    console.log('Archive created successfully, size:', buffer.length);
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testArchive();