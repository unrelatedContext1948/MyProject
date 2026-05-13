/*
comment: This file sets up the Express server for the backend of the application. 
It serves static files from the frontend directory, handles API routes for 
fetching the playlist and managing user authentication, 
and maintains a simple session state to track whether a user is logged in or not. 
The server listens for requests and responds with the appropriate data 
or HTML files based on the route accessed by the client.
*/

// Import necessary modules and initialize the Express application
const express = require("express");
const path = require("path");
const db = require("./database");
const app = express();


const frontendPath = path.join(__dirname, "..", "..", "frontend");

// Serve static files from the frontend directory
app.use("/", express.static(frontendPath));

// Define routes for serving HTML files and handling API requests
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(frontendPath, "admin.html"));
});

// API route to fetch the current playlist from the database
app.get("/api/queue", async (req, res) => {
  const sql = "SELECT * FROM PlaylistsTable";
  try {
    const rows = await db.all(sql);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

// Simple session management for demonstration purposes
let sessionLoggedIn = false;

app.post("/api/login", express.json(), async (req, res) => {
  const { username, password } = req.body;
  const sql = "SELECT * FROM AuthorizedUsersTable WHERE Username = ? AND Password = ?";
  try {
    const row = await db.get(sql, [username, password]);
    if (row) {
      sessionLoggedIn = true;
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false });
    }
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

app.get("/api/user", (req, res) => {
  res.json({
    isLoggedIn: sessionLoggedIn,
    username: "User",
    role: "Admin",
  });
});

// The logout route resets the session state to log the user out
app.post("/api/logout", (req, res) => {
  sessionLoggedIn = false;
  res.json({ success: true });
});

module.exports = app;