/*
Maintains the in-memory stream state shared across all Socket.IO clients:
  - which video is playing (currentIndex)
  - when it started (videoStartTime) → used to sync new joiners
  - a merged queue that includes upcoming songs + ad-break placeholders

Flow for a new user joining:
  1. Server sends 'currentStream' with currentVideo, currentTime, mergedQueue, masterClock status
  2. Client seeks YouTube player to currentTime
  3. Client renders the queue (which may contain an ad-break entry)
*/

const PlaylistModel = require("../models/playlistModel");

let queue = [];
let currentIndex = 0;
let videoStartTime = Date.now();

function loadQueue() {
    queue = PlaylistModel.getSongsInPlaylist();
    return queue;
}

function getCurrentVideo() {
    if (queue.length === 0) loadQueue();
    return queue[currentIndex] || null;
}

// Parse "HH:MM:SS" or "MM:SS" → total seconds
function parseDuration(duration) {
    if (!duration) return 0;
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
}

/*
Build the 6-item sliding window the frontend shows as "Up Next".
Inserts an ad-break placeholder at the position where the master clock
estimates the next break will fire based on cumulative song durations.
*/
function buildMergedQueue(nextAdBreakIn) {
    if (queue.length === 0) loadQueue();

    const upcoming = [];
    for (let i = 1; upcoming.length < 6; i++) {
        const idx = (currentIndex + i) % queue.length;
        upcoming.push(queue[idx]);
        if (i >= queue.length) break; // avoid infinite loop if queue empty
    }

    // No ad break scheduled or it's more than an hour away → plain songs list
    if (nextAdBreakIn === null || nextAdBreakIn > 3600) {
        return upcoming.map(s => ({ ...s, type: 'song' }));
    }

    let accumulated = 0;
    let insertAt = upcoming.length; // default: after all visible items

    for (let i = 0; i < upcoming.length; i++) {
        if (accumulated >= nextAdBreakIn) {
            insertAt = i;
            break;
        }
        accumulated += parseDuration(upcoming[i].Duration);
    }

    const merged = upcoming.map(s => ({ ...s, type: 'song' }));
    merged.splice(insertAt, 0, {
        type: 'adbreak',
        Title: 'Ad Break',
        AdText: 'Stay tuned – a short break is coming up.',
    });

    return merged.slice(0, 6);
}

/*
Full stream state snapshot sent to every client that connects.
Includes master-clock info so the client knows about ad breaks immediately.
*/
function getCurrentStream() {
    // Lazy-load to avoid circular dependency issues at module initialisation
    const masterClock = require('./masterClock');
    const clockStatus = masterClock.getStatus();
    const currentVideo = getCurrentVideo();

    return {
        currentVideo,
        currentIndex,
        currentTime: Math.floor((Date.now() - videoStartTime) / 1000),
        masterClock: clockStatus,
        mergedQueue: buildMergedQueue(clockStatus.nextAdBreakIn),
    };
}

function moveToNextVideo() {
    if (queue.length === 0) loadQueue();

    currentIndex++;
    // Loop back to beginning when queue ends
    if (currentIndex >= queue.length) {
        currentIndex = 0;
    }
    videoStartTime = Date.now();

    return getCurrentStream();
}

function refreshQueue() {
    loadQueue();
    return queue;
}

module.exports = {
    loadQueue,
    getCurrentVideo,
    getCurrentStream,
    moveToNextVideo,
    refreshQueue,
};
