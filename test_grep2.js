const fs = require('fs');
const content = fs.readFileSync('node_modules/agora-rtc-sdk-ng/AgoraRTC_N-production.js', 'utf8');
const regex = /"id"/g;
let match;
while ((match = regex.exec(content)) !== null) {
  const snippet = content.substring(Math.max(0, match.index - 50), match.index + 50);
  if (snippet.includes('[0, 65535]') || snippet.includes('0') || snippet.includes('65535') || snippet.includes('XN')) {
    console.log(snippet);
  }
}
