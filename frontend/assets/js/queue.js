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
      <div class="upvote-icon">
        <i data-feather="thumbs-up"></i>  
        <span class="likes-number">0</span>
      </div>
      <div class="queue-duration">${escapeHTML(element.Duration)} </div>
      `;
    }
    box.querySelector(".upvote-icon")?.addEventListener("click", function () {
      this.classList.toggle("liked");
    });
    // add 'box' to the container
    container.appendChild(box);
  }
  feather.replace(); // to change to svg icon (feather-icons)
}
