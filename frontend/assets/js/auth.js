//depends on data.js for the demo credential

//Modal Pop up
function openLoginModal() {
  document.getElementById("loginModal").classList.add("active");
}

function closeLoginModal() {
  document.getElementById("loginModal").classList.remove("active");
}

const AuthState = {
  user: null,
  role: null,
};

//For Login
const handleLoginForm = document.getElementById("handleLoginForm");
const usernameInput = document.getElementById("loginUsername");
const passwordInput = document.getElementById("loginPassword");

if (usernameInput && passwordInput) {
  usernameInput.addEventListener("input", () =>
    usernameInput.classList.remove("input-error"),
  );
  passwordInput.addEventListener("input", () =>
    passwordInput.classList.remove("input-error"),
  );
}

if (handleLoginForm) {
  handleLoginForm.addEventListener("submit", handleLogin);
}

async function handleLogin(event) {
  event.preventDefault();

  const username = usernameInput.value.trim(); //trim to delete whitespaces
  const password = passwordInput.value;

  //Integration/backend should change this ! with fetch API method POST
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  //If nothing was found (wrong username or wrong password) then show error, integration/backend should also adjust this part
  if (!response.ok) {
    alert(data.message || "Invalid username or password.");
    usernameInput.value = "";
    passwordInput.value = "";

    usernameInput.classList.add("input-error");
    passwordInput.classList.add("input-error");

    usernameInput.focus();
    return;
  }

  // If login is successful, we will receive the token and role from the backend
  const role = data.role;
  const token = data.token;

  // ave token and role in localStorage for persistence across pages and sessions
  localStorage.setItem("token", token);
  localStorage.setItem("role", role);
  localStorage.setItem("username", username);

  // update the AuthState object to reflect the current user's authentication status and role.
  AuthState.user = username;
  AuthState.role = role;

  // Clear the login form inputs after successful login
  usernameInput.value = "";
  passwordInput.value = "";

  // close the login modal and show the user's role in the navbar.
  closeLoginModal();
  showRole(role);
}



//Role bagde next to logout button after succesfully logging in
function showRole(role) {
  document.getElementById("loginBtn").classList.add("hidden");
  document.getElementById("navLoggedIn").classList.remove("hidden");
  document.getElementById("userRoleDisplay").textContent =
    role === "admin" ? "Admin" : "User"; //to show which role we have now after logging in

  if (role === "admin") {
    window.location.href = "admin.html"; //redirect to separate admin page
  } else {
    document.getElementById("submissionSection").classList.remove("hidden");
  }
}

//Logout
async function logout() {
  // Remove token and role from localStorage
  const token = localStorage.getItem("token");

  /* SECURITY NOTE: Why do we call the backend for logout?
     If we only cleared the token locally via localStorage, the token would still be 
     theoretically valid on the server. If a hacker had previously intercepted or 
     stolen this token, they could continue making authorized requests to our protected 
     routes (like queue management) indefinitely. 
     By sending a POST request to the backend, we explicitly tell the server to invalidate 
     and destroy this session token immediately. This shuts down any active access 
     and ensures a true, secure full-stack logout.
   */
  await fetch("/api/auth/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  }).then((response) => {
    if (response.ok) {
      console.log("Successfully logged out from backend");
    } else {
      console.error("Failed to log out from backend");
    }
  });

  // Clear localStorage and reset AuthState to reflect that the user is no longer authenticated.
  localStorage.clear();

  if (typeof AuthState !== "undefined") {
    AuthState.user = null;
    AuthState.role = null;
  }

  //to reset navbar
  document.getElementById("loginBtn").classList.remove("hidden");
  document.getElementById("navLoggedIn").classList.add("hidden");

  // Hide submission section
  document.getElementById("submissionSection").classList.add("hidden");
}
