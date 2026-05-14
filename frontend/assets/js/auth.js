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

handleLoginForm.addEventListener("submit", handleLogin);

function handleLogin(event) {
  event.preventDefault();

  const username = document.getElementById("loginUsername").value.trim(); //trim to delete whitespaces
  const password = document.getElementById("loginPassword").value;

  //Integration/backend should change this ! with fetch API method POST
  const cred = DEMO_LOGIN.find(function (userData) {
    return userData.username === username && userData.password === password;
  });

  //If nothing was found (wrong username or wrong password) then show error, integration/backend should also adjust this part
  if (!cred) {
    alert("Invalid username or password. Please try again.");
    document.getElementById("loginUsername").value = "";
    document.getElementById("loginPassword").value = "";
    return;
  }

  //Get the role automatically from the credentials
  const role = cred.role;

  AuthState.user = username;
  AuthState.role = role;

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
function logout() {
  AuthState.user = null;
  AuthState.role = null;

  //to reset navbar
  document.getElementById("loginBtn").classList.remove("hidden");
  document.getElementById("navLoggedIn").classList.add("hidden");

  // Hide submission section
  document.getElementById("submissionSection").classList.add("hidden");
}
