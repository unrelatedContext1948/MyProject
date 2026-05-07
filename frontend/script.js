// Fetch user data from the backend API
async function loadUserData() {
  const response = await fetch("/api/user");
  const data = await response.json();

  // Update the UI based on the backend data
  if (data.isLoggedIn) {
    document.getElementById("navUsername").innerText = data.username;
    document.getElementById("navRoleDisplay").innerText = data.role;
    document.getElementById("navLoggedIn").classList.remove("hidden");
    document.getElementById("navLoggedOut").classList.add("hidden");
  }
}
loadUserData();

// Fetch playlist data from the backend API and display it
async function loadPlaylist() {
  const mainContent = document.getElementById("mainContent");

  try {
    const response = await fetch("/api/queue");

    if (!response.ok) {
      throw new Error("Error while fetching playlist: ");
    }

    const songs = await response.json();
    console.log("Songs from DB:", songs);

    //Check if there are songs in the playlist
    if (songs.length === 0) {
      mainContent.innerHTML =
        '<p class="empty-msg">The playlist is currently empty.</p>';
      return;
    }

    let htmlBuffer = '<div class="playlist-grid">';

    songs.forEach((song) => {
      htmlBuffer += `
        <div class="song-card">
            <div class="song-info">
                <h3 class="song-title">${song.Title || "Kein Titel gefunden"}</h3>
                <p class="song-artist">${song.Channel || "Unbekannter Kanal"}</p>
            </div>
            <div class="song-meta">
                <span>Dauer: ${song.Duration || "--:--"}</span>
            </div>
        </div>
    `;
    });

    htmlBuffer += "</div>";

    mainContent.innerHTML = htmlBuffer;
  } catch (error) {
    console.error("Fetch-Fehler:", error);
    mainContent.innerHTML =
      '<p class="error-msg">Connection to server failed.</p>';
  }
}

document.addEventListener("DOMContentLoaded", loadPlaylist);
