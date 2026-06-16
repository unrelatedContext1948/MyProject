/* User management for the admin dashboard.

Loads real data from GET /api/users and lets admins:
- View all users (paginated, 5 per page)
- Create new users via POST /api/users
- Delete users via DELETE /api/users/:id
*/

const USER_TABLE_LIST = 5;
let currentUserPage = 1;
let usersData = [];

document.addEventListener("DOMContentLoaded", function () {
    loadAndRenderUsers();
});

async function loadAndRenderUsers() {
    const token = localStorage.getItem("token");

    try {
        const res = await fetch("/api/users", {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
            console.error("Could not load users:", res.status);
            return;
        }

        usersData = await res.json();
    } catch (e) {
        console.error("Error fetching users:", e);
        return;
    }

    currentUserPage = 1;
    renderUserTable();
}

function renderUserTable() {
    const tbody = document.getElementById("userTableBody");
    const footer = document.getElementById("userTableFooter");
    if (!tbody || !footer) return;

    tbody.innerHTML = "";

    const totalPages = Math.ceil(usersData.length / USER_TABLE_LIST);
    const startIndex = (currentUserPage - 1) * USER_TABLE_LIST;
    const visibleUsers = usersData.slice(startIndex, startIndex + USER_TABLE_LIST);

    visibleUsers.forEach(function (element) {
        const row = document.createElement("tr");

        const deleteButton =
            element.Role !== "admin"
                ? `<button class="btn-small btn-delete" onclick="deleteUser(${element.UserID}, '${element.Username}')">Delete</button>`
                : "";

        row.innerHTML = `
            <td>${element.Username}</td>
            <td><span class="role-badge">${element.Role}</span></td>
            <td>${element.JoinDate}</td>
            <td>${deleteButton}</td>
        `;

        tbody.appendChild(row);
    });

    if (usersData.length <= USER_TABLE_LIST) {
        footer.innerHTML = "";
        return;
    }

    footer.innerHTML = `
        <div class="user-pagination">
            <button class="user-toggle-btn" onclick="showPreviousUserPage()" ${currentUserPage === 1 ? "disabled" : ""}>Previous</button>
            <p class="user-table-info">Page ${currentUserPage} of ${totalPages}</p>
            <button class="user-toggle-btn" onclick="showNextUserPage()" ${currentUserPage === totalPages ? "disabled" : ""}>Next</button>
        </div>
    `;
}

function showNextUserPage() {
    const totalPages = Math.ceil(usersData.length / USER_TABLE_LIST);
    if (currentUserPage < totalPages) {
        currentUserPage++;
        renderUserTable();
    }
}

function showPreviousUserPage() {
    if (currentUserPage > 1) {
        currentUserPage--;
        renderUserTable();
    }
}

async function deleteUser(userID, username) {
    const confirmed = confirm(`Are you sure you want to delete ${username}? This action cannot be undone.`);
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

    usersData = usersData.filter(u => u.UserID !== userID);

    const totalPages = Math.ceil(usersData.length / USER_TABLE_LIST);
    if (currentUserPage > totalPages) {
        currentUserPage = Math.max(1, totalPages);
    }

    renderUserTable();
}

// ─── Create User Form ─────────────────────────────────────────────────────────

const createUserForm = document.getElementById("createUserForm");
createUserForm.addEventListener("submit", createUser);

async function createUser(event) {
    event.preventDefault();

    const usernameInput = document.getElementById("newUsername");
    const passwordInput = document.getElementById("newPassword");
    const roleInput     = document.getElementById("newRole");

    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const role     = roleInput.value;

    const usernameError = document.getElementById("usernameError");
    const passwordError = document.getElementById("passwordError");

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

    if (!res.ok) {
        const msg = data.message || "Failed to create user.";
        if (msg.toLowerCase().includes("username")) {
            usernameError.textContent = msg;
            usernameInput.classList.add("input-error");
        } else if (msg.toLowerCase().includes("password")) {
            passwordError.textContent = msg;
            passwordInput.classList.add("input-error");
        } else {
            alert(msg);
        }
        return;
    }

    alert(`User "${username}" created successfully with role: ${role}`);
    event.target.reset();
    loadAndRenderUsers();
}

// Toggle password visibility
const passwordInputToggle = document.getElementById("newPassword");
const togglePassword      = document.getElementById("togglePassword");
const eyeIcon             = document.getElementById("eyeIcon");
const eyeIconOff          = document.getElementById("eyeIconOff");

if (passwordInputToggle && togglePassword && eyeIcon && eyeIconOff) {
    togglePassword.addEventListener("click", function () {
        if (passwordInputToggle.type === "password") {
            passwordInputToggle.type = "text";
            eyeIcon.classList.add("hidden");
            eyeIconOff.classList.remove("hidden");
            togglePassword.classList.add("active");
        } else {
            passwordInputToggle.type = "password";
            eyeIcon.classList.remove("hidden");
            eyeIconOff.classList.add("hidden");
            togglePassword.classList.remove("active");
        }
    });
}
