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

router.post("/:playlistId", express.json(), (req, res) => {
  const playlistID = parseInt(req.params.playlistId);

  if (!playlistID) {
    return res.status(400).json({ message: "Invalid playlist ID" });
  }

  const requester = identifyRequester(req);
  if (!requester) {
    return res.status(400).json({
      message: "Login token or anonymousId is required to like a song.",
    });
  }

  try {
    const alreadyLiked = likesModel.hasLiked(
      requester.userID,
      requester.anonymousID,
      playlistID,
    );

    if (alreadyLiked) {
      likesModel.removeLike(
        requester.userID,
        requester.anonymousID,
        playlistID,
      );
    } else {
      likesModel.addLike(requester.userID, requester.anonymousID, playlistID);
    }

    // Songs are ordered by like count, so a change here reorders the queue
    // for everyone - refresh the shared queue and broadcast it.
    streamState.refreshQueue();
    const io = req.app.get("io");
    if (io) {
      io.emit("queueUpdated", streamState.getCurrentStream());
    }

    return res.status(200).json({
      liked: !alreadyLiked,
      likes: likesModel.getLikeCount(playlistID),
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    return res.status(500).json({ message: "Failed to update like." });
  }
});

module.exports = router;
