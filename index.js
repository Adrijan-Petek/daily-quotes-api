const express = require('express');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;
const DB = 'quotes.db';

// Simple in-memory quotes fallback
const defaultQuotes = [
  "Keep going. Everything you need will come to you at the perfect time.",
  "Small steps every day.",
  "Be kind to yourself."
];

// Endpoint to get a random quote
app.get('/quote', (req, res) => {
  const quote = defaultQuotes[Math.floor(Math.random() * defaultQuotes.length)];
  res.json({ quote });
});

// Root endpoint
app.get('/', (req, res) => res.send('Daily Quotes API - GET /quote'));

// Start server
app.listen(port, () => console.log(`Listening on port ${port}`));
