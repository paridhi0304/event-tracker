
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection (update password)
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Ironman3@love',
  database: 'event_tracker'
});

db.connect((err) => {
  if (err) {
    console.error('❌ MySQL connection failed:', err.message);
    return;
  }
  console.log('✅ MySQL connected!');
});

// Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
console.log('✅ Firebase Admin initialized!');

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Event Tracker API is running!' });
});

// Create event
app.post('/events', (req, res) => {
  const { name, date } = req.body;
  const query = 'INSERT INTO events (name, date) VALUES (?, ?)';
  db.query(query, [name, date], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: result.insertId, message: 'Event created!' });
  });
});

// Get all events
app.get('/events', (req, res) => {
  db.query('SELECT * FROM events', (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

