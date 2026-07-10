const db = require("../database/database");
const { generateSpeech } = require("./tts");

const songsAdbreak = {
  // 1. Add ad break text to the database.
  addAdBreak: (adBreakTitle, username, adBreakText, status) => {
    const sql = `
            INSERT INTO AdBreaksTable (AdBreakTitle, SubmittedBy, AdBreakText, AdBreakURL, Status) 
            VALUES (?, ?, ?, ?, ?)
        `;
    return db.prepare(sql).run(adBreakTitle, username, adBreakText, "", status);
  },

  // 2. Display pending ad breaks at the admin dashboard.
  getPendingAdBreaks: () => {
    const sql = `
              SELECT * FROM AdBreaksTable 
              WHERE Status = 'pending' ORDER BY AdBreakID DESC
              `;
    return db.prepare(sql).all();
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
            DELETE FROM AdBreaksTable
            WHERE AdBreakID = ?
        `;
    return db.prepare(sql).run(adBreakId);
  },


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
        SET AdBreakURL = ? 
        WHERE AdBreakID = ?`;
    return db.prepare(sql).run(adBreakAudio, adBreakId);
  },

  //7. Generate the ad break audio from the approved ad break text.
  generateAudio: async function (AdBreakID) {
    //I. Get the approved text.
    const adBreakRow = this.getApprovedAdBreakText(AdBreakID);
    if (!adBreakRow) return null;
    const adBreakText = adBreakRow.AdBreakText;

    //II. Create a file for the audio
    const fileName = `adbreak_${AdBreakID}.mp3`;

    //III. Convert the ad break text to audio.
    await generateSpeech(adBreakText, fileName);

    //IV. Create the fileURL to navigate through the path
    const fileUrlForFrontend = `/assets/audio/${fileName}`;

    //V. Save the converted ad break audio to database.
    this.adBreakAudio(AdBreakID, fileUrlForFrontend);

    return fileUrlForFrontend;
  },

  // 5. Call all ad breaks that has been approved from the database.
  getApprovedAdBreaks: () => {
    const sql = `
            SELECT * FROM AdBreaksTable 
            WHERE Status = 'approved' ORDER BY AdBreakID ASC
        `;
    return db.prepare(sql).all();
  },

  deletePlayedAdBreak: (adBreakId) => {
    const sql = `
            DELETE FROM AdBreaksTable
            WHERE AdBreakID = ?
        `;
    return db.prepare(sql).run(adBreakId);
  },
};
module.exports = songsAdbreak;
