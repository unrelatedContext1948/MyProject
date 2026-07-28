const db = require("../database/database");

const LikesModel = {
  addLike: (UserID, AnonymousID, PlaylistID) => {
    const sql = `
                INSERT INTO LikesTable (UserID, AnonymousID, PlaylistID)
                VALUES (?, ?, ?)
            `;
    return db.prepare(sql).run(UserID, AnonymousID, PlaylistID);
  },

  removeLike: (UserID, AnonymousID, PlaylistID) => {
    const sql = `
                DELETE FROM LikesTable
                WHERE (UserID = ? OR AnonymousID = ?) AND PlaylistID = ?
            `;
    return db.prepare(sql).run(UserID, AnonymousID, PlaylistID);
  },

  getLikeCount: (PlaylistID) => {
    const sql = `
                SELECT COUNT(*) AS count FROM LikesTable WHERE PlayListID = ?
            `;
    return db.prepare(sql).get(PlaylistID).count;
  },

  hasLiked: (UserID, AnonymousID, PlaylistID) => {
    const sql = `
                SELECT EXISTS(SELECT 1 FROM LikesTable WHERE PlaylistID = ? AND (UserID = ? OR AnonymousID = ?)) AS liked
            `;
    const result = db.prepare(sql).get(PlaylistID, UserID, AnonymousID);
    return result.liked === 1;
  },
};

module.exports = LikesModel;