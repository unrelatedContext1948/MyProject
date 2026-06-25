const db = require("../database/database");

const songsAdbreak = {
    getAdBreaks: () => {
        return db.prepare(`SELECT * FROM AdBreaksTable`).all();
    },

    getPendingAdBreaks: () => {
        return db.prepare(`SELECT * FROM AdBreaksTable WHERE Status = 'pending' ORDER BY AdBreakID DESC`).all();
    },

    getApprovedAdBreaks: () => {
        return db.prepare(`SELECT * FROM AdBreaksTable WHERE Status = 'approved'`).all();
    },

    // adBreakTitle defaults to the first 40 chars of the text if not provided separately
    addAdBreak: (username, adBreakText) => {
        const title = adBreakText.slice(0, 40).trim() + (adBreakText.length > 40 ? '…' : '');
        return db.prepare(`
            INSERT INTO AdBreaksTable (AdBreakTitle, SubmittedBy, AdBreakText, AdBreakURL, Status)
            VALUES (?, ?, ?, '', 'pending')
        `).run(title, username, adBreakText);
    },

    approveAdBreak: (id) => {
        return db.prepare(`UPDATE AdBreaksTable SET Status = 'approved' WHERE AdBreakID = ?`).run(id);
    },

    rejectAdBreak: (id) => {
        return db.prepare(`DELETE FROM AdBreaksTable WHERE AdBreakID = ?`).run(id);
    },
};

module.exports = songsAdbreak;
