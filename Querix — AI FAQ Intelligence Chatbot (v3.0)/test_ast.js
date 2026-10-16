const fs = require('fs');

const code = fs.readFileSync('frontend/app.js', 'utf8');

// Check for syntax errors
try {
  new Function(code);
  console.log("Syntax is 100% VALID!");
} catch (e) {
  console.error("SYNTAX ERROR in app.js:", e.message);
  process.exit(1);
}

// Check for duplicate let/const in the same scope
// or anything that throws immediately
console.log("Code length:", code.length);
