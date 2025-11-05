#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🔍 Testing Local Workspace Setup...\n')

// Check if build exists
const nextBuildPath = path.join(process.cwd(), '.next')
const hasBuild = fs.existsSync(nextBuildPath)

console.log('📦 Build Status:', hasBuild ? '✅ Built' : '❌ Not built')

if (hasBuild) {
  const staticPath = path.join(nextBuildPath, 'static')
  const serverPath = path.join(nextBuildPath, 'server')
  
  console.log('📁 Static Files:', fs.existsSync(staticPath) ? '✅ Present' : '❌ Missing')
  console.log('🖥️  Server Files:', fs.existsSync(serverPath) ? '✅ Present' : '❌ Missing')
}

// Check database
const dbPath = path.join(process.cwd(), 'db', 'custom.db')
console.log('🗄️  Database:', fs.existsSync(dbPath) ? '✅ Present' : '❌ Missing')

// Check Electron files
const electronPath = path.join(process.cwd(), 'public', 'electron.js')
const preloadPath = path.join(process.cwd(), 'public', 'preload.js')

console.log('⚡ Electron Main:', fs.existsSync(electronPath) ? '✅ Present' : '❌ Missing')
console.log('🔗 Electron Preload:', fs.existsSync(preloadPath) ? '✅ Present' : '❌ Missing')

// Check package.json scripts
const packageJson = require(path.join(process.cwd(), 'package.json'))
const hasLocalScript = packageJson.scripts['electron-local']

console.log('📜 Local Script:', hasLocalScript ? '✅ Present' : '❌ Missing')

console.log('\n🚀 Recommended Commands:')
console.log('1. Build: npm run build')
console.log('2. Test Local: npm run electron-local')
console.log('3. Test Dev: npm run electron-dev')
console.log('4. Package: npm run electron-pack')

if (!hasBuild) {
  console.log('\n⚠️  Please run "npm run build" first!')
}