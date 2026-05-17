const EventEmitter = require('events');
const PlaylistModel = require('../models/playlistModel');
const QueueManager = require('../models/queue');

class StreamManager extends EventEmitter {
  constructor(playlistID) {
    super();

    this.playlistID = playlistID;
    this.currentSongIndex = 0;
    this.playlist = []; //playlist from database.
    this.totalStreamTime = 0; //total time of the stream in seconds.
    this.isAdPlaying = false; //ad break not running.
    this.adTimer = null; //timer for ad breaks.
    this.adBreakInterval= 15 * 60 * 1000; //15 minutes in milliseconds.
    this.adBreakDuration = 30 * 1000; //30 seconds ad break in milliseconds.
  }

  //-----------------------------------------------------------------------//
  startStream() {
    if (this.playlist.length === 0) {
      this.playlist = PlaylistModel.getSongsInPlaylist(this.playlistID);
    }
    this.emit('streamStarted', this.getCurrentSong());
    this.triggerAdBreak();
  }

  getCurrentSong() {
    const song = this.playlist[this.currentSongIndex];
    if (!song){
        return null;
    }
    return song;
  }

  getNextSong() {
    if(this.isAdPlaying === true){
        return
    }
    const upcomingSongs = this.playlist.slice(
        this.currentSongIndex + 1,
        this.currentSongIndex + 7
    )
    return upcomingSongs;
    }

    //----------------------------------------------------------------------//
    /*
    Here is to manage the ad breaks in the app. 
    The triggerAdbreak means that the songs are played for 15 minutes, then the ad breask will appear.
    For the startAdbreak, the ad break will last for 30 seconds, and then the next song will be played.
    Song -> triggerAdbreak(after 15 minutes) ->startAdbreak -> Song
    */
    
    triggerAdBreak() {
        this.adTimer = setTimeout(() => {
            this.startAdBreak();
        }, this.adBreakInterval);
    }

    startAdBreak() {
        if (this.isAdPlaying === true) {
            this.isAdPlaying = false;
            this.emit('adBreakStart');
            
            //Time out for the 30 seconds ad break to play.
            setTimeout(() => {
                this.isAdPlaying = false;
                this.emit('adBreakEnd');
                this.currentSongIndex++;
                this.getNextSong();
                this.triggerAdBreak(); // Schedule the next ad break after the current one ends.
            }, this.adBreakDuration);
        }
    }
}  
