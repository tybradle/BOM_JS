// Electron Builder Hook
// beforePack: Temporarily hide dev dependencies to prevent scanning errors
// afterPack: Clean up and restore

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const devDepsToHide = [
  'tsx',
  'esbuild',
  '@esbuild',
  'typescript',
  'eslint',
  '@eslint',
  'tailwindcss',
  '@tailwindcss',
  'nodemon',
  'concurrently',
  'wait-on'
];

const renamedDeps = [];

exports.default = async function(context) {
  const stage = context.packager ? 'afterPack' : 'beforePack';
  
  if (stage === 'beforePack') {
    console.log('BeforePack: Temporarily hiding dev dependencies...');
    
    for (const dep of devDepsToHide) {
      const depPath = path.join(projectRoot, 'node_modules', dep);
      const hiddenPath = depPath + '.hidden';
      
      if (fs.existsSync(depPath)) {
        try {
          fs.renameSync(depPath, hiddenPath);
          renamedDeps.push({ from: hiddenPath, to: depPath });
          console.log(`  Hidden: ${dep}`);
        } catch (err) {
          console.warn(`  Failed to hide ${dep}:`, err.message);
        }
      }
    }
    
    console.log(`BeforePack: Hidden ${renamedDeps.length} dev dependencies`);
  }
};

// Cleanup function to restore hidden dependencies
process.on('exit', () => {
  if (renamedDeps.length > 0) {
    console.log('\nRestoring hidden dependencies...');
    for (const { from, to } of renamedDeps) {
      if (fs.existsSync(from)) {
        try {
          fs.renameSync(from, to);
        } catch (err) {
          console.warn(`Failed to restore ${to}:`, err.message);
        }
      }
    }
    console.log('Dependencies restored');
  }
});
