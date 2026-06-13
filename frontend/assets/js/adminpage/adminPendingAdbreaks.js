/*
Pending Ad Break Approvals for the admin dashboard.

Loads real data from GET /api/adbreaks/pending and lets admins
approve or reject each submission.
*/

const PENDING_AD_BREAKS_LIMIT = 3;
let pendingVisible = PENDING_AD_BREAKS_LIMIT;
let pendingItems = [];

document.addEventListener("DOMContentLoaded", loadAndRenderPending);

async function loadAndRenderPending() {
    const token = localStorage.getItem("token");

    try {
        const res = await fetch("/api/adbreaks/pending", {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
            console.error("Could not load pending ad breaks:", res.status);
            return;
        }

        const data = await res.json();
        // Normalise to the shape the render functions expect
        pendingItems = data.map(item => ({
            id: item.AdBreakID,
            text: item.AdBreakText,
            submittedBy: item.SubmittedBy,
            status: item.Status,
        }));
    } catch (e) {
        console.error("Error fetching pending ad breaks:", e);
        return;
    }

    renderPendingAdBreaks();
}

function renderPendingAdBreaks() {
    const container = document.getElementById("pendingList");
    const footer = document.getElementById("pendingFooter");
    if (!container || !footer) return;

    container.innerHTML = "";
    footer.innerHTML = "";

    const pending = pendingItems.filter(item => item.status === "pending");

    if (pending.length === 0) {
        container.innerHTML = "<p>No pending ad break submissions right now.</p>";
        return;
    }

    const visible = pending.slice(0, pendingVisible);
    const remaining = pending.length - pendingVisible;

    visible.forEach(displayAdBreak);

    function displayAdBreak(element) {
        const box = document.createElement("div");
        box.className = "pending-element";
        box.id = "adbreak-" + element.id;

        box.innerHTML = `
            <div class="pending-header">Submitted by ${element.submittedBy}</div>
            <div class="pending-text">${element.text}</div>
            <div class="pending-actions">
                <button class="btn-icon btn-approve" onclick="approveAdBreak(${element.id})" title="Approve">
                    <i data-feather="check"></i>
                </button>
                <button class="btn-icon btn-reject" onclick="rejectAdBreak(${element.id})" title="Reject">
                    <i data-feather="x"></i>
                </button>
            </div>
        `;
        container.appendChild(box);
    }

    feather.replace();

    if (pending.length <= PENDING_AD_BREAKS_LIMIT) return;

    if (remaining > 0) {
        footer.innerHTML = `<button class="pending-toggle-btn" onclick="showMorePendingAdBreaks()">Show more submissions</button>`;
    } else {
        footer.innerHTML = `<button class="pending-toggle-btn pending-toggle-less" onclick="showLessPendingAdBreaks()">Show less</button>`;
    }
}

function showMorePendingAdBreaks() {
    pendingVisible = pendingItems.filter(i => i.status === "pending").length;
    renderPendingAdBreaks();
}

function showLessPendingAdBreaks() {
    pendingVisible = PENDING_AD_BREAKS_LIMIT;
    renderPendingAdBreaks();
}

async function approveAdBreak(id) {
    const token = localStorage.getItem("token");

    const res = await fetch(`/api/adbreaks/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
        alert("Failed to approve ad break.");
        return;
    }

    const item = pendingItems.find(i => i.id === id);
    if (item) item.status = "approved";
    fadeOutAndRenderAgain(id);
}

async function rejectAdBreak(id) {
    const token = localStorage.getItem("token");

    const res = await fetch(`/api/adbreaks/${id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
        alert("Failed to reject ad break.");
        return;
    }

    const item = pendingItems.find(i => i.id === id);
    if (item) item.status = "rejected";
    fadeOutAndRenderAgain(id);
}

function fadeOutAndRenderAgain(id) {
    const box = document.getElementById("adbreak-" + id);
    if (box) {
        box.style.transition = "opacity 0.3s";
        box.style.opacity = "0";
        setTimeout(renderPendingAdBreaks, 300);
    }
}
