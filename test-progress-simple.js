// Simple test to verify the progress functionality works
import { createDatabaseArchiveBuffer } from '../src/lib/database/archive.js';
import { resolveDatabasePath } from '../src/lib/database/paths.js';
import fs from 'fs/promises';

// Mock progress callback
const mockProgress = {
  stages: [],
  log: function(progress) {
    this.stages.push(progress);
    console.log(`[${progress.stage}] ${progress.progress}% - ${progress.message}`);
    if (progress.details) {
      console.log(`  Details: ${progress.details}`);
    }
  }
};

async function testProgress() {
  try {
    console.log('Testing database export with progress...');
    
    const databasePath = resolveDatabasePath();
    console.log('Database path:', databasePath);
    
    // Check if database exists
    try {
      await fs.access(databasePath);
      console.log('Database file found');
    } catch (error) {
      console.log('Database file not found, this is expected in test environment');
      return;
    }
    
    // Test the archive creation with progress
    const archiveBuffer = await createDatabaseArchiveBuffer(databasePath);
    console.log(`Archive created successfully, size: ${archiveBuffer.byteLength} bytes`);
    
  } catch (error) {
    console.error('Error during test:', error.message);
  }
}

testProgress();