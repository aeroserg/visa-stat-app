import sqlite3 from 'sqlite3';
import path from 'path';
import { createObjectCsvWriter } from 'csv-writer';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set the path for the SQLite database file and CSV file
const dbPath = path.resolve(__dirname, 'server/src/visa_stats.db');
const csvFilePath = path.resolve(__dirname, 'stats_visa.csv');

// Initialize SQLite database
const db = new sqlite3.Database(dbPath);

// Define CSV writer
const csvWriter = createObjectCsvWriter({
  path: csvFilePath,
  header: [
    { id: 'city', title: 'city' },
    { id: 'visa_application_date', title: 'visa_application_date' },
    { id: 'visa_issue_date', title: 'visa_issue_date' },
    { id: 'waiting_days', title: 'waiting_days' },
    { id: 'travel_purpose', title: 'travel_purpose' },
    { id: 'planned_travel_date', title: 'planned_travel_date' },
    { id: 'additional_doc_request', title: 'additional_doc_request' },
    { id: 'tickets_purchased', title: 'tickets_purchased' },
    { id: 'hotels_purchased', title: 'hotels_purchased' },
    { id: 'employment_certificate', title: 'employment_certificate' },
    { id: 'financial_guarantee', title: 'financial_guarantee' },
    { id: 'comments', title: 'comments' },
    { id: 'visa_center', title: 'visa_center' },
    { id: 'visa_status', title: 'visa_status' },
    { id: 'visa_issued_for_days', title: 'visa_issued_for_days' },
    { id: 'corridor_days', title: 'corridor_days' },
    { id: 'past_visas_trips', title: 'past_visas_trips' },
    { id: 'consul', title: 'consul' },
    { id: 'planned_stay_in_italy', title: 'planned_stay_in_italy' },
  ],
  fieldDelimiter: ';', // Use semicolon as the field delimiter
});

// Function to fetch data from the database and write to CSV
const backupDataToCSV = () => {
  db.serialize(() => {
    db.all('SELECT * FROM visa_stats', (err, rows) => {
      if (err) {
        console.error('Error fetching data from database:', err);
        return;
      }

      // Write data to CSV file
      csvWriter.writeRecords(rows)
        .then(() => {
          console.log('Data successfully written to CSV file');
         
        })
        .catch((error) => {
          console.error('Error writing data to CSV file:', error);
          throw new Error('Error writing data to CSV file:', error)
        });
    });
  });

  db.close();
};

// Execute the backup function
backupDataToCSV();
