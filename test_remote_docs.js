const fs = require('fs');
const content = fs.readFileSync('node_modules/agora-rtc-react/dist/agora-rtc-react.d.ts', 'utf8');
const lines = content.split('\n');
let found = false;
for(let i=0; i<lines.length; i++) {
  if (lines[i].includes('function RemoteUser')) {
     console.log(lines.slice(i-20, i+5).join('\n'));
     break;
  }
}
