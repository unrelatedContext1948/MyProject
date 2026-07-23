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

  if (adBreakText.length < 300 || adBreakText.length > 500) {
    return res.status(400).json({
      message: "Ad break text must be between 300 and 500 characters.",
    });
  }

  if (req.user.role === "admin") {
    songsAdBreak.addAdBreak(username, adBreakText, "approved");
  } else if (req.user.role === "authorized_user") {
    songsAdBreak.addAdBreak(username, adBreakText, "pending");
  } else {
    return res.status(401).json({
      message: "Role not authorized.",
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
router.post("/:id/approveAdText", authenticate, authorize("admin"), (req, res) => {
  const adBreakId = parseInt(req.params.id);

  if (!adBreakId) {
    return res.status(400).json({ message: "Invalid ad break ID" });
  }

  try {
    songsAdBreak.approveAdBreak(adBreakId);
    return res.status(200).json({ message: "Ad break text has been approved." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to approve ad break." });
  }
});

// 4. Admin denies the ad break text.
router.post("/:id/rejectedAdText", authenticate, authorize("admin"), (req, res) => {
  const adBreakId = parseInt(req.params.id);

  if (!adBreakId) {
    return res.status(400).json({ message: "Invalid ad break ID" });
  }

  try {
    songsAdBreak.rejectedAdBreak(adBreakId);
    return res.status(200).json({ message: "Ad break text has been denied." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to reject ad break." });
  }
});

// 5. Call all ad breaks that has been approved from the database.
router.get("/adBreaksToQueue", (req, res) => {
  const adBreaks = songsAdBreak.getAdBreaksToQueue();
  res.json(adBreaks);
});

module.exports = router;
