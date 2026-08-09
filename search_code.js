const fs = require("fs");
const path = require("path");

const content = fs.readFileSync(path.join(__dirname, "backend/index.js"), "utf8");
const lines = content.split("\n");

console.log("Searching for 'fetchFileContent' in index.js...");
lines.forEach((line, index) => {
  if (line.includes("function fetchFileContent") || line.includes("const fetchFileContent")) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
