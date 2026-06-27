/* 
Starts the HumanMusic backend server and attaches Socket.io to enable
real-time communication between server and all connected clients.
use of Socket.IO
1. synchronizing the current stream across clients
2. broadcasting queue updates when new videos are submitted
3. notifying clients when the currently playing content changes
*/

//Start Server
const app = require("./src/app");
const http = require("http");
const { Server } = require("socket.io");

const streamState = require("./src/services/streamState");
const masterClock = require("./src/services/masterClock");

const PORT = 3000; //typically for Node-Servers

// Create HTTP server from Express app
// Socket.io must attach to the HTTP server in order to support WebSocket communication
const server = http.createServer(app);

// Attach Socket.IO to the HTTP server
/* This allows the backend to broadcast real-time updates
   such as stream synchronization and queue changes */
// cors allows client from different origins (e.g live server) to establish socket.io connections during development
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
//Make the socket.io instance available inside app.js routes
app.set("io", io);

// Pre-load the queue before anyone connects
streamState.loadQueue();

// Start the 15-minute ad-break timer
masterClock.start();

// Forward master-clock events to every connected client
masterClock.on("adBreakStart", (adBreak) => {
  console.log("[Socket] Broadcasting adBreakStart");
  io.emit("adBreakStart", adBreak);
});

masterClock.on("adBreakEnd", () => {
  console.log("[Socket] Broadcasting adBreakEnd");
  io.emit("adBreakEnd");
});


//  Problem: Too many videoEnded events at the same time from differnt clients
//  Solution: We need to first check if the reportedIndex equals the currentIndex
//  and also if the reported Index is the same as the nextIndexToAppear
//  Therefore we define the start of our new index named nextIndexToAppear
let nextIndexToAppear = -1;

// Listen for new client connections
// Each client receives the current stream state when it connects
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  // Send the currently playing video, queue index,and approximate playback time to newly connected clients.
  socket.emit("currentStream", streamState.getCurrentStream());
  // When the frontend notifies the server that the current video has ended, the stream advances and all connected clients are updated
  socket.on("videoEnded", (reportedIndex) => {
    console.log(
      "videoEnded received from:",
      socket.id,
      "reportedIndex:",
      reportedIndex,
    );
    // first check: was the song playing before?
    if (reportedIndex === nextIndexToAppear) {
      console.log(
        "videoEnded ignored – already updated past index",
        reportedIndex,
      );
      return;
    }
    // second check: is the playing song actual?
    const current = streamState.getCurrentStream(); 
    if (reportedIndex !== current.currentIndex) {
      console.log(
        "videoEnded ignored – stte index",
        reportedIndex,
        "current is",
        current.currentIndex,
      );
      return;
    }
    lastIndexToAppear = reportedIndex;
    const nextStream = streamState.moveToNextVideo();
    io.emit("videoChanged", nextStream);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Start server
// changed from app.listen --> server.listen
// this change is because Socket.io is attached to the server.
server.listen(PORT, (err) => {
  if (err) {
    console.log("The Server did not start:", err);
  }

  console.log(`The Server is running on http://localhost:${PORT}`);
});
