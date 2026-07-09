/* for volume control and now playing content 
actual playback will be handled by backend/integration 
*/
const socket = io();

let player; // the YouTube IFrame Player instance
let queue = []; // all songs fetched from the backend
let currentIndex = 0; // index of the currently playing song
let mergedQueue = [];
let pendingStream = null;
let ytApiReady = false;
let wasPlaying = false;
let currentVideo = null;
let videoTimeout = null;
let segmentEndSeconds = null; // stop position of the current segment, null = play to natural end
let segmentMonitor = null; // interval that watches the segment end boundary

// Absolute position in the source video a client should seek to.
// startSeconds is where the segment begins 
// currentTime is how long the segment has already been playing on the server.
function seekPosition(stream) {
  return Math.floor((stream.startSeconds || 0) + (stream.currentTime || 0));
}
 
// Poll the player and advance the stream once the segment end is reached.
// Segment videos never fire YouTube's ENDED event at the cut point, so the
// boundary has to be enforced here.
function startSegmentMonitor() {
  stopSegmentMonitor();
  if (segmentEndSeconds === null) return;
  segmentMonitor = setInterval(() => {
    if (!player || typeof player.getCurrentTime !== "function") return;
    if (player.getCurrentTime() >= segmentEndSeconds) {
      stopSegmentMonitor();
      clearTimeout(videoTimeout);
      if (wasPlaying) {
        wasPlaying = false;
        socket.emit("videoEnded", currentIndex);
      }
    }
  }, 500);
}
 
function stopSegmentMonitor() {
  if (segmentMonitor) {
    clearInterval(segmentMonitor);
    segmentMonitor = null;
  }
}

// This function is called by the YouTube IFrame API when it's ready
function onYouTubeIframeAPIReady() {
  ytApiReady = true;
  if (pendingStream) createYouTubePlayer(pendingStream);
}

function createYouTubePlayer(stream) {
  if (!stream.currentVideo) return;
  const videoId = extractVideoId(stream.currentVideo.VideoURL);
  if (!videoId) return;

  segmentEndSeconds = stream.endSeconds ?? null;

  // Create the YouTube IFrame Player inside the #youtubePlayer div
  player = new YT.Player("youtubePlayer", {
    width: "100%",
    height: "100%",
    videoId: videoId,
    playerVars: {
      autoplay: 1, //  player autoplay on load
      controls: 0, //  YouTube controls removed
      mute: 1,
      disablekb: 1, // disables keyboard controls on player
      // start: Math.floor(stream.currentTime),
      start: seekPosition(stream),
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
    },
  });
}

// Called once the player is fully initialized and ready to play
function onPlayerReady() {
  showCurrentSong();
  renderQueue(); // This is the function defined in queue.js that renders the next 6 songs in the queue
  // Set initial volume to match the slider
  const slider = document.getElementById("volumeSlider");

  slider.value = 0; //slider value is at 0 and player is muted initially
  player.setVolume(0);
  updateVolume(); // Ensure the new video starts at the current volume
}

// Called whenever the player state changes (playing, paused, ended, etc.)
function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    wasPlaying = true;

    startSegmentMonitor();
    if (segmentEndSeconds === null){
      const duration = player.getDuration();
      if (duration > 0) {
        clearTimeout(videoTimeout);
        videoTimeout = setTimeout(
          () => {
            socket.emit("videoEnded", currentIndex);
          },
          (duration + 5) * 1000,
        );
      }
    }
  }
  // YT.PlayerState.ENDED === 0 — fires when the current video finishes
  if (event.data === YT.PlayerState.ENDED && wasPlaying) {
    wasPlaying = false;
    clearTimeout(videoTimeout);
    stopSegmentMonitor();
    socket.emit("videoEnded", currentIndex);
  }
}

// ─── Socket.IO events for the Stream ────────────────────────────────────────────────────────

socket.on("currentStream", (stream) => {
  currentVideo = stream.currentVideo;
  queue = stream.mergedQueue;
  currentIndex = stream.currentIndex;

  const videoId = extractVideoId(currentVideo?.VideoURL);
  segmentEndSeconds = stream.endSeconds ?? null;
  if (player) {
    player.loadVideoById({ videoId, startSeconds: seekPosition(stream) });
  } else {
    pendingStream = stream;
    if (ytApiReady) createYouTubePlayer(stream);
  }
});

socket.on("videoChanged", (stream) => {
  wasPlaying = false;
  stopSegmentMonitor();
  currentVideo = stream.currentVideo;
  queue = stream.mergedQueue;
  currentIndex = stream.currentIndex;
  segmentEndSeconds = stream.endSeconds ?? null;

  if (player && typeof player.loadVideoById === "function") {
    const videoId = extractVideoId(currentVideo.VideoURL);
    // A freshly changed video starts at its segment start, default 0.
    player.loadVideoById({videoId, startSeconds: seekPosition(stream) });
  }

  showCurrentSong();
  if (typeof renderQueue === "function") renderQueue();
});

// ─── Ad break events ─────────────────────────────────────────────────────────

socket.on("adBreakStart", (adBreak) => {
  wasPlaying = false;
  if (player) player.mute();
  visualizer.show(adBreak, adBreak.AdBreakURL);
});

socket.on("adBreakEnd", (stream) => {
  if (player) player.unMute();
  visualizer.hide();

  currentVideo = stream.currentVideo;
  currentIndex = stream.currentIndex;
  mergedQueue = stream.mergedQueue;
  showCurrentSong();
  renderQueue();
});

// ─── UI helpers ──────────────────────────────────────────────────────────────

// Extracts the YouTube video ID from a full URL
function extractVideoId(url) {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === "youtu.be") {
      return urlObj.pathname.slice(1); // For short URLs like youtu.be/abc123
    }
    return urlObj.searchParams.get("v"); // For standard URLs like youtube.com/watch?v=abc123
  } catch (e) {
    console.error("Invalid URL:", url);
    return null;
  }
}

function showCurrentSong() {
  const song = currentVideo;

  if (!song) return; //if theres no song then stop

  const titleElement = document.getElementById("nowPlayingTitle");
  const submittedByElement = document.getElementById("nowPlayingSubmittedBy");

  titleElement.textContent = `${song.Title} - ${song.Channel}`;
  submittedByElement.textContent = `Submitted by: ${song.SubmittedBy}`;
}

// Initial volume display n also when moving the slider, the number and the color will also change depending on the slide volume value , e.g volume getting louder
function updateVolume() {
  const slider = document.getElementById("volumeSlider");

  const volume = parseInt(slider.value);

  document.getElementById("volumeValue").textContent = volume;

  // Only set volume if the player is already initialized
  if (player && player.setVolume) {
    player.unMute();
    player.setVolume(volume);
  }

  slider.style.background = `linear-gradient(
  to right,
  var(--sage-600) 0%,
  var(--sage-600) ${volume}%,
  var(--sage-200) ${volume}%,
  var(--sage-200) 100%
  )`;
}
