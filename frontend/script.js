// Fetch user data from the backend API
async function loadUserData() {
  const token = localStorage.getItem("token");

  // If no token is found, the user is not logged in
  if (!token) {
    return;
  }

  // Fetch user data from the backend using the token for authentication
  const response = await fetch("/api/user/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    // If the token is invalid or expired, remove it from localStorage
    localStorage.clear();
    return;
  }

  const data = await response.json();

  // Update the UI based on the backend data
  document.getElementById("userRoleDisplay").textContent =
    document.getElementById("userRoleDisplay").textContent =
      data.role === "admin" ? "Admin" : "User";
  document.getElementById("navLoggedIn").classList.remove("hidden");
  document.getElementById("loginBtn").classList.add("hidden");
}
loadUserData(); // Call the function to load user data when the page loads
