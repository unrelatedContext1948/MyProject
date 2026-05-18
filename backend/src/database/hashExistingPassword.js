
// This code change the existing real password in database to hashed password.
const db = require('./database'); 
const bcrypt = require('bcrypt');

// Retrieve all users from the database to check their passwords.
const users = db.prepare("SELECT UserID, Password FROM UsersTable").all();
console.log("Total users: " + users.length);

async function hashExistingPasswords() {

    // Loop through each user in database to check either their password is already hashed or not
    for (let i = 0; i < users.length; i++) {
        let user = users[i]

    //Check if password is already hashed.
    // If yes, just skip to next user. If no, then hash it.
        if (user.Password.startsWith("$2b$")) {
            console.log(user.UserID + " is already hashed. Skipping...");
        } else {

            // Salt is for security purpose, it takes more time for hackers to crack the password in database. 
            // Salt will ensure the hash password stored in daabase is different eventhough two users have the same real password. 
            
            let hashedPassword = await bcrypt.hash(user.Password, 10);

            db.prepare("UPDATE UsersTable SET Password = ? WHERE UserID = ?")
            .run(hashedPassword, user.UserID);
            console.log(user.UserID + " password has been hashed.");
        }
    }
    console.log("All passwords have successfully changed to hashed.");
}

hashExistingPasswords();