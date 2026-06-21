/* 
This file is for user management including:
1. shows user table
2. creates a new user
3. deletes an existing user
*/

// ───  User Table beginns ────────────────────────────────────────────────────────


const USER_TABLE_LIST = 5;
let currentUserPage = 1;
let userData = []; // This will hold the user data fetched from the backend

//when the page loads, we will fetch the user data from the backend and then render the table
document.addEventListener("DOMContentLoaded", function () {
  loadAndRenderUsers();
});

async function loadAndRenderUsers() {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch("/api/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch users");
    }

    userData = await res.json();
    renderUserTable();
  } catch (err) {
    console.error("Error loading users:", err);
    alert("Failed to load users. Please try again.");
  }
}

function renderUserTable() {
  const tbody = document.getElementById("userTableBody");
  const footer = document.getElementById("userTableFooter");
  if (!tbody || !footer) return;

  //clear whatever was there before
  tbody.innerHTML = "";



  const totalPages = Math.ceil(userData.length / USER_TABLE_LIST);

  const startIndex = (currentUserPage - 1) * USER_TABLE_LIST;
  const endIndex = startIndex + USER_TABLE_LIST;

  const visibleUsers = userData.slice(startIndex, endIndex);

  //Loop through every visible users and build table row data
  visibleUsers.forEach(displayUsers);

  //element and index are provided
  function displayUsers(element, index) {
    const row = document.createElement("tr");

    //admin will never get a delete button
    const deleteButton =
      element.Role !== "admin"
        ? `<button class="btn-small btn-delete" onclick="deleteUser('${element.UserID}', '${element.Username}')">Delete</button>`
        : "";

    row.innerHTML = `
        <td>${element.Username}</td>
        <td><span class="role-badge">${element.Role}</span></td>
        <td>${element.JoinDate}</td>
        <td>${deleteButton}</td>
        `;

    tbody.appendChild(row);
  }

  //If there are 5 users or less, no pagination is needed
  if (userData.length <= USER_TABLE_LIST) return;

  footer.innerHTML = `
    <div class="user-pagination">
    <button class="user-toggle-btn" onclick="showPreviousUserPage()" ${currentUserPage === 1 ? "disabled" : ""}>Previous</button>
    <p class="user-table-info">Page ${currentUserPage} of ${totalPages}</p>
    <button class="user-toggle-btn" onclick="showNextUserPage()" ${currentUserPage === totalPages ? "disabled" : ""}>Next</button>
    </div>
    `;
}

//show next page function
function showNextUserPage() {
  const totalPages = Math.ceil(userData.length / USER_TABLE_LIST);

  if (currentUserPage < totalPages) {
    currentUserPage++;
    renderUserTable();
  }
}

//show previous page function
function showPreviousUserPage() {
  if (currentUserPage > 1) {
    currentUserPage--;
    renderUserTable();
  }
}

// ─── Create User Form ─────────────────────────────────────────────────────────

const createUserForm = document.getElementById("createUserForm");

createUserForm.addEventListener("submit", createUser);

async function createUser(event) {
  event.preventDefault();

  const usernameInput = document.getElementById("newUsername");
  const passwordInput = document.getElementById("newPassword");
  const roleInput = document.getElementById("newRole");

  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  const role = roleInput.value;

  //for displaying small message under the form if criteria doesn't match
  const usernameError = document.getElementById("usernameError");
  const passwordError = document.getElementById("passwordError");


  //Clear old errors
  usernameError.textContent = "";
  passwordError.textContent = "";

  usernameInput.classList.remove("input-error");
  passwordInput.classList.remove("input-error");

  const token = localStorage.getItem("token");

    const res = await fetch("/api/users", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username, password, role }),
    });

    const data = await res.json();
    
    // if the response was not okay, error messages will be shown
    // as in the defined error messages in the backend (look at routes/users.js)
    if (!res.ok) {
        const msg = data.message || "Failed to create user.";
        if (msg.toLowerCase().includes("username")) {
            usernameError.textContent = msg;
            usernameInput.classList.add("input-error");
        } else if (msg.toLowerCase().includes("password")) {
            passwordError.textContent = msg;
            passwordInput.classList.add("input-error");
        } else if (msg.toLowerCase().includes("role")) {
            alert(msg);
        }
        return;
    }

    alert(`User "${username}" created successfully with role: ${role}`);
    event.target.reset();
    loadAndRenderUsers();
}

//Toggle password visibility
const passwordInput = document.getElementById("newPassword");
const togglePassword = document.getElementById("togglePassword");
const eyeIcon = document.getElementById("eyeIcon");
const eyeIconOff = document.getElementById("eyeIconOff");

if (passwordInput && togglePassword && eyeIcon && eyeIconOff) {
  togglePassword.addEventListener("click", function () {
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      eyeIcon.classList.add("hidden");
      eyeIconOff.classList.remove("hidden");
      togglePassword.classList.add("active");
    } else {
      passwordInput.type = "password";
      eyeIcon.classList.remove("hidden");
      eyeIconOff.classList.add("hidden");
      togglePassword.classList.remove("active");
    }
  });
}

// ─── Delete User Form ─────────────────────────────────────────────────────────

async function deleteUser(userID, username) {
  //confirmation
  const confirmed = confirm(
    `Are you sure you want to delete ${username}? this action cannot be undone`,
  );

  if (!confirmed) return;

    const token = localStorage.getItem("token");

    const res = await fetch(`/api/users/${userID}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
        alert("Failed to delete user.");
        return;
    }

    alert(`User "${username}" deleted successfully.`);

    //after deleting the user, we need to remove it from the userData array and re-render the table
    userData = userData.filter((user) => user.UserID !== parseInt(userID));

    const totalPages = Math.ceil(userData.length / USER_TABLE_LIST);

    if (currentUserPage > totalPages) {
      currentUserPage = Math.max(1, totalPages);
    }

    renderUserTable();
}
