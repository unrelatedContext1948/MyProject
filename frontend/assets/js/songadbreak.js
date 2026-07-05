// ––––– Submit Youtube URL Form for Users –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––-

const submitTrackForm = document.getElementById("submitTrackForm");

submitTrackForm.addEventListener("submit", submitTrack);

async function submitTrack(event) {
  event.preventDefault(); //stop the form to refresh the page and go back to the to

  const url = document.getElementById("trackURL").value.trim(); // trim to delete whitespaces
  const token = localStorage.getItem("token");
  const startTime = document.getElementById("userStartTime").value.trim();
  const endTime = document.getElementById("userEndTime").value.trim();
  const res = await fetch("/api/queue/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ VideoURL: url, StartTime: startTime, EndTime: endTime}),
  });

  if (!res.ok) {
    const data = await res.json();
    alert(data.message || "Failed to submit track. Please try again.");
    return;
  } 

  alert("Track submitted to queue!");

  event.target.reset(); // clear the form, so that it can be used for the next submission
}

// ––––– Submit Ad Break for Users –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

const submitAdBreakForm = document.getElementById("submitAdBreakForm");

submitAdBreakForm.addEventListener("submit", submitAdBreak);

async function submitAdBreak(event) {
  event.preventDefault();

  const title = document.getElementById("adBreakTitle").value.trim();
  const text = document.getElementById("adBreakText").value.trim();
  const username = localStorage.getItem("username");
  const status = localStorage.getItem("status");
  const token = localStorage.getItem("token");
  const res = await fetch("/api/adbreak/submitAdBreak", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ adBreakTitle: title, username, adBreakText: text, status }),
  });

  if (!res.ok) {
    const data = await res.json();
    alert(data.message || "Failed to submit track. Please try again.");
    return;
  }

  alert("Ad Break submitted for approval!");

  event.target.reset();
}
