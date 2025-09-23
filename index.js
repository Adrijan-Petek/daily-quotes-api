// index.js
const fs = require('fs');
const path = require('path');

// Quotes array
const quotes = [
  "Keep going. Everything you need will come to you at the perfect time.",
  "Small steps every day.",
  "Be kind to yourself.",
  "Believe in yourself and all that you are.",
  "Progress, not perfection.",
  "Every day is a fresh start.",
  "You are capable of amazing things."
];

// Pick a random quote
const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

// Print to console
console.log("🌟 Today's quote:", randomQuote);

// Optional: save quote to a file (can be used for record or further workflow steps)
const outputFile = path.join(__dirname, 'latest-quote.txt');
fs.writeFileSync(outputFile, randomQuote + '\n', 'utf8');
console.log(`Saved quote to ${outputFile}`);

