const db = require("../database/database");

const LikesModel = {
  addReaction: (UserID, AnonymousID, PlaylistID, Type) => {
    const sql = `
                INSERT INTO LikesTable (UserID, AnonymousID, PlaylistID, Type)
                VALUES (?, ?, ?, ?)
            `;
    return db.prepare(sql).run(UserID, AnonymousID, PlaylistID, Type);
  },

  removeReaction: (UserID, AnonymousID, PlaylistID) => {
    const sql = `
                DELETE FROM LikesTable
                WHERE (UserID = ? OR AnonymousID = ?) AND PlaylistID = ?
            `;
    return db.prepare(sql).run(UserID, AnonymousID, PlaylistID);
  },

  // Returns 'like', 'dislike', or null if this identity hasn't reacted to the song yet.
  getReactionType: (UserID, AnonymousID, PlaylistID) => {
    const sql = `
                SELECT Type FROM LikesTable
                WHERE PlaylistID = ? AND (UserID = ? OR AnonymousID = ?)
            `;
    const result = db.prepare(sql).get(PlaylistID, UserID, AnonymousID);
    return result ? result.Type : null;
  },

  getLikeCount: (PlaylistID) => {
    const sql = `
                SELECT COUNT(*) AS count FROM LikesTable WHERE PlaylistID = ? AND Type = 'like'
            `;
    return db.prepare(sql).get(PlaylistID).count;
  },

  getDislikeCount: (PlaylistID) => {
    const sql = `
                SELECT COUNT(*) AS count FROM LikesTable WHERE PlaylistID = ? AND Type = 'dislike'
            `;
    return db.prepare(sql).get(PlaylistID).count;
  },

  // Likes minus dislikes - this is the value the queue gets sorted by.
  getScore: (PlaylistID) => {
    const sql = `
                SELECT
                    SUM(CASE WHEN Type = 'like' THEN 1 ELSE 0 END) -
                    SUM(CASE WHEN Type = 'dislike' THEN 1 ELSE 0 END) AS score
                FROM LikesTable WHERE PlaylistID = ?
            `;
    const result = db.prepare(sql).get(PlaylistID);
    return result.score || 0;
  },
};

module.exports = LikesModel;
