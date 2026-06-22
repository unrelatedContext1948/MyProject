/*
To understand the flow of this file:
1. The queue is loaded from PlaylistsTable
2. The backend keeps track of the current video using currentIndex
3. When a user joins the website, Socket.io uses this file to know about the current stream state
4. The client receives:
   - the current video
   - the active queue index
   - the approximate playback time of the video
5. When the frontend says the current video has ended, the backend moves onto the next video in the queue

This allows new users to join the current stream and watch the current video playing instead
of watching the first video in the queue whenever they join the website.
 */

const masterClock = require("./masterClock");
const PlaylistModel = require("../models/playlistModel");

// Current stream state stored in backend memory
let queue = [];
let currentIndex = 0;
// stores when the current video started playing
// used to estimate how many seconds the current video has already played
let videoStartTime = Date.now();

/*
Load the latest queue from the database
*/
function loadQueue() {
  queue = PlaylistModel.getSongsInPlaylist();
  return queue;
}
// return the currently playing video based on currentIndex
// if the in-memory queue is empty, load it from the database
function getCurrentVideo() {
  if (queue.length === 0) {
    loadQueue();
  }
  return queue[currentIndex] || null;
}

// We need to know how much time will be needed for the placement
// of the next merged AdBreak so we can after how many songs
// an ad break should come.
// this methode is therefore here to count the time of several songs
// so at the end we can put the ad break after 15 minutes of played music
function parseDuration(duration) {
  if (!duration) return 0;
  const parts = duration.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

// This is the function that calculate after how many songs an
// ad break must be placed at
function buildMergedQueue(nextAdBreakIn) {
  if (queue.length === 0) loadQueue();

  // takes the 6 songs of the queue
  const upcoming = queue.slice(currentIndex + 1, currentIndex + 7);

  // No ad break scheduled or it's more than an hour away → plain songs list
  if (nextAdBreakIn === null || nextAdBreakIn > 900) {
    return upcoming.map((s) => ({ ...s, type: "song" }));
  }

  let accumulated = 0; // time accumlated
  let insertAt = upcoming.length; // default: after all visible items

  // calculated time accumlated for each song and insert it at the index shere the specified time threshold is (after 15mins)
  for (let i = 0; i < upcoming.length; i++) {
    if (accumulated >= nextAdBreakIn) {
      insertAt = i;
      break;
    }
    accumulated += parseDuration(upcoming[i].Duration);
  }

  // insert the ad break at the calculated index
  const merged = upcoming.map((s) => ({ ...s, type: "song" }));
  merged.splice(insertAt, 0, {
    type: "adbreak",
    Title: "Ad Break",
    AdText: "Stay tuned – a short break is coming up.",
  });

  return merged.slice(0, 6); // secure that there is just 6 elements in the queue
}

/*
Return the current stream state. (This function is for synchronization between users)

example:
in the queue, if a video started 45 seconds ago and then a user opens the website
they can immediately continue around timestamp 0:45  
instead of watching the first video from the beginning of the queue when they join the website
*/
function getCurrentStream() {
  const currentVideo = getCurrentVideo();
  const nextAdBreakIn = masterClock.nextAdBreakTime
    ? Math.max(0, Math.floor((masterClock.nextAdBreakTime - Date.now()) / 1000))
    : null;

  return {
    currentVideo,
    currentIndex,
    currentTime: Math.floor((Date.now() - videoStartTime) / 1000),
    mergedQueue: buildMergedQueue(nextAdBreakIn),
  };
}

/*
Move to the next video in the queue
function used when frontend notifies the server that the current vid
has ended
*/
function moveToNextVideo() {
  if (queue.length === 0) {
    loadQueue();
  }
  currentIndex++;
  // temporary for synchronization testing
  // loops back to first video when the queue ends (so no silence)
  // later this will be replaced with random videos from PlaylistsTable when the queue ends (so its not final yet for this function)
  if (currentIndex >= queue.length) {
    currentIndex = 0;
  }
  // reset the synchronization timer because a new video has started playing
  // the backend uses videoStartTime to estimate playback position od the current vid for newly connected users
  videoStartTime = Date.now();

  return getCurrentStream();
}

/*
Refresh queue data from database
Used after a new video is submitted so the backend has the latest queue data */
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
