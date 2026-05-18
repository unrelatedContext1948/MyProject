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

//When the page load show the queue;
document.addEventListener("DOMContentLoaded", function () {
  renderQueue();
});

async function renderQueue() {
  const res = await fetch("/api/queue");
  const QUEUE = await res.json();

  const container =
    document.getElementById(
      "queueList",
    ); /* find the id queueList on the HTML */

  if (!container) return; /* if the container doesn't exist then stop */

  container.innerHTML =
    ""; /* clear whatever was there before, so theres no duplicate" */

  /* we only choose 6 items after the currently playing song, 
    so we use currentIndex + 1 as the start so the current song is NOT!!! included. */

  const visibleTrack = QUEUE.slice(currentIndex + 1, currentIndex + 7);

  if (visibleTrack.length === 0) {
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
      <span class= "queue-title-element">${element.Title}</span>
      <span class= "ad-badge">AD</span>
      </div>
      <div class="queue-adtext">${element.AdText}</div>
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
      <span class="queue-title-element">${element.Title}</span>
      </div>
      <div class="queue-submitter">Submitted by ${element.SubmittedBy}</div>
      </div>
      <div class="queue-duration">${element.Duration} </div>
      
      `;
    }
    // add 'box' to the container
    container.appendChild(box);
  }
  feather.replace(); // to change to svg icon (feather-icons)
}
