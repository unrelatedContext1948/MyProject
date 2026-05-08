//1. Import: download all needed tools
const express = require("express"); //Framework to create a server
const path = require("path"); //Tool to work with file- and folder-paths
const db = require("./database"); //importing the database-connection
const app = express(); //create an instance of the express-framework

//2. goes from the actual folder to the frontend's folder
const frontendPath = path.join(__dirname, "..", "..", "frontend");

//3. static-files should also be available for the WWebsite
app.use("/", express.static(frontendPath));

//4. Routing: what should happen for each URL?
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(frontendPath, "admin.html"));
});

//API-Endpoints: these are the URLs that the frontend can call to get data from the backend
app.get("/api/queue", (req, res) => {
  const sql = "SELECT * FROM PlaylistsTable";

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("PLaylist's error:", err.message);
      return res.status(500).json({ error: "Error while loading playlists" });
    }
    res.json(rows);
  });
});

//API-Endpoint: get all ads from the database
app.get("/api/ads", (req, res) => {
  const sql = "SELECT * FROM AdBreaksTable";

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Ads error:", err.message);
      return res.status(500).json({ error: "Error while loading ads" });
    }
    res.json(rows);
  });
});

//API-Endpoint: login, check if the user is authorized
app.post("/api/login", express.json(), (req, res) => {
  const { username } = req.body;
  const sql = "SELECT * FROM AuthorizedUsersTable WHERE username = ?";

  db.get(sql, [username], (err, row) => {
    if (err) {
      console.error("Login error:", err.message);
      return res.status(500).json({ error: "Error while checking login" });
    }
    if (row) {
      res.json({ success: true, message: "Willkommen!" });
    } else {
      res.status(401).json({ success: false, message: "not authorized" });
    }
  });
});

//API-Endpoint: acts like an information-Desk
app.get("/api/user", (req, res) => {
  res.json({
    isLoggedIn: true,
    username: "Admin-User",
    role: "Admin",
  });
});
module.exports = app;
