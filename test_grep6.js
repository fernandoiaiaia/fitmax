const fs = require('fs');
const content = fs.readFileSync('node_modules/agora-rtc-react/dist/agora-rtc-react.js', 'utf8');
const regex = /usePublish/g;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log(content.substring(Math.max(0, match.index - 50), match.index + 200));
}
