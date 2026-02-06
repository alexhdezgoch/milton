#!/usr/bin/env node

/**
 * Milton Extension - Production Build Script
 * Creates a production-ready .zip for Chrome Web Store submission
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SCRIPT_DIR = __dirname;
const BUILD_DIR = path.join(SCRIPT_DIR, 'dist');
const ZIP_NAME = 'milton-extension-v1.0.0.zip';

console.log('🔨 Building Milton Extension for Production...\n');

// Clean previous build
if (fs.existsSync(BUILD_DIR)) {
  fs.rmSync(BUILD_DIR, { recursive: true });
}
fs.mkdirSync(BUILD_DIR, { recursive: true });

// Create directories
['background', 'content', 'popup', 'styles', 'icons'].forEach(dir => {
  fs.mkdirSync(path.join(BUILD_DIR, dir), { recursive: true });
});

/**
 * Remove console.log/warn/error statements from JavaScript code
 */
function removeConsoleLogs(code) {
  // Remove console.log/warn/error calls, including multi-line ones
  // This regex handles:
  // - console.log('simple')
  // - console.log('with', multiple, 'args')
  // - console.log({ object: 'literal' })
  // - console.error('[prefix]', error)
  // - .catch(err => console.error(...))

  let result = code;

  // Remove standalone console statements (full lines)
  result = result.replace(/^\s*console\.(log|warn|error)\([^;]*\);?\s*$/gm, '');

  // Remove console in arrow functions like .catch(err => console.error(...))
  result = result.replace(/\.catch\(\s*\w+\s*=>\s*console\.(log|warn|error)\([^)]*\)\s*\)/g, '.catch(() => {})');

  // Remove console statements with template literals or complex args
  result = result.replace(/console\.(log|warn|error)\([^)]*\);?/g, '');

  // Clean up empty lines left behind
  result = result.replace(/\n\s*\n\s*\n/g, '\n\n');

  return result;
}

/**
 * Copy and process a JavaScript file
 */
function processJSFile(src, dest) {
  const code = fs.readFileSync(src, 'utf8');
  const processed = removeConsoleLogs(code);
  fs.writeFileSync(dest, processed);
  console.log(`  ✓ Processed: ${path.basename(src)}`);
}

/**
 * Copy a file without processing
 */
function copyFile(src, dest) {
  fs.copyFileSync(src, dest);
  console.log(`  ✓ Copied: ${path.basename(src)}`);
}

// Copy and process files
console.log('Processing JavaScript files...');

processJSFile(
  path.join(SCRIPT_DIR, 'background/service-worker.js'),
  path.join(BUILD_DIR, 'background/service-worker.js')
);

processJSFile(
  path.join(SCRIPT_DIR, 'content/content.js'),
  path.join(BUILD_DIR, 'content/content.js')
);

processJSFile(
  path.join(SCRIPT_DIR, 'content/inject-id.js'),
  path.join(BUILD_DIR, 'content/inject-id.js')
);

processJSFile(
  path.join(SCRIPT_DIR, 'popup/popup.js'),
  path.join(BUILD_DIR, 'popup/popup.js')
);

console.log('\nCopying other files...');

// Copy static files
copyFile(
  path.join(SCRIPT_DIR, 'manifest.json'),
  path.join(BUILD_DIR, 'manifest.json')
);

copyFile(
  path.join(SCRIPT_DIR, 'popup/popup.html'),
  path.join(BUILD_DIR, 'popup/popup.html')
);

copyFile(
  path.join(SCRIPT_DIR, 'popup/popup.css'),
  path.join(BUILD_DIR, 'popup/popup.css')
);

// Copy styles
const stylesDir = path.join(SCRIPT_DIR, 'styles');
if (fs.existsSync(stylesDir)) {
  fs.readdirSync(stylesDir).forEach(file => {
    copyFile(
      path.join(stylesDir, file),
      path.join(BUILD_DIR, 'styles', file)
    );
  });
}

// Copy icons
const iconsDir = path.join(SCRIPT_DIR, 'icons');
fs.readdirSync(iconsDir).forEach(file => {
  if (file.endsWith('.png')) {
    copyFile(
      path.join(iconsDir, file),
      path.join(BUILD_DIR, 'icons', file)
    );
  }
});

// Create zip file
console.log('\nCreating zip file...');
const zipPath = path.join(SCRIPT_DIR, ZIP_NAME);

// Remove old zip if exists
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

// Create zip using system zip command
execSync(`cd "${BUILD_DIR}" && zip -r "../${ZIP_NAME}" . -x "*.DS_Store" -x "__MACOSX/*"`, {
  stdio: 'inherit'
});

// Verify no console statements remain
console.log('\nVerifying build...');
const filesToCheck = [
  'background/service-worker.js',
  'content/content.js',
  'content/inject-id.js',
  'popup/popup.js'
];

let hasConsole = false;
filesToCheck.forEach(file => {
  const content = fs.readFileSync(path.join(BUILD_DIR, file), 'utf8');
  const matches = content.match(/console\.(log|warn|error)/g);
  if (matches) {
    console.log(`  ⚠️  ${file}: ${matches.length} console statement(s) remaining`);
    hasConsole = true;
  } else {
    console.log(`  ✓ ${file}: clean`);
  }
});

console.log('\n' + '='.repeat(50));
console.log('✅ Production build complete!');
console.log(`📦 Output: ${zipPath}`);
console.log('='.repeat(50));

console.log(`
Next steps:
1. Go to https://chrome.google.com/webstore/devconsole
2. Click 'New Item' or update existing
3. Upload ${ZIP_NAME}
4. Fill in store listing details from store-assets/
5. Add screenshots (see screenshot-descriptions.txt)
6. Submit for review
`);

if (hasConsole) {
  console.log('⚠️  Warning: Some console statements could not be removed.');
  console.log('   Review the files manually if needed.\n');
}
