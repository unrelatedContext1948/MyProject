/*to handle logout from adminpage
different behaviour from logout() for the authorized user:
- same token invalidation logic
- redirects to index.html instead of resetting navbar elements
  (which don't exist on admin.html)
*/

async function logoutAdmin() {
  const token = localStorage.getItem("token");

  await fetch("/api/auth/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  }).then((response) => {
    if (response.ok) {
      console.log("Admin successfully logged out from backend");
    } else {
      console.error("Failed to log out from backend");
    }
  });

  localStorage.clear();

  window.location.href = "index.html";
}
