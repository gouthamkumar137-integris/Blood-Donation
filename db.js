import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Always use blood_donation.db from the same folder as db.js
const dbPath = path.join(__dirname, 'blood_donation.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// SELECT multiple rows
export const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// INSERT / UPDATE / DELETE
export const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          id: this.lastID,
          changes: this.changes
        });
      }
    });
  });
};

// SELECT one row
export const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Database Initialization
db.serialize(() => {

  // Donors table
  db.run(`
    CREATE TABLE IF NOT EXISTS donors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      blood_group TEXT NOT NULL,
      contact TEXT NOT NULL,
      location TEXT NOT NULL,
      available INTEGER DEFAULT 1,
      notes TEXT
    )
  `, (err) => {
    if (err) {
      console.error('Error creating donors table:', err.message);
    } else {
      console.log('Donors table ready.');
    }
  });

  // Blood requests table
  db.run(`
    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_name TEXT NOT NULL,
      blood_group TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      hospital TEXT NOT NULL,
      location TEXT NOT NULL,
      required_by TEXT NOT NULL,
      contact TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'ACTIVE'
    )
  `, (err) => {
    if (err) {
      console.error('Error creating requests table:', err.message);
    } else {
      console.log('Requests table ready.');
    }
  });

});