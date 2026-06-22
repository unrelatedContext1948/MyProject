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

  //------------------------------------------------------//
  //fira new update.
  //5. Call the approved ad break text to be converted to audio.
  getApprovedAdBreakText: (adBreakId) => {
    const sql = `
            SELECT AdBreakText FROM AdBreaksTable 
            WHERE AdBreakID = ?
            AND Status = ?
        `;
    return db.prepare(sql).get(adBreakId, "approved");
  },

  // 6. Save the converted ad break audio to database.
  adBreakAudio: function (adBreakId, adBreakAudio) {
    const sql = `
        UPDATE AdBreaksTable 
        SET adBreakURL = ? 
        WHERE AdBreakID = ?`;
    return db.prepare(sql).run(adBreakAudio, adBreakId);
  },

  //7. Generate the ad break audio from the approved ad break text.
  generateAudio: async function (AdBreakID) {
    //i. Get the approved text.
    const adBreakText = this.getApprovedAdBreakText(AdBreakID);

    //ii. Convert the ad break text to audio.
    const adBreakAudio = await generateAudio(adBreakText);
    return adBreakAudio;

    //iii. Save the converted ad break audio to database.
    this.adBreakAudio(AdBreakID, adBreakAudio);
  },


  // 5. Call all ad breaks that has been approved from the database.
  getApprovedAdBreaks: () => {
    const sql = `
            SELECT * FROM AdBreaksTable 
            WHERE Status = 'approved' ORDER BY AdBreakID DESC
        `;
    return db.prepare(sql).all();
  },
};
module.exports = songsAdbreak;
