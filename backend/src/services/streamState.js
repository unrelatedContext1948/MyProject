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
function getCurrentVideo (){
    if(queue.length === 0) {
        loadQueue();
    }
    return queue [currentIndex] || null;
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

    return{
        currentVideo,
        currentIndex,
        currentTime: Math.floor(
            (Date.now() - videoStartTime) /1000
        )
    };
}

/*
Move to the next video in the queue
function used when frontend notifies the server that the current vid
has ended
*/
function moveToNextVideo() {
    if(queue.length === 0){
        loadQueue();
    }
    currentIndex++;
// temporary for synchronization testing
// loops back to first video when the queue ends (so no silence)
// later this will be replaced with random videos from PlaylistsTable when the queue ends (so its not final yet for this function)
    if(currentIndex >= queue.length) {
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
    refreshQueue
}