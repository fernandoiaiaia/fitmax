const fs = require('fs');
const path = require('path');
function search(dir) {
  const files = fs.readdirSync(dir);
  for (let f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) search(full);
    else if (full.endsWith('.js') || full.endsWith('.ts')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('value range is')) {
        console.log("FOUND IN", full);
        const idx = content.indexOf('value range is');
        console.log(content.substring(Math.max(0, idx - 50), idx + 50));
      }
    }
  }
}
search('node_modules/agora-rtc-sdk-ng');
