const db = require("../database/database");

const PlaylistModel = {
  // 1. Get Songs in a Playlist from the database, ordered by score
  //    (likes minus dislikes) so the most-liked song is at the front of
  //    the queue.
  getSongsInPlaylist: () => {
    const sql = `
      SELECT
        PlaylistsTable.*,
        COALESCE(SUM(CASE WHEN LikesTable.Type = 'like' THEN 1 ELSE 0 END), 0) AS Likes,
        COALESCE(SUM(CASE WHEN LikesTable.Type = 'dislike' THEN 1 ELSE 0 END), 0) AS Dislikes,
        COALESCE(SUM(CASE WHEN LikesTable.Type = 'like' THEN 1 WHEN LikesTable.Type = 'dislike' THEN -1 ELSE 0 END), 0) AS Score
      FROM PlaylistsTable
      LEFT JOIN LikesTable ON LikesTable.PlaylistID = PlaylistsTable.PlaylistID
      GROUP BY PlaylistsTable.PlaylistID
      ORDER BY Score DESC, PlaylistsTable.PlaylistID ASC
    `;
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
    const {
      Title,
      Channel,
      Duration,
      StartTime,
      EndTime,
      SubmittedBy,
      VideoURL,
    } = songData;
    const sql = `
            INSERT INTO PlaylistsTable (Title, Channel, Duration, StartTime, EndTime, SubmittedBy, VideoURL) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
    return db
      .prepare(sql)
      .run(Title, Channel, Duration, StartTime, EndTime, SubmittedBy, VideoURL);
  },

  // 3. Remove a song from a playlist in the database
  removeSongFromPlaylist: (songID) => {
    const sql = `DELETE FROM PlaylistsTable WHERE PlaylistID = ?`;
    db.prepare(sql).run(songID);
  },
};

module.exports = PlaylistModel;
