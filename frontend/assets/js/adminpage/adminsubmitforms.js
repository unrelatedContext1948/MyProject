// Admin: Submit YouTube link with optional start/end time
const adminSubmitTrackForm = document.getElementById("adminSubmitTrackForm");
adminSubmitTrackForm.addEventListener("submit", adminSubmitTrack);

async function adminSubmitTrack(event) {
    event.preventDefault();

    const url = document.getElementById("adminTrackURL").value.trim();
    const startTime = document.getElementById("adminStartTime").value.trim() || null;
    const endTime = document.getElementById("adminEndTime").value.trim() || null;
    const token = localStorage.getItem("token");

    const res = await fetch("/api/queue/submit", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ VideoURL: url, StartTime: startTime, EndTime: endTime }),
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.message || "Failed to add track. Please try again.");
        return;
    }

    alert("Track added to queue!");
    event.target.reset();
}

// Admin: Submit ad break text directly (bypasses approval, goes to approved)
const adminSubmitAdBreakForm = document.getElementById("adminSubmitAdBreakForm");
adminSubmitAdBreakForm.addEventListener("submit", adminSubmitAdBreak);

async function adminSubmitAdBreak(event) {
    event.preventDefault();

    const text = document.getElementById("adminAdText").value.trim();
    const token = localStorage.getItem("token");

    const res = await fetch("/api/adbreaks/submit", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ adBreakText: text }),
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.message || "Failed to submit ad break.");
        return;
    }

    alert("Ad break submitted!");
    event.target.reset();
    // Refresh the pending list so the admin sees their own submission
    if (typeof loadAndRenderPending === "function") loadAndRenderPending();
}
