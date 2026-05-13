/*
This file deals with the database connection and provides asynchronous methods for querying the SQLite database.
It uses the sqlite3 library to interact with the database and wraps the callback-based methods in Promises for easier async/await usage in the rest of the application. 
The database file is located in the parent directory under "database/database.db". 
The exported object provides three methods: all, get, and run, which correspond to the standard SQLite operations for fetching multiple rows, fetching a single row, and executing a query without returning data, respectively.
*/

const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "..", "database", "database.db");
const db = new sqlite3.Database(dbPath);

// Wrap the sqlite3 methods in Promises for easier async/await usage
const dbAsync = {
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  // The get method fetches a single row from the database based on the provided SQL query and parameters
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  // The run method executes a SQL query that does not return data (e.g., INSERT, UPDATE, DELETE) and resolves with the context of the operation
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  },
};
// Export the dbAsync object for use in other parts of the application
module.exports = dbAsync;