/*
Player – manages the YouTube IFrame, stream synchronisation via Socket.IO,
and wires up the waveform visualizer for ad breaks.

Data flow:
  Server  →  'currentStream'  →  create / seek YouTube player, render queue
  Server  →  'videoChanged'   →  load next video, update UI
  Server  →  'videoSeeked'    →  seek within the current video, update UI
  Server  →  'queueUpdated'   →  refresh queue display
  Server  →  'adBreakStart'   →  show waveform visualizer overlay
  Server  →  'adBreakEnd'     →  hide visualizer, resume normal display
  Client  →  'videoEnded'     →  server advances stream, broadcasts videoChanged
  Client  →  'seek'           →  server recomputes master clock, broadcasts videoSeeked
  Client  →  'requestSync'    →  server replies with a fresh 'currentStream' (hard resync)
*/

const socket = io();

let player = null;         // YouTube IFrame Player instance
let songQueue = [];        // raw songs from server (used for video ID lookup)
let mergedQueue = [];      // merged songs + ad-break placeholders (used for display)
let currentIndex = 0;
let ytApiReady = false;
let pendingStream = null;  // buffered stream data received before YT API was ready

// ─── Timeline slider state ───────────────────────────────────────────────────
let isScrubbing = false;   // true while the user is dragging the slider

// ─── Freeze watchdog state ───────────────────────────────────────────────────
const FREEZE_TIMEOUT_MS = 5000;
let watchdogLastTime = 0;
let watchdogLastAdvanceAt = Date.now();
let watchdogBufferingSince = null;
let resyncInFlight = false;

// ─── YouTube IFrame API ──────────────────────────────────────────────────────

// Called by the YouTube IFrame API script when it has loaded
function onYouTubeIframeAPIReady() {
    ytApiReady = true;
    if (pendingStream) {
        _initPlayer(pendingStream);
        pendingStream = null;
    }
}

function _createPlayer(videoId, startSeconds) {
    player = new YT.Player("youtubePlayer", {
        width: "100%",
        height: "100%",
        videoId,
        playerVars: {
            autoplay: 1,
            mute: 1,
            controls: 1,
            start: Math.floor(startSeconds),
        },
        events: {
            onReady: _onPlayerReady,
            onStateChange: _onPlayerStateChange,
        },
    });
}

function _onPlayerReady(event) {
    const slider = document.getElementById("volumeSlider");
    slider.value = 0;
    player.setVolume(0);
    updateVolume();
    event.target.playVideo();
}

function _onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        socket.emit("videoEnded", currentIndex);
    }
    // Any real state transition means the player is alive – give the
    // watchdog a fresh baseline so it doesn't misread a normal buffering
    // blip (which briefly halts currentTime too) as a freeze.
    resetWatchdog();
}

function _initPlayer(streamData) {
    if (!streamData.currentVideo) return;

    const videoId = extractVideoId(streamData.currentVideo.VideoURL);
    if (!videoId) return;

    if (player && typeof player.loadVideoById === "function") {
        player.loadVideoById({ videoId, startSeconds: streamData.currentTime || 0 });
        player.playVideo();
    } else {
        _createPlayer(videoId, streamData.currentTime || 0);
    }
    resetWatchdog();
}

// ─── Socket.IO events ────────────────────────────────────────────────────────

// Fired once when the client connects – gives the full current stream state
socket.on("currentStream", (streamData) => {
    currentIndex = streamData.currentIndex;
    mergedQueue = streamData.mergedQueue || [];

    // If we're in an ad break right now, show the visualizer immediately
    if (streamData.masterClock && streamData.masterClock.isAdBreaking) {
        const ad = streamData.masterClock.currentAdBreak;
        visualizer.show(ad, ad ? ad.AdBreakURL : null);
    }

    if (!streamData.currentVideo) {
        document.getElementById("nowPlayingTitle").textContent = "Queue is empty";
        return;
    }

    showCurrentSong(streamData.currentVideo);
    renderQueue();

    if (ytApiReady) {
        _initPlayer(streamData);
    } else {
        pendingStream = streamData;
    }
});

// Fired to every client when any client reports videoEnded
socket.on("videoChanged", (streamData) => {
    currentIndex = streamData.currentIndex;
    mergedQueue = streamData.mergedQueue || mergedQueue;

    if (!streamData.currentVideo) {
        document.getElementById("nowPlayingTitle").textContent = "Queue is empty";
        return;
    }

    showCurrentSong(streamData.currentVideo);
    renderQueue();

    if (player && typeof player.loadVideoById === "function") {
        const videoId = extractVideoId(streamData.currentVideo.VideoURL);
        if (videoId) player.loadVideoById(videoId);
    }

    const slider = document.getElementById("volumeSlider");
    if (player && player.setVolume) player.setVolume(parseInt(slider.value));
    resetWatchdog();
});

// Fired to every client when anyone drags the shared timeline slider.
// Seeks within the currently loaded video instead of reloading it, so
// playback keeps going instead of restarting from 0.
socket.on("videoSeeked", (streamData) => {
    currentIndex = streamData.currentIndex;

    if (player && typeof player.seekTo === "function") {
        player.seekTo(streamData.currentTime || 0, true);
        if (player.getPlayerState && player.getPlayerState() !== YT.PlayerState.PLAYING) {
            player.playVideo();
        }
    }

    if (!isScrubbing) {
        updateProgressUI(streamData.currentTime || 0);
    }
    resetWatchdog();
});

// Fired when any client submits a new song
socket.on("queueUpdated", async () => {
    try {
        const res = await fetch("/api/queue");
        songQueue = await res.json();
        // mergedQueue will be refreshed on the next videoChanged / currentStream
        renderQueue();
    } catch (e) {
        console.error("Failed to refresh queue:", e);
    }
});

// ─── Ad break events ─────────────────────────────────────────────────────────

socket.on("adBreakStart", (adBreak) => {
    visualizer.show(adBreak, adBreak ? adBreak.AdBreakURL : null);
});

socket.on("adBreakEnd", (streamData) => {
    visualizer.hide();
    if (streamData && streamData.currentVideo) {
        showCurrentSong(streamData.currentVideo);
        mergedQueue = streamData.mergedQueue || mergedQueue;
        renderQueue();
        if (player && typeof player.loadVideoById === "function") {
            const videoId = extractVideoId(streamData.currentVideo.VideoURL);
            if (videoId) player.loadVideoById(videoId);
        }
        resetWatchdog();
    }
});

// ─── Timeline slider ─────────────────────────────────────────────────────────

const progressSlider = document.getElementById("progressSlider");
const progressCurrentTimeLabel = document.getElementById("progressCurrentTime");
const progressDurationLabel = document.getElementById("progressDuration");

function formatTime(totalSeconds) {
    const seconds = Math.max(0, Math.floor(totalSeconds || 0));
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${String(secs).padStart(2, "0")}`;
}

// Reflects a given position in the UI without touching the player or the
// network – used both for local scrub previews and for remote updates.
function updateProgressUI(currentTime, duration) {
    if (typeof duration === "number" && duration > 0) {
        progressSlider.max = duration;
        progressDurationLabel.textContent = formatTime(duration);
    }
    progressSlider.value = currentTime;
    progressCurrentTimeLabel.textContent = formatTime(currentTime);
}

// While dragging: only update the local preview (label + thumb position).
// Emitting on every 'input' tick would spam the server with seek requests,
// forcing everyone's player to reload dozens of times per second – which is
// exactly what used to make the whole stream appear to freeze.
progressSlider.addEventListener("input", () => {
    isScrubbing = true;
    progressCurrentTimeLabel.textContent = formatTime(progressSlider.value);
});

// On release: send the final position once. The server recomputes the
// master clock and broadcasts 'videoSeeked' to every client, including this
// one, so the seek is applied consistently rather than assumed locally.
progressSlider.addEventListener("change", () => {
    const newTime = parseFloat(progressSlider.value);
    socket.emit("seek", newTime);
    isScrubbing = false;
});

// Keep the slider in sync with actual playback once per second, unless the
// user currently has hold of it.
setInterval(() => {
    if (!player || isScrubbing) return;
    if (typeof player.getCurrentTime !== "function" || typeof player.getDuration !== "function") return;

    const duration = player.getDuration();
    const current = player.getCurrentTime();
    updateProgressUI(current, duration);
}, 1000);

// ─── Freeze watchdog ─────────────────────────────────────────────────────────

function resetWatchdog() {
    watchdogLastTime = player && typeof player.getCurrentTime === "function" ? player.getCurrentTime() : 0;
    watchdogLastAdvanceAt = Date.now();
    watchdogBufferingSince = null;
}

// Forces a full resync instead of just retrying playVideo(): a frozen
// embedded iframe can be stuck in a state where in-page API calls no longer
// take effect, but loadVideoById() re-issues a fresh command to the embed
// and reseeds it with the server's authoritative current position.
function hardResync() {
    if (resyncInFlight) return;
    resyncInFlight = true;
    console.warn("[Watchdog] Player frozen – forcing hard resync");
    socket.emit("requestSync");
    // Give the server round-trip a moment before allowing another resync,
    // instead of re-triggering every tick while the reload is in flight.
    setTimeout(() => {
        resyncInFlight = false;
    }, FREEZE_TIMEOUT_MS);
}

setInterval(() => {
    if (!player || typeof player.getPlayerState !== "function" || resyncInFlight) return;

    const state = player.getPlayerState();

    if (state === YT.PlayerState.BUFFERING) {
        watchdogBufferingSince = watchdogBufferingSince || Date.now();
        if (Date.now() - watchdogBufferingSince > FREEZE_TIMEOUT_MS) {
            hardResync();
        }
        return;
    }
    watchdogBufferingSince = null;

    if (state !== YT.PlayerState.PLAYING) {
        // Paused/cued/unstarted on purpose (e.g. ad break) – not a freeze.
        watchdogLastTime = player.getCurrentTime ? player.getCurrentTime() : watchdogLastTime;
        watchdogLastAdvanceAt = Date.now();
        return;
    }

    const currentTime = player.getCurrentTime();
    if (currentTime > watchdogLastTime + 0.25) {
        watchdogLastTime = currentTime;
        watchdogLastAdvanceAt = Date.now();
        return;
    }

    if (Date.now() - watchdogLastAdvanceAt > FREEZE_TIMEOUT_MS) {
        hardResync();
    }
}, 1000);

// ─── UI helpers ──────────────────────────────────────────────────────────────

function extractVideoId(url) {
    try {
        const u = new URL(url);
        if (u.hostname === "youtu.be") return u.pathname.slice(1);
        return u.searchParams.get("v");
    } catch {
        console.error("Invalid URL:", url);
        return null;
    }
}

function showCurrentSong(song) {
    if (!song) return;
    document.getElementById("nowPlayingTitle").textContent =
        `${song.Title} - ${song.Channel}`;
    document.getElementById("nowPlayingSubmittedBy").textContent =
        `Submitted by: ${song.SubmittedBy}`;
}

// Volume slider – called by oninput on the HTML element
function updateVolume() {
    const slider = document.getElementById("volumeSlider");
    const volume = parseInt(slider.value);

    document.getElementById("volumeValue").textContent = volume;

    if (player && player.setVolume) player.setVolume(volume);

    slider.style.background = `linear-gradient(
        to right,
        var(--sage-600) 0%,
        var(--sage-600) ${volume}%,
        var(--sage-200) ${volume}%,
        var(--sage-200) 100%
    )`;
}
