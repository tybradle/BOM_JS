// Build script to compile server.ts for Electron packaging
const { build } = require('esbuild');
const path = require('path');
const fs = require('fs');

const outDir = path.join(__dirname, '..', 'dist-server');

// Ensure output directory exists
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('Building server.ts for production...');

build({
  entryPoints: [path.join(__dirname, '..', 'server.ts')],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: path.join(outDir, 'server.js'),
  format: 'cjs',
  external: [
    '@prisma/client',
    '.prisma/client',
    'sharp'
  ],
  packages: 'external',  // Don't bundle node_modules
  loader: {
    '.ts': 'ts',
    '.tsx': 'tsx',
  },
  logLevel: 'info',
  sourcemap: true,
  define: {
    'process.env.NODE_ENV': '"production"'
  }
}).then(() => {
  console.log('✓ Server build completed successfully');
  console.log('Output:', path.join(outDir, 'server.js'));
}).catch((error) => {
  console.error('✗ Server build failed:', error);
  process.exit(1);
});
