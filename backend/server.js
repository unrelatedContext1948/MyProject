/*
HumanMusic backend server.

Socket.IO is used for:
  1. Synchronising the current stream when a new client connects
  2. Broadcasting queue changes (new submission)
  3. Notifying all clients when the video changes (videoEnded → videoChanged)
  4. Forwarding master-clock ad-break events (adBreakStart / adBreakEnd)
*/

const app = require("./src/app");
const http = require("http");
const { Server } = require("socket.io");

const streamState = require("./src/services/streamState");
const masterClock = require("./src/services/masterClock");

const PORT = 3000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" },
});

// Make io available inside app.js routes
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
    io.emit("adBreakEnd", streamState.getCurrentStream());
});

// Whether the currently playing index has already triggered an advance, so
// concurrent videoEnded events from multiple tabs for the same play are all
// rejected after the first. Reset on every advance since the queue loops and
// the same index can come around again for a brand-new play.
let hasAdvancedCurrentVideo = false;

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Send full stream state to the newly joined client
    socket.emit("currentStream", streamState.getCurrentStream());

    // When a client's video ends, advance the stream for everyone.
    // The client sends the index it thinks is current so duplicate events
    // from other open tabs are ignored.
    socket.on("videoEnded", (reportedIndex) => {
        console.log("videoEnded received from:", socket.id, "index:", reportedIndex);
        const current = streamState.getCurrentStream();
        if (reportedIndex !== current.currentIndex) {
            console.log("videoEnded ignored – stale index", reportedIndex, "current is", current.currentIndex);
            return;
        }
        if (hasAdvancedCurrentVideo) {
            console.log("videoEnded ignored – already advanced past index", reportedIndex);
            return;
        }
        hasAdvancedCurrentVideo = true;
        const nextStream = streamState.moveToNextVideo();
        hasAdvancedCurrentVideo = false;
        io.emit("videoChanged", nextStream);
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

server.listen(PORT, (err) => {
    if (err) {
        console.log("The Server did not start:", err);
    }
    console.log(`The Server is running on http://localhost:${PORT}`);
});
