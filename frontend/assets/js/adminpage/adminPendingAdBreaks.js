/* This file is for Pending Ad Break Approval including:
- Showing the list of pending ad break submissions
-Approve button
-Reject button
*/

/*we will limit the display of the adbreak with maximum of 3
  if we have more than 3, we will show "show more" button and "show less"

  imagine if we have 15 pending Ad Breaks, then it will be superlong list
  not good for the user experience (UX)

  for better visualization, go to admin.html right click then open with live server (not the localhost3000)
*/
const socket = io();

const PENDING_AD_BREAKS_LIMIT = 3;
let pendingVisible = PENDING_AD_BREAKS_LIMIT;
let pendingItems = [];

//when the page loads, it will automatically shows the pending list
document.addEventListener("DOMContentLoaded", function () {
  renderPendingAdBreaks();
  //fira: automatically refresh the pending list when a new ad break was submitted.
  socket.on("newAdBreak", function () {
    console.log("A new ad break was submitted. Refreshing the pending list...");
    renderPendingAdBreaks();
  });
});

//To show all pending ad breaks, and for each ad break has an approve or reject button
//find the container on the admin page.html
async function renderPendingAdBreaks() {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch("/api/adbreak/pending", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      console.error("Could not load pending ad breaks:", res.status);
      return;
    }

    const data = await res.json();
    // Normalise to the shape the render functions expect
    pendingItems = data.map((item) => ({
      id: item.AdBreakID,
      title: item.AdBreakTitle,
      text: item.AdBreakText,
      submittedBy: item.SubmittedBy,
      status: item.Status,
    }));
  } catch (e) {
    console.error("Error fetching pending ad breaks:", e);
    return;
  }

  const container = document.getElementById("pendingList");
  const footer = document.getElementById("pendingFooter");
  if (!container || !footer) return;

  //clear whatever was there before
  container.innerHTML = "";
  footer.innerHTML = "";

  //if there's nothing to show
  if (pendingItems.length === 0) {
    container.innerHTML = "<p> No pending ad break submissions right now </p>";
    return;
  }

  //only show pending items up to pendingVisible (=3 Elements)
  const visiblePendingItems = pendingItems.slice(0, pendingVisible);

  //how many pending items are still hidden
  const remaining = pendingItems.length - pendingVisible;

  //for each index of the array, do this function
  visiblePendingItems.forEach(displayAdBreak);

  //element and index are provided
  function displayAdBreak(element, index) {
    const box = document.createElement("div");

    box.className = "pending-element"; // give a class, so it can be styled in css later
    box.id = "adbreak-" + element.id;

    box.innerHTML = `
      <div class="pending-header"> ${element.title} submitted by ${element.submittedBy}</div>

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

  //only show more/less button if there are more than 3 pending items
  if (pendingItems.length <= PENDING_AD_BREAKS_LIMIT) return;

  if (remaining > 0) {
    footer.innerHTML = `
   <button class="pending-toggle-btn" onclick="showMorePendingAdBreaks()">Show more submissions</button>
  `;
  } else {
    footer.innerHTML = `
    <button class="pending-toggle-btn pending-toggle-less" onclick="showLessPendingAdBreaks()">Show less</button>
    `;
  }
}

//show more adbreaks function
function showMorePendingAdBreaks() {
  pendingVisible = pendingItems.length;
  renderPendingAdBreaks();
}

//show less adbreaks function
async function showLessPendingAdBreaks() {
  pendingVisible = PENDING_AD_BREAKS_LIMIT;
  renderPendingAdBreaks();
}

//to approve an adbreak (when approve button clicked)
async function approveAdBreak(id) {
  const token = localStorage.getItem("token");

  const res = await fetch(`/api/adbreak/${id}/approveAdText`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    alert("Failed to approve ad break.");
    return;
  }

  const item = pendingItems.find((i) => i.id === id);
  if (item) item.status = "approved";

  fadeOutAndRenderAgain(id);
}

//to reject an adbreak (when reject button clicked)
async function rejectAdBreak(id) {
  const token = localStorage.getItem("token");

  const res = await fetch(`/api/adbreak/${id}/rejectAdText`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    alert("Failed to reject ad break.");
    return;
  }

  const item = pendingItems.find((i) => i.id === id);
  if (item) item.status = "rejected";
  fadeOutAndRenderAgain(id);
}

/*add animation: fade the box and then re-render
  always call this function after approve/reject button pressed
*/
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
