require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

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

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Event Tracker API is running!' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

