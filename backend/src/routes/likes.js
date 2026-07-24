const express = require("express");
const router = express.Router();
const LikesModel = require("../models/likesModel");
const UserModel = require("../models/userModel");
const streamState = require("../services/streamState");

/*
Likes are open to everyone, logged in or not - so we can't use the
authenticate middleware here (it rejects requests without a valid
token). Instead we identify the requester ourselves:
1. If a valid Bearer token is present, use the logged-in user's ID.
2. Otherwise fall back to the anonymousId the client generated itself.
*/
function identifyRequester(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const user = UserModel.getUserByToken(token);
    if (user) return { userID: user.UserID, anonymousID: null };
  }

  const anonymousID = req.body?.anonymousId || req.query?.anonymousId;
  if (anonymousID) return { userID: null, anonymousID };

  return null;
}

// 1. Toggle a like on a song: like it if not liked yet, unlike it if already liked.
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
    const alreadyLiked = LikesModel.hasLiked({ ...requester, playlistID });

    if (alreadyLiked) {
      LikesModel.removeLike({ ...requester, playlistID });
    } else {
      LikesModel.addLike({ ...requester, playlistID });
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
      likes: LikesModel.getLikeCount(playlistID),
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    return res.status(500).json({ message: "Failed to update like." });
  }
});

// 2. Which songs has the current requester (user or anonymous browser) already liked?
//    Used on page load to restore the correct button state.
router.get("/mine", (req, res) => {
  const requester = identifyRequester(req);
  if (!requester) {
    return res.json({ likedPlaylistIds: [] });
  }

  return res.json({
    likedPlaylistIds: LikesModel.getLikedPlaylistIds(requester),
  });
});

module.exports = router;
