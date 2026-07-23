/*
Queue display – renders the "Up Next" list (max 6 items).

Uses `mergedQueue` from player.js, which already contains ad-break
placeholders inserted by the server at the right positions.

Call renderQueue() whenever currentIndex or mergedQueue changes.
*/

function escapeHTML(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function renderQueue() {
    const container = document.getElementById("queueList");
    if (!container) return;

    container.innerHTML = "";

    // mergedQueue is the display queue (songs + ad-break entries) from the server.
    // It already contains only the items after the currently playing song.
    const visibleTracks = mergedQueue.slice(0, 6);

    if (visibleTracks.length === 0) {
        container.innerHTML = `<span class="queue-empty">Queue is looping – hang tight!</span>`;
        return;
    }

    visibleTracks.forEach(displayQueueItem);

    function displayQueueItem(element, index) {
        const box = document.createElement("div");
        box.className = "queue-element";

        if (element.type === "adbreak") {
            if (index === 0) box.className += " queue-adbreak-first";

            box.innerHTML = `
                <div class="queue-icon ad">
                    <i data-feather="mic"></i>
                </div>
                <div class="queue-details">
                    <div class="queue-title-box">
                        <span class="queue-title-element">${escapeHTML(element.Title)}</span>
                        <span class="ad-badge">AD</span>
                    </div>
                    <div class="queue-adtext">${escapeHTML(element.AdText || "")}</div>
                </div>
            `;
        } else {
            if (index === 0) box.className += " queue-song-first";

            box.innerHTML = `
                <div class="queue-icon song">
                    <i data-feather="music"></i>
                </div>
                <div class="queue-details">
                    <div class="queue-title-box">
                        <span class="queue-title-element">${escapeHTML(element.Title)} - ${escapeHTML(element.Channel)}</span>
                    </div>
                    <div class="queue-submitter">Submitted by ${escapeHTML(element.SubmittedBy)}</div>
                </div>
                <div class="queue-duration">${escapeHTML(element.Duration || "")}</div>
            `;
        }

        container.appendChild(box);
    }

    feather.replace();
}
