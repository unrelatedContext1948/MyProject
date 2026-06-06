const db = require("../database/database");

const songsAdbreak = {
    // 1. Call all ad breaks from the database.
    getAdBreaks: () => {
        const sql = `SELECT * FROM AdBreaksTable`;
        return db.prepare(sql).all();
    },

    // 2. Add an ad break to the database
    addAdBreak: (adData) => {
        const { username, adBreakText } = adData;
        const sql = `
            INSERT INTO AdBreaksTable (AdBreakTitle, SubmittedBy, AdBreakText, AdBreakURL, Status) 
            VALUES (?, ?, ?, ?, 'pending')
        `;

        return db.prepare(sql).run(adBreakText, username, 'pending');
    },
}
module.exports = songsAdbreak;