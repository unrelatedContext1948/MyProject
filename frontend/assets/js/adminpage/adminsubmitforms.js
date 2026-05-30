/* Admin submit form including :
1. Submit Youtube Link with specified time stamp
2. Submit Ad break (directly added to queue list after converted to audio)
For Backend/integration replace the alert("Track submitted to queue!") with real API POST : URL, starttime endtime, submitted by 
*/

//Submit Youtube Link
const adminSubmitTrackForm = document.getElementById("adminSubmitTrackForm");

adminSubmitTrackForm.addEventListener("submit", adminSubmitTrack);

function adminSubmitTrack(event) {
  event.preventDefault(); //stop the form to refresh the page and go back to the top

  const url = document.getElementById("adminTrackURL").value.trim(); // trim to delete whitespaces
  const startTime = document.getElementById("adminStartTime").value.trim();
  const endTime = document.getElementById("adminEndTime").value.trim();

  //For Backend/integration replace the alert("Track submitted to queue!") with real API POST : URL, starttime endtime, submitted by
  alert("Track added to queue!");

  event.target.reset(); // clear the form, so that it can be used for the next submission
}

//Submit Ad Break
const submitAdBreakForm = document.getElementById("adminSubmitAdBreakForm");

submitAdBreakForm.addEventListener("submit", adminSubmitAdBreak);

function adminSubmitAdBreak(event) {
  event.preventDefault();

  const text = document.getElementById("adminAdText").value.trim();

  //For Backend/integration replace alert("Ad Break submitted for approval!")with real API POST : adbreaktext, and submitted by */
  alert("Ad Break Text submitted to queue!");

  event.target.reset();
}
