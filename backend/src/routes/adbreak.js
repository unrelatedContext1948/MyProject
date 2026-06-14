const express = require("express");
const songsAdBreak = require("../services/songsadbreak");
const router = express.Router();

// 1. User adds the ad break text.
router.post("/submitAdText", (req, res) => {
    const { username, adBreakText } = req.body;
    
    if (!adBreakText){
        return res.status(400).json({
            message: "Please insert the ad break text."});
    }else{
        songsAdBreak.addAdBreak(username, adBreakText);
        res.status(200).json({
            message: "Ad break text is now waiting for approval from admin." 
            });
    }
});

// 2. Display pending ad break texts at the admin dashboard.
router.get("/pendingAdBreaks", (req, res) => {
    const pendingAdBreaks = songsAdBreak.getPendingAdBreaks();
    res.json(pendingAdBreaks);
});

// 3. Admin approves the ad break text. 
router.post("/approveAdText", (req, res) => {
    const { adBreakId } = req.body;

    songsAdBreak.approveAdBreak(adBreakId);
    res.status(200).json({
        message: "Ad break text has been approved."
    });
});

// 4. Admin denies the ad break text.
router.post("/deniedAdText", (req, res) => {
    const { adBreakId } = req.body;

    songsAdBreak.deniedAdBreak(adBreakId);
    res.status(200).json({
        message: "Ad break text has been denied."
    });
});

// 5. Call all ad breaks that has been approved from the database.
router.get("/adBreaksToQueue", (req, res) => {
    const adBreaks = songsAdBreak.getAdBreaksToQueue();
    res.json(adBreaks);
});
module.exports = router;