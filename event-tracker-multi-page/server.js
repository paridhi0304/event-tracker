require('dotenv').config();  // Now using .env for DB creds (see below)
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
app.use(cors({
  origin: 'http://localhost:3000'  // Allow browser from same origin
}));
app.use(express.json());
app.use(express.static('public'));  // Serves HTML from public/ folder

// MySQL connection (now from .env)
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',  // Use .env.DB_PASSWORD
  database: process.env.DB_NAME || 'event_tracker'
});

db.connect((err) => {
  if (err) {
    console.error('❌ MySQL connection failed:', err.message);
    return;
  }
  console.log('✅ MySQL connected!');
});

// Firebase Admin (updated with DB URL)
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DB_URL  // From .env!
});
console.log('✅ Firebase Admin initialized!');

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Event Tracker API is running!' });
});

// Create event (with validation)
app.post('/events', (req, res) => {
  console.log('POST /events hit with body:', req.body);
  const { name, date } = req.body;
  if (!name || !date) {
    return res.status(400).json({ error: 'Name and date are required!' });
  }
  const query = 'INSERT INTO events (name, date) VALUES (?, ?)';
  db.query(query, [name, date], async (err, result) => {  // Async callback
    if (err) {
      console.error('DB insert error:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Event added with ID:', result.insertId);

    // Sync to Firebase
    try {
      const newEvent = { id: result.insertId, name, date, created_at: new Date().toISOString() };
      const firebaseDb = admin.database();
      await firebaseDb.ref('events').push(newEvent);  // Push creates unique key
      console.log('🔥 Synced to Firebase:', newEvent);
    } catch (fbErr) {
      console.error('Firebase sync error:', fbErr);
      // Don't fail the response—MySQL succeeded
    }

    res.json({ id: result.insertId, message: 'Event created!' });
  });
});

// Get all events (FIXED SYNTAX + explicit fields)
app.get('/events', (req, res) => {
  console.log('GET /events hit');  // Debug log
  db.query('SELECT id, name, date, created_at FROM events ORDER BY created_at DESC', (err, results) => {
    if (err) {
      console.error('DB fetch error:', err);  // Debug log
      return res.status(500).json({ error: err.message });
    }
    console.log('Fetched events:', results.length);  // Debug log
    res.json(results);
  });
});

// Delete event
app.delete('/events/:id', (req, res) => {
  const { id } = req.params;
  console.log('DELETE /events', id);
  const query = 'DELETE FROM events WHERE id = ?';
  db.query(query, [id], async (err, result) => {
    if (err || result.affectedRows === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    console.log('🗑️ Deleted from MySQL:', id);
    
    // Sync delete to Firebase
    try {
      const firebaseDb = admin.database();
      const snapshot = await firebaseDb.ref('events').once('value');
      const events = snapshot.val();
      for (let key in events) {
        if (events[key].id == id) {
          await firebaseDb.ref('events').child(key).remove();
          console.log('🔥 Deleted from Firebase:', id);
          break;
        }
      }
    } catch (fbErr) {
      console.error('Firebase delete error:', fbErr);
    }
    
    res.json({ message: 'Event deleted!' });
  });
});

// Update event
app.put('/events/:id', (req, res) => {
  const { id } = req.params;
  const { name, date } = req.body;
  console.log('PUT /events', id, 'with', { name, date });
  if (!name || !date) {
    return res.status(400).json({ error: 'Name and date required!' });
  }
  const query = 'UPDATE events SET name = ?, date = ? WHERE id = ?';
  db.query(query, [name, date, id], async (err, result) => {
    if (err || result.affectedRows === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    console.log('✏️ Updated in MySQL:', id);
    
    // Sync update to Firebase
    try {
      const firebaseDb = admin.database();
      const snapshot = await firebaseDb.ref('events').once('value');
      const events = snapshot.val();
      for (let key in events) {
        if (events[key].id == id) {
          await firebaseDb.ref('events').child(key).update({ name, date });
          console.log('🔥 Updated in Firebase:', id);
          break;
        }
      }
    } catch (fbErr) {
      console.error('Firebase update error:', fbErr);
    }

    res.json({ id, message: 'Event updated!' });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
