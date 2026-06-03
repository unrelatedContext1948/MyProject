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
