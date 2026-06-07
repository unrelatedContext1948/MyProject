/* This file is for user management including:
1. creating a new user
2. showing a user table
3. deleting a user*/

const createUserForm = document.getElementById("createUserForm");

createUserForm.addEventListener("submit", createUser);

function createUser(event) {
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

  let hasError = false;

  //Clear old errors
  usernameError.textContent = "";
  passwordError.textContent = "";

  usernameInput.classList.remove("input-error");
  passwordInput.classList.remove("input-error");

  if (!isValidUsername(username)) {
    usernameError.textContent =
      "Username can only include numbers, letters, underscores and periods.";
    usernameInput.classList.add("input-error");
    hasError = true;
  }

  /*
    Backend/integration:
    Please also handle the case where the username already exists in the database 
    So there will be no 2 same username, even with different role!
    when displaying error message pls refer to the structure below, don't use alert coz i alr created the styling in css for better UI/UX
      

      if (username.........)) {
      usernameError.textContent =
        "Username already exists! please choose another one ";
      usernameInput.classList.add("input-error");
      hasError = true;
      }

  */

  //check password
  if (!usesOnlyAllowedPasswordCharacters(password)) {
    passwordError.textContent =
      "Password can only include letters, numbers and special characters";
    passwordInput.classList.add("input-error");
    hasError = true;
    return;
  }

  if (password.length < 8) {
    passwordError.textContent = "Password must be at least 8 characters";
    passwordInput.classList.add("input-error");
    hasError = true;
    return;
  }

  if (password === username) {
    passwordError.textContent = "Password must be different from username";
    passwordInput.classList.add("input-error");
    hasError = true;
    return;
  }

  if (!hasNumber(password)) {
    passwordError.textContent = "Password must contain at least 1 number";
    passwordInput.classList.add("input-error");
    hasError = true;
    return;
  }

  if (!hasSpecialCharacter(password)) {
    passwordError.textContent =
      "Password must contain at least 1 special character";
    passwordInput.classList.add("input-error");
    hasError = true;
    return;
  }

  //Stop if something wrong and display the message below each form
  if (hasError) return;

  //if password matches every criteria, backend/integration change this with real API POST (username, password, role and when is the user created dd-mm-yyyy)
  alert('User "' + username + '" created succesfully with role : ' + role);

  event.target.reset();
}

//username
function isValidUsername(username) {
  const allowedCharacters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_.";

  for (let i = 0; i < username.length; i++) {
    if (!allowedCharacters.includes(username[i])) {
      return false;
    }
  }
  return true;
}

//password
function usesOnlyAllowedPasswordCharacters(password) {
  const allowedCharacters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";

  for (let i = 0; i < password.length; i++) {
    if (!allowedCharacters.includes(password[i])) {
      return false;
    }
  }
  return true;
}

function hasNumber(password) {
  const numbers = "0123456789";
  for (let i = 0; i < password.length; i++) {
    if (numbers.includes(password[i])) {
      return true;
    }
  }
  return false;
}

function hasSpecialCharacter(password) {
  const allowedSpecialCharacters = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"; //according to OWASP
  for (let i = 0; i < password.length; i++) {
    if (allowedSpecialCharacters.includes(password[i])) {
      return true;
    }
  }
  return false;
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

//User Table starts from here

/* Hint to integration/backend:

   Render user table to display the list of active users on the page 

   we will use pagination concept for the table where we show only 5 users each page 
   why pagination? so admin can see all of the active users without endless scrolling 
   how if we have 30 active users? table will be so long

   below the table there will be next button to show the next 5 users
   and also previous button to go back to previous 5 users.

   For better visualization pls right click on admin html and open with live server
*/

const USER_TABLE_LIST = 5;
let currentUserPage = 1;

//when the page loads
document.addEventListener("DOMContentLoaded", function () {
  currentUserPage = 1;
  renderUserTable();
});

//Render user table function

function renderUserTable() {
  const tbody = document.getElementById("userTableBody");
  const footer = document.getElementById("userTableFooter");
  if (!tbody || !footer) return;

  //clear whatever was there before
  tbody.innerHTML = "";

  /*Integration/backend replace variable USERS below with real data
  coz USERS is an array of users i created in the dummy data file admindata.js
  */

  const totalPages = Math.ceil(USERS.length / USER_TABLE_LIST);

  const startIndex = (currentUserPage - 1) * USER_TABLE_LIST;
  const endIndex = startIndex + USER_TABLE_LIST;

  const visibleUsers = USERS.slice(startIndex, endIndex);

  //Loop through every visible users and build table row data
  visibleUsers.forEach(displayUsers);

  //element and index are provided
  function displayUsers(element, index) {
    const row = document.createElement("tr");

    //admin will never get a delete button
    const deleteButton =
      element.role !== "admin"
        ? `<button class="btn-small btn-delete" onclick="deleteUser('${element.username}')">Delete</button>`
        : "";

    row.innerHTML = `
        <td>${element.username}</td>
        <td><span class="role-badge">${element.role}</span></td>
        <td>${element.created}</td>
        <td>${deleteButton}</td>
        `;

    tbody.appendChild(row);
  }

  //If there are 5 users or less, no pagination is needed
  if (USERS.length <= USER_TABLE_LIST) return;

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
  const totalPages = Math.ceil(USERS.length / USER_TABLE_LIST);

  if (currentUserPage < totalPages) {
    currentUserPage = currentUserPage + 1;
    renderUserTable();
  }
}

//show previous page function
function showPreviousUserPage() {
  if (currentUserPage > 1) {
    currentUserPage = currentUserPage - 1;
    renderUserTable();
  }
}

//delete user function
function deleteUser(username) {
  //confirmation
  const confirmed = confirm(
    `Are you sure you want to delete ${username} ? this action cannot be undone`,
  );

  if (!confirmed) return;

  // Integration/backend replace this with real API then call renderUserTable() after it succeeds and can delete the dummy array lines below

  //This is only for dummy data
  const index = USERS.findIndex(function (element) {
    return element.username === username;
  });

  if (index !== -1) {
    USERS.splice(index, 1);
  }

  /*after deleting a user, the current page might no longer exist
   z.B: 
   -Page 3 only had 1 user
   -Admin deletes that user
   -Now there are only 2 pages
   -So currentUserPage must move back to page 2
  */

  const totalPages = Math.ceil(USERS.length / USER_TABLE_LIST);

  if (currentUserPage > totalPages) {
    currentUserPage = Math.max(1, totalPages);
  }

  renderUserTable();
}
