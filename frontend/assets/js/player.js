/* for volume control and now playing content 
actual playback will be handled by backend/integration 
*/
const socket = io();

let player; // the YouTube IFrame Player instance
let queue = []; // all songs fetched from the backend
let currentIndex = 0; // index of the currently playing song

// This function is called by the YouTube IFrame API when it's ready
function onYouTubeIframeAPIReady() {
  socket.on("currentStream", (stream) => {
    currentVideo = stream.currentVideo;
    queue = stream.mergedQueue;

    if (!player) {
      loadQueueThenPlay(stream);
    } else {
      showCurrentSong();
      if (typeof renderQueue === "function") renderQueue();
    }
  });

  socket.on("videoChanged", (stream) => {
    currentVideo = stream.currentVideo;
    queue = stream.mergedQueue;

    if (player && typeof player.loadVideoById === "function") {
      const videoId = extractVideoId(currentVideo.VideoURL);
      player.loadVideoById(videoId);
    }

    showCurrentSong();
    if (typeof renderQueue === "function") renderQueue();
  });
}

async function loadQueueThenPlay(stream) {
  if (!currentVideo) {
    document.getElementById("nowPlayingTitle").textContent = "Queue is empty";
    return;
  }

  const videoId = extractVideoId(queue[0].VideoURL);

  // Create the YouTube IFrame Player inside the #youtubePlayer div
  player = new YT.Player("youtubePlayer", {
    width: "100%",
    height: "100%",
    videoId: videoId,
    playerVars: {
      autoplay: 1, //  player autoplay on load
      controls: 0, //  YouTube controls removed
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
  // YT.PlayerState.ENDED === 0 — fires when the current video finishes
  if (event.data === YT.PlayerState.ENDED) {
    socket.emit("videoEnded");

    // Load and play the next song
    const videoId = extractVideoId(queue[currentIndex].VideoURL);
    player.loadVideoById(videoId);

    // Update the track info and queue list
    showCurrentSong();
    renderQueue();
    const slider = document.getElementById("volumeSlider");
    player.setVolume(parseInt(slider.value));
    updateVolume(); // Ensure the new video starts at the current volume
  }
}

// ─── Ad break events ─────────────────────────────────────────────────────────

socket.on("adBreakStart", (adBreak) => {
  visualizer.show(adBreak, adBreak.AdBreakURL);
});

socket.on("adBreakEnd", () => {
  visualizer.hide();
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
  const song = queue[currentIndex];

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
