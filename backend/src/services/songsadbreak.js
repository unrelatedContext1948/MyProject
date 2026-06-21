const db = require("../database/database");

const songsAdbreak = {
  // 1. Add ad break text to the database.
  addAdBreak: (username, adBreakText, status) => {
    const sql = `
            INSERT INTO AdBreaksTable (AdBreakTitle, SubmittedBy, AdBreakText, AdBreakURL, Status) 
            VALUES (?, ?, ?, ?, ?)
        `;
    return db.prepare(sql).run("Ad Break", username, adBreakText, "", status);
  },

  // 2. Display pending ad breaks at the admin dashboard.
  getPendingAdBreaks: () => {
    return db
      .prepare(
        `SELECT * FROM AdBreaksTable WHERE Status = 'pending' ORDER BY AdBreakID DESC`,
      )
      .all();
  },

  // 3. Approve ad break text.
  // The status of ad break text changes from "pending" to "approved" in the database.
  approveAdBreak: (adBreakId) => {
    const sql = `
            UPDATE AdBreaksTable 
            SET Status = 'approved'
            WHERE AdBreakID = ?
         `;
    return db.prepare(sql).run(adBreakId);
  },

  // 4. Deny ad break text.
  // The ad break text that has been denied by the admin will be deleted from the database.
  rejectAdBreak: (adBreakId) => {
    const sql = `
            UPDATE AdBreaksTable 
            SET Status = 'rejected' 
            WHERE AdBreakID = ?
        `;
    return db.prepare(sql).run(adBreakId);
  },

  // 5. Call all ad breaks that has been approved from the database.
  getAdBreaksToQueue: () => {
    const sql = `
            SELECT * FROM AdBreaksTable 
            WHERE Status = ?
        `;
    return db.prepare(sql).all("approved");
  },
};
module.exports = songsAdbreak;
