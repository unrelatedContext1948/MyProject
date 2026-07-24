const db = require("../database/database");

const PlaylistModel = {
  // 1. Get Songs in a Playlist from the database
  getSongsInPlaylist: () => {
    const sql = `SELECT * FROM PlaylistsTable`;
    return db.prepare(sql).all();
  },

  // 2. Add a song to a playlist in the database
  /* 
    The structure of each song in the playlist:
    - title: the name shown in the queue
    - submittedBy: who added this song
    - duration: how long it is
    - type: video or ad break
    - adText: the text of the ad (only for ad breaks)  
  */
  
  
  
  addSongToPlaylist: (songData) => {
    const { Title, Channel, Duration, StartTime, EndTime, SubmittedBy, VideoURL } = songData;
    const sql = `
            INSERT INTO PlaylistsTable (Title, Channel, Duration, StartTime, EndTime, SubmittedBy, VideoURL) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
    return db.prepare(sql).run(Title, Channel, Duration, StartTime, EndTime, SubmittedBy, VideoURL);
  },

  // 3. Remove a song from a playlist in the database
  removeSongFromPlaylist: (songID) => {
    const sql = `DELETE FROM PlaylistsTable WHERE PlaylistID = ?`;
    db.prepare(sql).run(songID);
  },
};

module.exports = PlaylistModel;
