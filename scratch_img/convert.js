const sharp = require('sharp');
const inPath = '/Users/mwtech/.gemini/antigravity-ide/brain/6d4d2e4b-4d58-41d8-8b31-8548edea8b52/health_favicon_1780687896268.png';
const outPath = '/Users/mwtech/.gemini/antigravity-ide/brain/6d4d2e4b-4d58-41d8-8b31-8548edea8b52/health_favicon_transparent.png';

async function run() {
  const { data, info } = await sharp(inPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i] > 240 && data[i+1] > 240 && data[i+2] > 240) {
      data[i+3] = 0; // Alpha
    }
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .png()
    .toFile(outPath);
  console.log('Done sharp with ensureAlpha');
}
run();
