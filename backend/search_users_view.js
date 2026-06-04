const fs = require('fs');
const content = fs.readFileSync('c:/Users/venky/Desktop/CodeAurora_Sentinel AI/AI_Automated_Code_Review_System/frontend/src/pages/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

let start = -1;
let end = -1;
lines.forEach((line, idx) => {
  if (line.includes('function UsersView')) {
    start = idx;
  }
  if (start !== -1 && end === -1 && line.includes('function RepositoriesView')) {
    end = idx;
  }
});

console.log(`UsersView is from line ${start + 1} to ${end}`);
if (start !== -1 && end !== -1) {
  for (let i = start; i < end; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
