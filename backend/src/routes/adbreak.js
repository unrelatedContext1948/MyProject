const express = require("express");
const router = express.Router();
const songsAdbreak = require("../services/songsadbreak");
const { authenticate, authorize } = require("../middleware/authorization");

// Submit ad break text for approval (authorized users + admins)
router.post("/submit", express.json(), authenticate, authorize("admin", "authorized_user"), (req, res) => {
    const { adBreakText } = req.body;

    if (!adBreakText || adBreakText.trim().length < 50) {
        return res.status(400).json({ message: "Ad break text must be at least 50 characters." });
    }

    songsAdbreak.addAdBreak(req.user.username, adBreakText.trim());
    res.status(201).json({ message: "Ad break text submitted and waiting for admin approval." });
});

// Get all pending ad breaks (admin only)
router.get("/pending", authenticate, authorize("admin"), (req, res) => {
    const pending = songsAdbreak.getPendingAdBreaks();
    res.json(pending);
});

// Approve an ad break (admin only)
router.post("/:id/approve", authenticate, authorize("admin"), (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid id." });

    songsAdbreak.approveAdBreak(id);
    res.json({ message: "Ad break approved." });
});

// Reject an ad break (admin only)
router.post("/:id/reject", authenticate, authorize("admin"), (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid id." });

    songsAdbreak.rejectAdBreak(id);
    res.json({ message: "Ad break rejected." });
});

module.exports = router;
