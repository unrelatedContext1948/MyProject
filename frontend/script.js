// Fetch user data from the backend API
async function loadUserData() {
  const response = await fetch("/api/user");
  const data = await response.json();

  // Update the UI based on the backend data
  if (data.isLoggedIn) {
    document.getElementById("navUsername").innerText = data.username;
    document.getElementById("navRoleBadge").innerText = data.role;
    document.getElementById("navLoggedIn").classList.remove("hidden");
    document.getElementById("navLoggedOut").classList.add("hidden");
  }

loadUserData();
