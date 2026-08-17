import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import * as db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Validation helpers
function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

function isValidFutureDate(dateStr) {
  const selectedDate = new Date(dateStr);
  const now = new Date();
  return !isNaN(selectedDate.getTime()) && selectedDate >= now;
}

// --- DONOR ROUTES ---

// Create Donor
app.post('/api/donors', async (req, res) => {
  const { name, email, blood_group, contact, location, notes } = req.body;

  if (!name || !email || !blood_group || !contact || !location) {
    return res.status(400).json({ error: 'Please enter all required fields.' });
  }

  if (!isValidPhone(contact)) {
    return res.status(400).json({ error: 'Phone number must be 10 digits starting with 6-9.' });
  }

  try {
    const result = await db.run(
      `INSERT INTO donors (name, email, blood_group, contact, location, available, notes) VALUES (?, ?, ?, ?, ?, 1, ?)`,
      [name, email, blood_group, contact, location, notes || '']
    );
    res.status(201).json({ id: result.id, message: 'Donor registered!' });
   } catch (err) {
  console.error('DONOR INSERT ERROR:', err);

  if (err.message.includes('UNIQUE')) {
    return res.status(400).json({ error: 'Email already registered.' });
  }

  res.status(500).json({
    error: 'Database error.',
    details: err.message
  });
}
});

// Donor Login
app.post('/api/donors/login', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required.' });

  try {
    const donor = await db.get(`SELECT * FROM donors WHERE email = ?`, [email]);
    if (!donor) return res.status(404).json({ error: 'Donor profile not found.' });
    res.json(donor);
  } catch (err) {
    res.status(500).json({ error: 'Database error.' });
  }
});

// Get Only Available Donors
app.get('/api/donors', async (req, res) => {
  const { blood_group, location } = req.query;
  let sql = `SELECT id, name, blood_group, location, available, notes FROM donors WHERE available = 1`;
  const params = [];

  if (blood_group) {
    sql += ` AND blood_group = ?`;
    params.push(blood_group);
  }
  if (location) {
    sql += ` AND location LIKE ?`;
    params.push(`%${location}%`);
  }

  try {
    const donors = await db.query(sql, params);
    res.json(donors);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching donors.' });
  }
});

// Update Donor Info / Availability
app.put('/api/donors/:id', async (req, res) => {
  const { name, blood_group, contact, location, available, notes } = req.body;

  try {
    await db.run(
      `UPDATE donors SET name=?, blood_group=?, contact=?, location=?, available=?, notes=? WHERE id=?`,
      [name, blood_group, contact, location, available ? 1 : 0, notes, req.params.id]
    );
    res.json({ message: 'Donor profile updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update donor.' });
  }
});

// Delete Donor Record
app.delete('/api/donors/:id', async (req, res) => {
  try {
    await db.run(`DELETE FROM donors WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Donor removed.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete donor.' });
  }
});

// --- EMERGENCY REQUEST ROUTES ---

// Create Emergency Request
app.post('/api/requests', async (req, res) => {
  const { patient_name, blood_group, quantity, hospital, location, required_by, contact, description } = req.body;

  if (!patient_name || !blood_group || !quantity || !hospital || !location || !required_by || !contact) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (!isValidPhone(contact)) {
    return res.status(400).json({ error: 'Contact phone must be 10 digits.' });
  }

  if (!isValidFutureDate(required_by)) {
    return res.status(400).json({ error: 'Date and time cannot be in the past.' });
  }

  try {
    const result = await db.run(
      `INSERT INTO requests (patient_name, blood_group, quantity, hospital, location, required_by, contact, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [patient_name, blood_group, quantity, hospital, location, required_by, contact, description || '']
    );
    res.status(201).json({ id: result.id, message: 'Request created.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save request.' });
  }
});

// Get Requests
app.get('/api/requests', async (req, res) => {
  try {
    const requests = await db.query(`SELECT * FROM requests ORDER BY id DESC`);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Error getting requests.' });
  }
});

// Get Single Request
app.get('/api/requests/:id', async (req, res) => {
  try {
    const request = await db.get(`SELECT * FROM requests WHERE id = ?`, [req.params.id]);
    if (!request) return res.status(404).json({ error: 'Request not found.' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: 'Error reading request.' });
  }
});

// Update Request Status
app.patch('/api/requests/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    await db.run(`UPDATE requests SET status = ? WHERE id = ?`, [status, req.params.id]);
    res.json({ message: 'Status changed.' });
  } catch (err) {
    res.status(500).json({ error: 'Status update failed.' });
  }
});

// Delete Emergency Request from Database
app.delete('/api/requests/:id', async (req, res) => {
  try {
    const result = await db.run(`DELETE FROM requests WHERE id = ?`, [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Request not found.' });
    res.json({ message: 'Emergency request deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Database delete failed.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});