const Database = require("better-sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "database.db");
const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS UsersTable(
    UserID INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    Username TEXT UNIQUE NOT NULL,
    Password TEXT NOT NULL,
    JoinDate DATE NOT NULL,
    Role TEXT NOT NULL,
    Token TEXT
);

CREATE TABLE IF NOT EXISTS PlaylistsTable (
    PlaylistID INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    Title TEXT NOT NULL,
    Channel TEXT NOT NULL,
    Duration TEXT,
    StartTime TEXT,
    EndTime TEXT,
    SubmittedBy TEXT,
    VideoURL TEXT
);

CREATE TABLE IF NOT EXISTS AdBreaksTable(
    AdBreakID INTEGER PRIMARY KEY AUTOINCREMENT,
    AdBreakTitle TEXT NOT NULL,
    SubmittedBy TEXT NOT NULL,
    AdBreakText TEXT NOT NULL,
    AdBreakURL TEXT NOT NULL,
    Status TEXT NOT NULL
);

`);
console.log("Database connected and tables created successfully.");
module.exports = db;
