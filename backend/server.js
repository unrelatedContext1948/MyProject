/* 
Starts the HumanMusic backend server and attaches Socket.io to enable
real-time communication between server and all connected clients.
use of Socket.IO
1. synchronizing the current stream across clients
2. broadcasting queue updates when new videos are submitted
3. notifying clients when the currently playing content changes
*/
let adBreakWarningTimer = null;

const { generateAdBreakNotification } = require("./src/services/tts.js");
const songAdBreak = require("./src/services/songsadbreak.js");

//Start Server
const app = require("./src/app.js");
const http = require("http");
const { Server } = require("socket.io");

const streamState = require("./src/services/streamState.js");
const masterClock = require("./src/services/masterClock.js");

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

let adBreakNotificationSent = false;
let segmentAdvanced = false;

setInterval(() => {
  if (masterClock.isAdBreaking) return;

  const stream = streamState.getCurrentStream();

  // --- AI Generated Claude (14.07.2026) BEGIN ---
  // Prompt: implement the segmentation part on the serverside because it is more reliable than recieving it on the client side
  if (stream.endSeconds !== null) {
    if (stream.remainingTime <= 0 && !segmentAdvanced) {
      segmentAdvanced = true;
      if (stream.mergedQueue[0] && stream.mergedQueue[0].type === "adbreak") {
        const nextAdBreak = streamState.peekNextAdBreak();
        streamState.advanceAdBreak();
        masterClock.triggerAdBreak(nextAdBreak);
      } else {
        const nextStream = streamState.moveToNextVideo();
        io.emit("videoChanged", nextStream);
      }
      return;
    } else if (stream.remainingTime > 0) {
      segmentAdvanced = false;
    }
  }
  // --- AI generated END ---

  if (stream.remainingTime <= 4 && stream.remainingTime > 0) {
    if (stream.mergedQueue[0] && stream.mergedQueue[0].type === "adbreak") {
      if (!adBreakNotificationSent) {
        io.emit("adBreakNotification", {
          videoUrl: "/assets/video/HumanMusic.mp4",
        });
        adBreakNotificationSent = true;
        console.log("[Server] Ad Break Notification was sent.");
      }
    }
  } else if (stream.remainingTime > 4) {
    adBreakNotificationSent = false;
  }
}, 1000);

// Forward master-clock events to every connected client
masterClock.on("adBreakStart", (adBreak) => {
  console.log("[Socket] Broadcasting adBreakStart");
  io.emit("adBreakStart", adBreak);
});

masterClock.on("adBreakEnd", (finishedAdBreak) => {
  if (finishedAdBreak && finishedAdBreak.AdBreakID) {
    songAdBreak.deletePlayedAdBreak(finishedAdBreak.AdBreakID);
  }
  console.log("[Socket] Broadcasting adBreakEnd");
  masterClock.adBreakPending = false;
  const nextStream = streamState.moveToNextVideo();
  io.emit("adBreakEnd", nextStream);
  io.emit("videoChanged", nextStream);
});

//  Problem: Too many videoEnded events at the same time from differnt clients
//  Solution: We need to first check if the reportedIndex equals the currentIndex
//  and also if the reported Index is the same as the nextIndexToAppear
//  Therefore we define the start of our new index named nextIndexToAppear
//  Observation: video pauses everytime when the index stops at 0 (through the log)
//  Problem: our reportedINdex get 0 when the queue replays, meaning the countig index will cause us a problem
//  this is because the currentIndex will be setten to 0 due to moveToNextVideo in streamState.js, when the queue finishes and this is the same index as the reported one
//  Solution: use a boolean to prevent this problem
let hasAdvancedCurrentVideo = false;

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

    // Observation: multiple videoChanged was sent after a videoEnded event during an ad break
    // Solution: check if there is an ad break
    if (masterClock.isAdBreaking) {
      console.log("videoEnded ignored – ad break in progress");
      return;
    }

    const current = streamState.getCurrentStream();
    if (reportedIndex !== current.currentIndex) {
      console.log(
        "videoEnded ignored – stale index",
        reportedIndex,
        "current is",
        current.currentIndex,
      );
      return;
    }
    // delete nextIndexToAppear because it has caused problem and replce it with this boolean condition
    if (hasAdvancedCurrentVideo) {
      console.log(
        "videoEnded ignored – already advanced past index",
        reportedIndex,
      );
      return;
    }
    hasAdvancedCurrentVideo = true;

    if (current.mergedQueue[0] && current.mergedQueue[0].type === "adbreak") {
      const nextAdBreak = streamState.peekNextAdBreak();
      streamState.advanceAdBreak();
      masterClock.triggerAdBreak(nextAdBreak);
    } else {
      const nextStream = streamState.moveToNextVideo();
      io.emit("videoChanged", nextStream);
    }
    hasAdvancedCurrentVideo = false;
  });

  socket.on("adBreakOver", () => {
    if (!masterClock.isAdBreaking) return;
    masterClock.endAdBreak();
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
