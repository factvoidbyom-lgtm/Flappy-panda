import fs from 'fs';
import path from 'path';

const srcLogo = './src/assets/images/panda_flap_logo_1782813212938.jpg';
const destDir = './assets';

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Copy to icon.png and splash.png (even though source is JPEG, Capacitor Assets tool can parse JPEG files and convert them)
fs.copyFileSync(srcLogo, path.join(destDir, 'icon.png'));
fs.copyFileSync(srcLogo, path.join(destDir, 'splash.png'));

console.log('Successfully copied logo to assets/icon.png and assets/splash.png!');
