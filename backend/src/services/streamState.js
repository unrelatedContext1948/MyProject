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
const { getApprovedAdBreaks } = require("./songsadbreak");

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

function peekNextAdBreak() {
  // Get all approved ad breaks and filter out those without a valid URL{
  const adBreaks = getApprovedAdBreaks();
  const validAdBreaks = adBreaks.filter((adBreak) => adBreak.AdBreakURL);

  // If there are no valid ad breaks, return the upcoming songs without any ad break
  if (validAdBreaks.length === 0) return null;

  // Calculate the next valid ad break index based on the currentAdIndex

  validAdIndex = currentAdIndex % validAdBreaks.length;
  return validAdBreaks[validAdIndex];
}

function advanceAdBreak() {
  currentAdIndex++;
}

let currentAdIndex = 0;
let validAdIndex = 0; // This variable keeps track of the current valid ad break index
// This is the function that calculate after how many songs an
// ad break must be placed at
function buildMergedQueue(nextAdBreakIn) {
  if (queue.length === 0) loadQueue();

  // keeps the queue on 6 items
  const upcoming = [];
  for (let i = 1; upcoming.length < 7 && queue.length > 0; i++) {
    const idx = (currentIndex + i) % queue.length;
    upcoming.push(queue[idx]);
  }

  // No ad break scheduled or the 15 minutes intervall is overwhelmed
  if (nextAdBreakIn === null || nextAdBreakIn > 900) {
    return upcoming.map((s) => ({ ...s, type: "song" }));
  }

  let accumulated = 0; // time accumlated
  let insertAt = upcoming.length; // default: after all visible items

  // calculated time accumlated for each song and insert it at the index shere the specified time threshold is (after 15mins)
  for (let i = 0; i < upcoming.length; i++) {
    const videoDuration = parseDuration(upcoming[i].Duration);
    if (accumulated >= nextAdBreakIn) {
      insertAt = i;
      break;
    }
    accumulated += videoDuration;
  }

  const validAdBreak = peekNextAdBreak();
  if (!validAdBreak) {
    return upcoming.map((s) => ({ ...s, type: "song" }));
  }

  // Insert the first valid ad break at the calculated position
  const merged = upcoming.map((s) => ({ ...s, type: "song" }));
  merged.splice(insertAt, 0, {
    type: "adbreak",
    // display the ad actual ad break title from the database, so the user knows what ad break is coming up
    Title: `${validAdBreak.AdBreakTitle}`,
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
  const elapsedSeconds = Math.floor((Date.now() - videoStartTime) / 1000);
  const currentDuration = parseDuration(currentVideo?.Duration) || 0;
  const remainingTime = Math.max(0, currentDuration - elapsedSeconds);

  const adjustedNextAdBreakIn =
    nextAdBreakIn !== null ? Math.max(0, nextAdBreakIn - remainingTime) : null;

  return {
    currentVideo,
    currentIndex,
    adjustedNextAdBreakIn,
    currentTime: Math.floor((Date.now() - videoStartTime) / 1000),
    mergedQueue: buildMergedQueue(adjustedNextAdBreakIn),
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
  peekNextAdBreak,
  advanceAdBreak,
  get validAdIndex() {
    return validAdIndex;
  },
};
