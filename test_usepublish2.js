const fs = require('fs');
const content = fs.readFileSync('node_modules/agora-rtc-react/dist/agora-rtc-react.js', 'utf8');
const regex = /function M8\((.*?)\)\s*\{([\s\S]*?)\}/;
const match = regex.exec(content);
if (match) console.log(match[0]);
else console.log("Not found M8");
