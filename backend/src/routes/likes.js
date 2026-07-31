const express = require("express");
const router = express.Router();
const likesModel = require("../models/likesModel");
const userModel = require("../models/userModel");
const streamState = require("../services/streamState");

function identifyRequester(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const user = userModel.getUserByToken(token);
    if (user) return { userID: user.UserID, anonymousID: null };
  }

  const anonymousID = req.body?.anonymousId || req.query?.anonymousId;
  if (anonymousID) return { userID: null, anonymousID };

  return null;
}

// Sets, switches, or removes a like/dislike, Reddit-style:
// - clicking the same button again removes the reaction
// - clicking the other button switches it
// - clicking either button for the first time adds it
router.post("/:playlistId", express.json(), (req, res) => {
  const playlistID = parseInt(req.params.playlistId);
  const { type } = req.body;

  if (!playlistID) {
    return res.status(400).json({ message: "Invalid playlist ID" });
  }

  if (type !== "like" && type !== "dislike") {
    return res.status(400).json({
      message: "type must be 'like' or 'dislike'.",
    });
  }

  const requester = identifyRequester(req);
  if (!requester) {
    return res.status(400).json({
      message: "Login token or anonymousId is required to react to a song.",
    });
  }

  try {
    const currentType = likesModel.getReactionType(
      requester.userID,
      requester.anonymousID,
      playlistID,
    );

    if (currentType === type) {
      likesModel.removeReaction(
        requester.userID,
        requester.anonymousID,
        playlistID,
      );
    } else {
      // A row for this identity+song already exists (the opposite type) -
      // remove it first so the UNIQUE constraint doesn't reject the insert below.
      if (currentType) {
        likesModel.removeReaction(
          requester.userID,
          requester.anonymousID,
          playlistID,
        );
      }
      likesModel.addReaction(
        requester.userID,
        requester.anonymousID,
        playlistID,
        type,
      );
    }

    // Songs are ordered by score, so a change here reorders the queue
    // for everyone - refresh the shared queue and broadcast it.
    streamState.refreshQueue();
    const io = req.app.get("io");
    if (io) {
      io.emit("queueUpdated", streamState.getCurrentStream());
    }

    return res.status(200).json({
      reaction: currentType === type ? null : type,
      likes: likesModel.getLikeCount(playlistID),
      dislikes: likesModel.getDislikeCount(playlistID),
      score: likesModel.getScore(playlistID),
    });
  } catch (error) {
    console.error("Error toggling reaction:", error);
    return res.status(500).json({ message: "Failed to update reaction." });
  }
});

module.exports = router;
