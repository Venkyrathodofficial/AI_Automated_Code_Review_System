const fs = require("fs");
const path = require("path");

const content = fs.readFileSync(path.join(__dirname, "index.js"), "utf8");
const lines = content.split("\n");

console.log("Searching for limits/subscriptions checks in index.js...");
lines.forEach((line, index) => {
  if (line.includes("plan_tier") || line.includes("monthly_scans_limit") || line.includes("scansLimit") || line.includes("scans_limit")) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
