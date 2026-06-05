const fs = require('fs');
const content = fs.readFileSync('node_modules/agora-rtc-sdk-ng/AgoraRTC_N-production.js', 'utf8');
const regex = /ZN\(e\.id,"id",0,65535,!0\)/g;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log(content.substring(Math.max(0, match.index - 200), match.index + 200));
}
