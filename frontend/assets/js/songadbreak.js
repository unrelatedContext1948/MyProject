/* Submit Track Form : when the authorized user/admin submit youtube Link
For Backend/integration replace the alert("Track submitted to queue!") with real API POST : URL, starttime endtime, submitted by */

const submitTrackForm = document.getElementById("submitTrackForm");

submitTrackForm.addEventListener("submit", submitTrack);

async function submitTrack(event) {
  event.preventDefault(); //stop the form to refresh the page and go back to the to

  const url = document.getElementById("trackURL").value.trim(); // trim to delete whitespaces
  const token = localStorage.getItem("token");
  const res = await fetch("/api/queue/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ VideoURL: url }),
  });

  if (!res.ok) {
    const data = await res.json();
    alert(data.message || "Failed to submit track. Please try again.");
    return;
  } 

  alert("Track submitted to queue!");

  event.target.reset(); // clear the form, so that it can be used for the next submission
}

/* Submit Ad Break Form : when the authorized user/admin submit youtube Link
For Backend/integration replace alert("Ad Break submitted for approval!")with real API POST : adbreaktext, and submitted by */

const submitAdBreakForm = document.getElementById("submitAdBreakForm");

submitAdBreakForm.addEventListener("submit", submitAdBreak);

function submitAdBreak(event) {
  event.preventDefault();

  const text = document.getElementById("adBreakText").value.trim();

  alert("Ad Break submitted for approval!");

  event.target.reset();
}
