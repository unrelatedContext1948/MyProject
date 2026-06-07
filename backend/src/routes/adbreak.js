const express = require("express");
const songsAdBreak = require("../services/songsadbreak");
const router = express.Router();

router.post("/submitAdText", express.json(), (req, res) => {
    const { username, adBreakText } = req.body;

    //Save the submitted ad break text to the database. 
    songsAdBreak.addAdBreak(username, adBreakText);
    res.status(200).json({
         message: "Ad break text is now waiting for approval from admin." 
        });

});
module.exports = router;
