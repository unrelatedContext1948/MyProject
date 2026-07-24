/* this is for 2 things: 
1. Shows the queue (always 6 items after from the current song)
2. Handles the submit song and submit ad break forms , lol sorrry i forgot to mention it in the file name */

/* Render queue function, to display the queue lists on the page

so it's kinda like a sliding window

we always show 6 items:
we start from the song after the currently playing, coz currently playing will be displayed belo the TV and not in the list
when the current song change, this function will run again, and repeat

for integration+backend, call the renderQueue() everytime the currentIndex changes.

*/

// This function is for escaping the real charecters, so attackers can not manipulate the website through commands like <img src=x onerror="alert('hallo')">
function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/* Likes: a guest without an account is identified by a random ID we
   generate once and keep in localStorage, so the same browser can't
   like the same song twice, but a fresh visit doesn't reset anything. */
function getAnonymousId() {
  let id = localStorage.getItem("anonymousId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("anonymousId", id);
  }
  return id;
}

// PlaylistIDs the current user/browser has already liked, used to restore
// the button's "liked" state after a page reload.
let likedPlaylistIds = new Set();

async function loadLikedPlaylistIds() {
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const query = token ? "" : `?anonymousId=${encodeURIComponent(getAnonymousId())}`;

  try {
    const response = await fetch(`/api/likes/mine${query}`, { headers });
    if (!response.ok) return;
    const data = await response.json();
    likedPlaylistIds = new Set(data.likedPlaylistIds || []);
  } catch (err) {
    console.error("Failed to load liked songs:", err);
  }
}

loadLikedPlaylistIds().then(() => {
  if (typeof renderQueue === "function" && Array.isArray(queue) && queue.length) {
    renderQueue();
  }
});

// Sends the like/unlike request for a song and updates the clicked button
// with the server's response (source of truth for the count).
async function toggleLike(playlistID, iconElement) {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetch(`/api/likes/${playlistID}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ anonymousId: getAnonymousId() }),
    });

    if (!response.ok) return;

    const data = await response.json();
    iconElement.classList.toggle("liked", data.liked);
    const likesNumber = iconElement.querySelector(".likes-number");
    if (likesNumber) likesNumber.textContent = data.likes;

    if (data.liked) {
      likedPlaylistIds.add(playlistID);
    } else {
      likedPlaylistIds.delete(playlistID);
    }
  } catch (err) {
    console.error("Failed to update like:", err);
  }
}

async function renderQueue() {
  const container =
    document.getElementById(
      "queueList",
    ); /* find the id queueList on the HTML */

  if (!container) return; /* if the container doesn't exist then stop */

  container.innerHTML =
    ""; /* clear whatever was there before, so theres no duplicate" */

  /* we only choose 6 items after the currently playing song, 
    so we use currentIndex + 1 as the start so the current song is NOT!!! included. */

  const visibleTrack = queue;

  if (!visibleTrack || visibleTrack.length === 0) {
    container.innerHTML = `<span> No more items in the queue</span>`;
    return;
  }

  //for each index of the array, do this function
  visibleTrack.forEach(displayQueue);

  //element, and index are provided
  function displayQueue(element, index) {
    const box = document.createElement("div");

    box.className = "queue-element"; // give a class, so it can be styled in css
    //adbreak box, with microphone logo
    if (element.type === "adbreak") {
      if (index === 0) {
        box.className = "queue-element queue-adbreak-first"; //to style on the css
      }

      box.innerHTML = `
      <div class="queue-icon ad"> 
      <i data-feather="mic"></i>
      </div>
      <div class="queue-details">
      <div class= "queue-title-box">
      <span class= "queue-title-element">${escapeHTML(element.Title)}</span>
      <span class= "ad-badge">AD</span>
      </div>
      <div class="queue-adtext">${escapeHTML(element.AdText)}</div>
      </div>
      
      `;
    } else {
      //song  box, with music logo"
      if (index === 0) {
        box.className = "queue-element queue-song-first";
      }

      box.innerHTML = `
      <div class="queue-icon song">
      <i data-feather="music"></i>
      </div>
      <div class="queue-details">
      <div class= "queue-title-box">
      <span class="queue-title-element">${escapeHTML(element.Title)} - ${escapeHTML(element.Channel)}</span>
      </div>
      <div class="queue-submitter">Submitted by ${escapeHTML(element.SubmittedBy)}</div>
      </div>
      <div class="upvote-icon${likedPlaylistIds.has(element.PlaylistID) ? " liked" : ""}">
        <i data-feather="thumbs-up"></i>
        <span class="likes-number">${element.Likes || 0}</span>
      </div>
      <div class="queue-duration">${escapeHTML(element.Duration)} </div>
      `;
    }
    const upvoteIcon = box.querySelector(".upvote-icon");
    if (upvoteIcon && element.type !== "adbreak") {
      upvoteIcon.addEventListener("click", () =>
        toggleLike(element.PlaylistID, upvoteIcon),
      );
    }
    // add 'box' to the container
    container.appendChild(box);
  }
  feather.replace(); // to change to svg icon (feather-icons)
}
