//1. Import: download all needed tools
const express = require("express"); //Framework for the Webserver
const path = require("path"); //ensuring folderpathing
const app = express(); //create an instance of the app

//2. goes from the actual folder to the frontend's folder
const frontendPath = path.join(__dirname, "..", "..", "frontend");

//3. static-files should also be available for the WWebsite
app.use(express.static(frontendPath));

//4. Routing: what should happen for each URL?
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(frontendPath, "admin.html"));
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