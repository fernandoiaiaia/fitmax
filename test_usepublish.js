const fs = require('fs');
const content = fs.readFileSync('node_modules/agora-rtc-react/dist/agora-rtc-react.js', 'utf8');
const regex = /function M8\(/g;
let match = regex.exec(content);
if (!match) {
  const allFuncs = content.match(/function [a-zA-Z0-9_]+\([^)]*\)\s*{[^}]*publish/g);
  console.log(allFuncs ? allFuncs.slice(0, 3) : "No match");
}
