const express = require("express");
const songsAdBreak = require("../services/songsadbreak");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/authorization");

// 1. Users add the ad break text.
router.post("/submitAdText", express.json(), authenticate, (req, res) => {
  const { username, adBreakText } = req.body;

  if (!adBreakText) {
    return res.status(400).json({
      message: "Please insert the ad break text.",
    });
  }

  if (req.user.role === "admin") {
    songsAdBreak.addAdBreak(username, adBreakText, "approved");
  } else if (req.user.role === "user") {
    songsAdBreak.addAdBreak(username, adBreakText, "pending");
  } else {
    return res.status(401).json({
      message: "The current role is nor provided",
    });
  }
  res.status(200).json({ message: "Ad break submitted successfully!" });
});

// 2. Display pending ad break texts at the admin dashboard.
router.get("/pending", authenticate, authorize("admin"), (req, res) => {
  const pendingAdBreaks = songsAdBreak.getPendingAdBreaks();
  res.json(pendingAdBreaks);
});

// 3. Admin approves the ad break text.
router.post(
  "/:id/approveAdText",
  authenticate,
  authorize("admin"),
  (req, res) => {
    const adBreakId = parseInt(req.params.id);

    if (!adBreakId) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    try {
      songsAdBreak.approveAdBreak(adBreakId);
      return res
        .status(200)
        .json({ message: "Ad break text has been approved." });
    } catch (error) {
      return res.status(500).json({ message: "Failed to approve ad break." });
    }
  },
);

// 4. Admin denies the ad break text.
router.post(
  "/:id/rejectAdText",
  authenticate,
  authorize("admin"),
  (req, res) => {
    const adBreakId = parseInt(req.params.id);

    if (!adBreakId) {
      return res.status(400).json({ message: "Invalid ad break ID" });
    }

    try {
      songsAdBreak.rejectAdBreak(adBreakId);
      return res
        .status(200)
        .json({ message: "Ad break text has been denied." });
    } catch (error) {
      return res.status(500).json({ message: "Failed to reject ad break." });
    }
  },
);

//------------------------------------------------//
//fira new update.
//5. Convert the ad break text to audio and save the audio to database.
router.get("/generateAudio", async(req, res) => {
    const { adBreakId } = req.query;
    await songsAdBreak.generateAudio(adBreakId);
    res.status(200).json({
        message: " Ad break audio is successfully generated."
    });
});
//-----------------------------------------------------//

// 8. Call all ad breaks that has been approved from the database.
router.get("/adBreaksToQueue", (req, res) => {
  const adBreaks = songsAdBreak.getAdBreaksToQueue();
  res.json(adBreaks);
});
module.exports = router;
