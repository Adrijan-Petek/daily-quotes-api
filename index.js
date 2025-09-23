const express = require('express');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;
const DB = 'quotes.db';

// simple in-memory quotes fallback
const defaultQuotes = [
  "Keep going. Everything you need will come to you at the perfect time.",
  "Small steps every day.",
  "Be kind to yourself."
];

app.get('/quote', (req, res) => {
  res.json({ quote: defaultQuotes[Math.floor(Math.random()*defaultQuotes.length)] });
});

app.get('/', (req, res) => res.send('Daily Quotes API - GET /quote'));

app.listen(port, ()=> console.log('Listening on', port));
