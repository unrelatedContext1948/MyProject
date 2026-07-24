/*
 likesModel.js - Data Access Object for like-related database operations.
 A like is identified either by UserID (logged-in user) or AnonymousID
 (guest browser) - never both at once for the same row.
*/
const db = require("../database/database");

const LikesModel = {
  // 1. Check whether this requester already liked this song
  hasLiked: ({ userID, anonymousID, playlistID }) => {
    const sql = userID
      ? `SELECT LikesID FROM LikesTable WHERE UserID = ? AND PlaylistID = ?`
      : `SELECT LikesID FROM LikesTable WHERE AnonymousID = ? AND PlaylistID = ?`;
    const row = db.prepare(sql).get(userID || anonymousID, playlistID);
    return !!row;
  },

  // 2. Add a like
  addLike: ({ userID, anonymousID, playlistID }) => {
    const sql = `
      INSERT INTO LikesTable (UserID, AnonymousID, PlaylistID)
      VALUES (?, ?, ?)
    `;
    return db.prepare(sql).run(userID || null, anonymousID || null, playlistID);
  },

  // 3. Remove a like (used to "unlike" on a second click)
  removeLike: ({ userID, anonymousID, playlistID }) => {
    const sql = userID
      ? `DELETE FROM LikesTable WHERE UserID = ? AND PlaylistID = ?`
      : `DELETE FROM LikesTable WHERE AnonymousID = ? AND PlaylistID = ?`;
    return db.prepare(sql).run(userID || anonymousID, playlistID);
  },

  // 4. Count likes for a single song
  getLikeCount: (playlistID) => {
    const sql = `SELECT COUNT(*) AS count FROM LikesTable WHERE PlaylistID = ?`;
    return db.prepare(sql).get(playlistID).count;
  },

  // 5. All PlaylistIDs this requester has liked - used to restore the
  //    liked/unliked button state when the queue is rendered
  getLikedPlaylistIds: ({ userID, anonymousID }) => {
    const sql = userID
      ? `SELECT PlaylistID FROM LikesTable WHERE UserID = ?`
      : `SELECT PlaylistID FROM LikesTable WHERE AnonymousID = ?`;
    return db
      .prepare(sql)
      .all(userID || anonymousID)
      .map((row) => row.PlaylistID);
  },
};

module.exports = LikesModel;
