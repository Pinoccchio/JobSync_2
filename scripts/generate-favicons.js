/**
 * Generate Favicon Files from JS-logo.png
 *
 * This script converts the Municipality of Asuncion logo (JS-logo.png)
 * into various favicon formats needed for web and mobile.
 * Uses the transparent PNG version for better quality.
 *
 * Run: node scripts/generate-favicons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '../public/JS-logo.png');
const publicDir = path.join(__dirname, '../public');

async function generateFavicons() {
  console.log('🎨 Generating favicon files from JS-logo.png (transparent background)...\n');

  try {
    // Check if JS-logo.png exists
    if (!fs.existsSync(inputFile)) {
      throw new Error('JS-logo.png not found in public directory!');
    }

    // 1. Generate favicon.ico (48x48 for better quality)
    console.log('📦 Creating favicon.ico (48x48)...');
    await sharp(inputFile)
      .resize(48, 48, { fit: 'cover', position: 'center' })
      .toFile(path.join(publicDir, 'favicon.ico'));
    console.log('✅ favicon.ico created');

    // 2. Generate apple-touch-icon.png (180x180 for iOS)
    console.log('📱 Creating apple-touch-icon.png (180x180)...');
    await sharp(inputFile)
      .resize(180, 180, { fit: 'cover', position: 'center' })
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));
    console.log('✅ apple-touch-icon.png created');

    // 3. Generate icon-192.png (192x192 for PWA)
    console.log('📲 Creating icon-192.png (192x192)...');
    await sharp(inputFile)
      .resize(192, 192, { fit: 'cover', position: 'center' })
      .png()
      .toFile(path.join(publicDir, 'icon-192.png'));
    console.log('✅ icon-192.png created');

    // 4. Generate icon.png (512x512 for PWA/Android)
    console.log('🤖 Creating icon.png (512x512)...');
    await sharp(inputFile)
      .resize(512, 512, { fit: 'cover', position: 'center' })
      .png()
      .toFile(path.join(publicDir, 'icon.png'));
    console.log('✅ icon.png created');

    console.log('\n🎉 All favicon files generated successfully!');
    console.log('\n📁 Generated files:');
    console.log('   - public/favicon.ico (48x48)');
    console.log('   - public/apple-touch-icon.png (180x180)');
    console.log('   - public/icon-192.png (192x192)');
    console.log('   - public/icon.png (512x512)');
    console.log('\n✨ Your Municipality of Asuncion logo is now ready!');
    console.log('   Restart your dev server to see the changes.');

  } catch (error) {
    console.error('❌ Error generating favicons:', error.message);
    process.exit(1);
  }
}

// Run the script
generateFavicons();
