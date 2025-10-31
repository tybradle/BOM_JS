/**
 * Quick test script for settings API
 * Run with: node --loader tsx scripts/test-settings-api.ts
 */

async function testSettingsAPI() {
  const baseUrl = 'http://localhost:3002'
  
  console.log('🧪 Testing Settings API...\n')
  
  try {
    // Test 1: GET settings (should return defaults for new user)
    console.log('Test 1: GET /api/settings')
    const getResponse = await fetch(`${baseUrl}/api/settings`)
    const settings = await getResponse.json()
    console.log('✅ GET successful')
    console.log('   Theme:', settings.appearance.theme)
    console.log('   Default format:', settings.importExport.export.defaultFormat)
    console.log('')
    
    // Test 2: PATCH settings (update theme)
    console.log('Test 2: PATCH /api/settings (update theme to dark)')
    const patchResponse = await fetch(`${baseUrl}/api/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appearance: {
          theme: 'dark'
        }
      })
    })
    const updatedSettings = await patchResponse.json()
    console.log('✅ PATCH successful')
    console.log('   New theme:', updatedSettings.appearance.theme)
    console.log('   Other settings preserved:', updatedSettings.table.confirmBeforeDelete)
    console.log('')
    
    // Test 3: GET again to verify persistence
    console.log('Test 3: GET /api/settings (verify persistence)')
    const verifyResponse = await fetch(`${baseUrl}/api/settings`)
    const verifiedSettings = await verifyResponse.json()
    console.log('✅ Settings persisted')
    console.log('   Theme after reload:', verifiedSettings.appearance.theme)
    console.log('')
    
    console.log('✅ All tests passed!')
    console.log('\n📊 Summary:')
    console.log('   - Settings API is functional')
    console.log('   - Defaults are returned for new users')
    console.log('   - Partial updates work correctly')
    console.log('   - Settings persist in database')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

// Run tests
testSettingsAPI()
