/* for volume control and now playing content 
actual playback is handled by INTEGRATION & BACKEND */

document.addEventListener("DOMContentLoaded", function () {
  showCurrentSong();
  updateVolume(70);
});

/*Show current song
-Find the current song from the queue and puts its title & submitted by  on the page.

for integration & backend:
pls call showCurrentSong() whenever the Websocket sends a new currentIndex 

*/

function showCurrentSong() {
  const song = QUEUE[currentIndex];

  if (!song) return; //if theres no song then stop

  const titleElement = document.getElementById("nowPlayingTitle");
  if (titleElement) {
    if (song.type === "adbreak") {
      titleElement.textContent = "AD Break";
    } else {
      titleElement.textContent = song.title;
    }
  }

  const submittedByElement = document.getElementById("nowPlayingSubmittedBy");
  if (song.type === "video") {
    submittedByElement.textContent = "Submitted by " + song.submittedBy;
  } else {
    submittedByElement.textContent = "";
  }
}

// Initial volume display n also when moving the slider, the number and the color will also change depending on the slide volume value , e.g volume getting louder
function updateVolume() {
  const slider = document.getElementById("volumeSlider");

  const volume = parseInt(slider.value);

  slider.value = volume;
  document.getElementById("volumeValue").textContent = volume;

  slider.style.background = `linear-gradient(
  to right,
  var(--sage-600) 0%,
  var(--sage-600) ${volume}%,
  var(--sage-200) ${volume}%,
  var(--sage-200) 100%
  )`;
}
