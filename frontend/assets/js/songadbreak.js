// Submit YouTube link (authorized users)
const submitTrackForm = document.getElementById("submitTrackForm");
submitTrackForm.addEventListener("submit", submitTrack);

async function submitTrack(event) {
    event.preventDefault();

    const url = document.getElementById("trackURL").value.trim();
    const token = localStorage.getItem("token");

    const res = await fetch("/api/queue/submit", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ VideoURL: url }),
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.message || "Failed to submit track. Please try again.");
        return;
    }

    alert("Track submitted to queue!");
    event.target.reset();
}

// Submit ad break text for admin approval (authorized users + admins)
const submitAdBreakForm = document.getElementById("submitAdBreakForm");
submitAdBreakForm.addEventListener("submit", submitAdBreak);

async function submitAdBreak(event) {
    event.preventDefault();

    const text = document.getElementById("adBreakText").value.trim();
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
        alert(data.message || "Failed to submit ad break. Please try again.");
        return;
    }

    alert("Ad break submitted for admin approval!");
    event.target.reset();
}
