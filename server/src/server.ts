import express, { Request, Response } from 'express';
import sqlite3 from 'sqlite3';
import bodyParser from 'body-parser';
import cors from 'cors';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3001;

app.use(bodyParser.json());
app.use(cors());

const COUNTRY = process.env.COUNTRY;
console.log('COUNTRY:', COUNTRY); // Debug the COUNTRY variable

const dbPath = path.resolve(__dirname, 'visa_stats.db');
const xlsxFilePath = path.resolve(__dirname, 'stats_visa.xlsx');
console.log(xlsxFilePath);

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

interface VisaStat {
  id?: number;
  city: string;
  visa_application_date: string;
  visa_issue_date: string;
  waiting_days: number;
  travel_purpose: string;
  planned_travel_date: string;
  additional_doc_request: boolean;
  tickets_purchased: boolean;
  hotels_purchased: boolean;
  employment_certificate: string;
  financial_guarantee: number;
  comments: string;
  visa_center: string;
  visa_status: string;
  visa_issued_for_days: number;
  corridor_days: number;
  past_visas_trips: string;
  consul: string;
  planned_stay_in_italy: string;
}

app.post('/api/visa-stats', (req: Request, res: Response) => {
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
      return res.status(500).json({ error: err.message });
    }

    db.all(`SELECT * FROM visa_stats`, [], (err, rows: VisaStat[]) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Visa');
      XLSX.writeFile(workbook, xlsxFilePath);

      res.json({ id: this.lastID, waiting_days });
    });
  });
});

app.get('/api/visa-stats', (req: Request, res: Response) => {
  db.all(`SELECT * FROM visa_stats`, [], (err, rows: VisaStat[]) => {
    console.log("Error:", err);
    console.log("Rows fetched:", rows);
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.get('/api/export', (req: Request, res: Response) => {
  if (fs.existsSync(xlsxFilePath)) {
    res.download(xlsxFilePath, `${COUNTRY}_visa_statistics_${new Date().toISOString().split('T')[0]}.xlsx`, (err: Error) => {
      if (err) {
        res.status(500).send("Error downloading file");
      }
    });
  } else {
    res.status(404).send("File not found");
  }
});

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
