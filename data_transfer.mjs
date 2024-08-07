import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set the path for the SQLite database file
const dbPath = path.resolve(__dirname, 'server/src/visa_stats.db');

// Initialize SQLite database
const db = new sqlite3.Database(dbPath);

// Path to the CSV file
const csvFilePath = path.resolve(__dirname, 'stats_visa.csv')

// Function to insert data into the database
const insertData = (data) => {
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

    const stmt = db.prepare(`INSERT INTO visa_stats (
      city, visa_application_date, visa_issue_date, waiting_days, travel_purpose, planned_travel_date,
      additional_doc_request, tickets_purchased, hotels_purchased, employment_certificate,
      financial_guarantee, comments, visa_center, visa_status, visa_issued_for_days,
      corridor_days, past_visas_trips, consul, planned_stay_in_italy
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    data.forEach((row) => {
      stmt.run(
        row.city,
        row.visa_application_date,
        row.visa_issue_date,
        row.waiting_days,
        row.travel_purpose,
        row.planned_travel_date,
        row.additional_doc_request.toLowerCase() === 'true',
        row.tickets_purchased.toLowerCase() === 'true',
        row.hotels_purchased.toLowerCase() === 'true',
        row.employment_certificate,
        parseFloat(row.financial_guarantee),
        row.comments,
        row.visa_center,
        row.visa_status,
        parseInt(row.visa_issued_for_days),
        parseInt(row.corridor_days),
        row.past_visas_trips,
        row.consul,
        row.planned_stay_in_italy
      );
    });

    stmt.finalize();
  });

  db.close();
};

// Read the CSV file and process data
const data = [];
fs.createReadStream(csvFilePath)
  .pipe(csv({ separator: ';' })) // Set the correct delimiter
  .on('data', (row) => {
    data.push(row);
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
    insertData(data);
  })
  .on('error', (error) => {
    console.error('Error reading CSV file:', error);
  });
