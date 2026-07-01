/*
Player – manages the YouTube IFrame, stream synchronisation via Socket.IO,
and wires up the waveform visualizer for ad breaks.

Data flow:
  Server  →  'currentStream'  →  create / seek YouTube player, render queue
  Server  →  'videoChanged'   →  load next video, update UI
  Server  →  'queueUpdated'   →  refresh queue display
  Server  →  'adBreakStart'   →  show waveform visualizer overlay
  Server  →  'adBreakEnd'     →  hide visualizer, resume normal display
  Client  →  'videoEnded'     →  server advances stream, broadcasts videoChanged
*/

const socket = io();

let player = null;         // YouTube IFrame Player instance
let songQueue = [];        // raw songs from server (used for video ID lookup)
let mergedQueue = [];      // merged songs + ad-break placeholders (used for display)
let currentIndex = 0;
let ytApiReady = false;
let pendingStream = null;  // buffered stream data received before YT API was ready

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
}

function _initPlayer(streamData) {
    if (!streamData.currentVideo) return;

    const videoId = extractVideoId(streamData.currentVideo.VideoURL);
    if (!videoId) return;

    if (player && typeof player.loadVideoById === "function") {
        player.loadVideoById({ videoId, startSeconds: streamData.currentTime || 0 });
    } else {
        _createPlayer(videoId, streamData.currentTime || 0);
    }
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
    if (player && typeof player.mute === "function") player.mute();
    visualizer.show(adBreak, adBreak ? adBreak.AdBreakURL : null);
});

socket.on("adBreakEnd", (streamData) => {
    visualizer.hide();
    if (player && typeof player.unMute === "function") player.unMute();
    if (streamData && streamData.currentVideo) {
        showCurrentSong(streamData.currentVideo);
        mergedQueue = streamData.mergedQueue || mergedQueue;
        renderQueue();
        if (player && typeof player.loadVideoById === "function") {
            const videoId = extractVideoId(streamData.currentVideo.VideoURL);
            if (videoId) player.loadVideoById(videoId);
        }
    }
});

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
