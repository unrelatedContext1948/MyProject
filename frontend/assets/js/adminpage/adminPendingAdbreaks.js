/* This file is for Pending Ad Break Approval including:
- Showing the list of pending ad break submissions
-Approve button
-Reject button
*/

//when the page loads, it will automatically shows the pending list
document.addEventListener("DOMContentLoaded", function () {
  renderPendingAdBreaks();
});

//To show all pending ad breaks, and for each ad break has an approve or reject button

//find the container on the admin page.html
function renderPendingAdBreaks() {
  const container = document.getElementById("pendingList");
  if (!container) return;

  //clear whatever was there before
  container.innerHTML = "";

  //Backend/integration will replace this with real data from database:

  /*Filter the item with status pending from arrays PENDING_AD_BREAKS from admindata.js 
  a.k.a fake database for UI designer purpose only, still static! 
  
  integration/backend should adjust this with the real data on the database
  */
  const pendingItems = PENDING_AD_BREAKS.filter(function (element) {
    return element.status === "pending";
  });

  //if there's nothing to show, display empty state
  if (pendingItems.length === 0) {
    container.innerHTML = "<p> No pending ad break submissions right now </p>";
    return;
  }

  //for each index of the array, do this function
  pendingItems.forEach(displayAdBreak);

  //element and index are provided
  function displayAdBreak(element, index) {
    const box = document.createElement("div");

    box.className = "pending-element"; // give a class, so it can be styled in css later
    box.id = "adbreak-" + element.id;

    box.innerHTML = `
      <div class="pending-header">Submitted by ${element.submittedBy}</div>
      <div class="pending-text">${element.text}</div> 
      <div class="pending-actions">
      <button class="btn-icon btn-approve" onclick="approveAdBreak(${element.id})"
      title="Approve"> 
      <i data-feather="check"></i>
      </button>
      <button class="btn-icon btn-reject" onclick="rejectAdBreak(${element.id})"
      title="Reject"> <i data-feather="x"></i> </button>
      </div>
      `;

    container.appendChild(box);
  }
  feather.replace();
}

//to approve an adbreak (when approve button clicked)
function approveAdBreak(id) {
  /* integration/backend add API method POST here to tell server that ad was being approved
    if respon ok then call the function fadeOutRenderAgain(id);
  */

  //this is only for UI dummy data, can be deleted after it's already connected to the backend
  const item = PENDING_AD_BREAKS.find(function (element) {
    return element.id === id;
  });

  if (item) {
    item.status = "approved";
  }

  fadeOutAndRenderAgain(id);
}

//to reject an adbreak (when reject button clicked)
function rejectAdBreak(id) {
  /* integration/backend add API method POST here to tell server that ad was being rejected
     if respon ok then call the function fadeOutRenderagain(id);
  */

  //this is only for UI dummy data, can be deleted after it's already connected to the backend
  const item = PENDING_AD_BREAKS.find(function (element) {
    return element.id === id;
  });

  if (item) {
    item.status = "rejected";
  }

  fadeOutAndRenderAgain(id);
}

//add animation: fade the box and then re-render
function fadeOutAndRenderAgain(id) {
  const box = document.getElementById("adbreak-" + id);

  if (box) {
    box.style.transition = "opacity 0.3s";
    box.style.opacity = "0";

    //re-render the function after 0.3s
    setTimeout(function () {
      renderPendingAdBreaks();
    }, 300);
  }
}
