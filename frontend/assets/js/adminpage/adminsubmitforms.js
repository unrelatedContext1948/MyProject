/* Admin submit form including :
1. Submit Youtube Link with specified time stamp
2. Submit Ad break (directly added to queue list after converted to audio)
For Backend/integration replace the alert("Track submitted to queue!") with real API POST : URL, starttime endtime, submitted by 
*/

// ––––––– Submit Youtube Link for Admin –––––––––––––––––––––––––––––––––––––––––––––––––––
const adminSubmitTrackForm = document.getElementById("adminSubmitTrackForm");

adminSubmitTrackForm.addEventListener("submit", adminSubmitTrack);

async function adminSubmitTrack(event) {
  event.preventDefault(); //stop the form to refresh the page and go back to the top

  const url = document.getElementById("adminTrackURL").value.trim(); // trim to delete whitespaces
  const startTIme = document.getElementById("adminStartTime").value.trim();
  const endTime = document.getElementById("adminEndTime").value.trim();
  const token = localStorage.getItem("token");
  const res = await fetch("/api/queue/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ VideoURL: url, StartTime: startTime, EndTime: endTime }),
  });

  if (!res.ok) {
    const data = await res.json();
    alert(data.message || "Failed to submit track. Please try again.");
    return;
  } 

  alert("Track submitted to queue!");

  event.target.reset(); // clear the form, so that it can be used for the next submission

}


// –––––– Submit Ad Break for Admin –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
const submitAdBreakForm = document.getElementById("adminSubmitAdBreakForm");

submitAdBreakForm.addEventListener("submit", adminSubmitAdBreak);

async function adminSubmitAdBreak(event) {
  event.preventDefault();

  const text = document.getElementById("adminAdText").value.trim();
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  const status = localStorage.getItem("status");
  const res = await fetch("/api/adbreak/submitAdText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ username, adBreakText: text }),
  });

  if (!res.ok) {
    const data = await res.json();
    alert(data.message || "Failed to submit track. Please try again.");
    return;
  }

  alert("Ad Break Text submitted to queue!");

  event.target.reset();
}
