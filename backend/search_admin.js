const fs = require('fs');
const content = fs.readFileSync('c:/Users/venky/Desktop/CodeAurora_Sentinel AI/AI_Automated_Code_Review_System/frontend/src/pages/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

console.log("Searching for tabs/sub-views...");
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('tab ===') || line.toLowerCase().includes('tab ===') || line.toLowerCase().includes('section ===') || line.toLowerCase().includes('view ===') || line.toLowerCase().includes('render') || line.toLowerCase().includes('const [') || line.toLowerCase().includes('recent')) {
    if (line.includes('useState') || line.includes('tab') || line.includes('View') || line.includes('recent') || line.includes('Recent')) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  }
});
