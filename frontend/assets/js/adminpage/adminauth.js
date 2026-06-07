/*to handle logout from adminpage
different behaviour from logout() for the authorized user
*/

function logoutAdmin() {
  //Integration/backend add real API here, also the token and role things

  //After that, redirect back to main page
  window.location.href = "index.html";
}
