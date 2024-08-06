import express from 'express';
import sqlite3 from 'sqlite3';
import bodyParser from 'body-parser';
import cors from 'cors';
import * as XLSX from 'xlsx';
import path from 'path';

const app = express();
const port = process.env.PORT_BACKEND;

app.use(bodyParser.json());
app.use(cors());

// Set the path for the SQLite database file
const dbPath = path.resolve(__dirname, 'visa_stats.db');

// Initialize SQLite database
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS visa_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city TEXT,
    visa_application_date TEXT,
    visa_issue_date TEXT,
    waiting_days INTEGER,
    travel_purpose TEXT,
    planned_travel_date TEXT,
    additional_doc_request BOOLEAN,
    tickets_purchased BOOLEAN,
    hotels_purchased BOOLEAN,
    employment_certificate TEXT,
    financial_guarantee REAL,
    comments TEXT,
    visa_center TEXT,
    visa_status TEXT,
    visa_issued_for_days INTEGER,
    corridor_days INTEGER,
    past_visas_trips TEXT,
    consul TEXT,
    planned_stay_in_italy TEXT
  )`);
});

app.post('/api/visa-stats', (req, res) => {
  const {
    city, visa_application_date, visa_issue_date, travel_purpose, planned_travel_date,
    additional_doc_request, tickets_purchased, hotels_purchased, employment_certificate,
    financial_guarantee, comments, visa_center, visa_status, visa_issued_for_days,
    corridor_days, past_visas_trips, consul, planned_stay_in_italy
  } = req.body;

  const waiting_days = Math.ceil(
    (new Date(visa_issue_date).getTime() - new Date(visa_application_date).getTime()) / (1000 * 60 * 60 * 24)
  );

  db.run(`INSERT INTO visa_stats (
    city, visa_application_date, visa_issue_date, waiting_days, travel_purpose, planned_travel_date,
    additional_doc_request, tickets_purchased, hotels_purchased, employment_certificate,
    financial_guarantee, comments, visa_center, visa_status, visa_issued_for_days,
    corridor_days, past_visas_trips, consul, planned_stay_in_italy
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    city, visa_application_date, visa_issue_date, waiting_days, travel_purpose, planned_travel_date,
    additional_doc_request, tickets_purchased, hotels_purchased, employment_certificate,
    financial_guarantee, comments, visa_center, visa_status, visa_issued_for_days,
    corridor_days, past_visas_trips, consul, planned_stay_in_italy
  ], function(err) {
    if (err) {
      return console.log(err.message);
    }
    res.json({ id: this.lastID, waiting_days });
  });
});

app.get('/api/visa-stats', (req, res) => {
  db.all(`SELECT * FROM visa_stats`, [], (err, rows) => {
    if (err) {
      throw err;
    }
    res.json(rows);
  });
});

app.get('/api/export', (req, res) => {
  db.all(`SELECT * FROM visa_stats`, [], async (err, rows) => {
    if (err) {
      res.status(500).send("Error fetching data");
      return;
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Visa Stats');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="visa_stats.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  });
});

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
