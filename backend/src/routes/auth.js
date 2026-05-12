const express = require("express");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

const db = require("../database/database");
const { authenticate } = require("../middleware/authorization");
const router = express.Router();

/* 1. POST /auth/login
Access: anyone
Purpose:
- check username + password
- generate token
- save token in database
- return token + role

*/

router.post ("/login", (req, res) => {

    const { username, password } = req.body;

    // reject if username or password is missing from the request
    if(!username || !password ) {
        return res.status(400).json({
            message: "Username and password are required"
        });
    }

    // find the user in the database by username
    const user = db
    .prepare("SELECT * FROM UsersTable WHERE Username = ?")
    .get(username);

    //if no user is found, deny their access
    if (!user){
        return res.status(401).json({
            message: "Invalid username or password. Please try again."
        });

    }

    // compare the submitted password against the hashed password in the database
    const passwordMatches = bcrypt.compareSync(password, user.Password);

    // if password doesn't match, deny their access
    if (!passwordMatches) {
        return res.status(401).json({
            message: "Invalid username or password. Please try again."
        });
    }

    // generate a unique token and save it to database
    const token = uuidv4();
    
    
    db.prepare("UPDATE UsersTable SET Token = ? WHERE UserID = ?")
    .run(token, user.UserID);

    

    // return the token, role and username to the frontend
    return res.status(200).json({
        message: "Successfully logged in!",
        token,
        role: user.Role,
        username: user.Username

    });
});

/* POST /auth/login
Access: Logged in users only
Purpose: Clear token from database
*/

router.post("/logout", authenticate, (req,res) => {

    // set the token to NULL so user can no longer make authenticated requests
    db.prepare("UPDATE UsersTable SET Token = NULL WHERE UserID = ?")
    .run(req.user.userID);


    return res.status(200).json ({
        message: "Successfully logged out!"
    });

});

module.exports = router;
