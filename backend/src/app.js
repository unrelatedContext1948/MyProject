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
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const adbreakRoutes = require("./routes/adbreak");
const streamState = require("./services/streamState");
const app = express();
const PlaylistModel = require("./models/playlistModel");
const { authenticate } = require("./middleware/authorization");
const { getVideoInfo } = require("./services/youtube");
const { url } = require("inspector");

const frontendPath = path.join(__dirname, "..", "..", "frontend");

// Serve static files from the frontend directory
app.use("/", express.static(frontendPath));

// Use the authentication routes defined in routes/auth.js for any requests to /api/auth
app.use("/api/auth", authRoutes);

// User management route
app.use("/api/users", express.json(), userRoutes);

// Ad break routes
app.use("/api/adbreaks", adbreakRoutes);

// Define routes for serving HTML files and handling API requests
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(frontendPath, "admin.html"));
});

// API route to fetch the current playlist from the database
app.get("/api/queue", (req, res) => {
  PlaylistModel.getSongsInPlaylist();
  try {
    const songs = PlaylistModel.getSongsInPlaylist();
    res.json(songs);
  } catch (err) {
    console.error("Error fetching queue:", err);
    res.status(500).json({ error: "Failed to fetch queue" });
  }
});

// API route to submit a new track to the queue, protected by authentication middleware
app.post("/api/queue/submit", express.json(), authenticate, async (req, res) => {
  const { VideoURL } = req.body;
 
  if (!VideoURL) {
    return res.status(400).json({ error: "VideoURL is required" });
  }
 
  try {
    const videoInfo = await getVideoInfo(VideoURL);
    PlaylistModel.addSongToPlaylist({
      Title: videoInfo.title,
      Channel: videoInfo.channel,
      Duration: videoInfo.duration,
      VideoURL: videoInfo.videoURL,
      SubmittedBy: req.user.username,
    });
     //Refresh the backend copy of the queue
    // Ensures streamState has the latest queue information after a new vid is added
    streamState.refreshQueue();
    // Allows app.js routes to broadcast real-time events
    const io = req.app.get("io");
    // notify all connected clients that queue has changed
    // users can see new vids added without refreshing the queue
    io.emit("queueUpdated", {
      message: "Queue updated"
    });

    res.status(201).json({ message: "Song added to queue" });
  } catch (err) {
    console.error("Error adding song:", err);
    res.status(500).json({ error: "Failed to add song" });
  }
});

// API route to get the current user's information, protected by authentication middleware
app.get("/api/user/me", authenticate, (req, res) => {
  res.json({
    isLoggedIn: true,
    username: req.user.username,
    role: req.user.role,
  });
});
module.exports = app;
