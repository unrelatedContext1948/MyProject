const db = require("../database");

const PlaylistModel = {
  // 1. Get Songs in a Playlist from the database
  getSongsInPlaylist: (playlistID) => {
    const sql = `SELECT * FROM playlistsTable WHERE PlaylistID = ?`;
    return db.prepare(sql).all(playlistID);
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
    const { Title, Channel, Duration, VideoURL, SubmittedBy } = songData;
    const sql = `
            INSERT INTO PlaylistsTable (Title, Channel, Duration, VideoURL, SubmittedBy) 
            VALUES (?, ?, ?, ?, ?)
        `;
    return db.prepare(sql).run(Title, Channel, Duration, VideoURL, SubmittedBy);
  },

  // 3. Remove a song from a playlist in the database
  removeSongFromPlaylist: (songID) => {
    const sql = `DELETE FROM PlaylistsTable WHERE SongID = ?`;
    db.prepare(sql).run(songID);
  },
};

module.exports = PlaylistModel;
