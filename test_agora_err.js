const fs = require('fs');
const content = fs.readFileSync('node_modules/agora-rtc-sdk-ng/AgoraRTC_N-production.js', 'utf8');
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('the value range is')) {
    console.log(`Line ${i}: ${lines[i].substring(0, 1000)}`);
  }
}
