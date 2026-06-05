// REMEMBER only the hash password will be store in database.
//This code is to hash the password of new added user.
const db = require('../database/database');
const bcrypt = require('bcrypt');


async function hashPassword(password, userID) {
    
    //Hash the password.
    let hashedPassword = await bcrypt.hash(password, 10)

    //Keep the hash password in database.
    db.prepare("UPDATE UsersTable SET Password = ? WHERE UserID = ?")
    .run(hashedPassword, userID);

    console.log("Password has been hashed for userID: " + userID);  
}