const express = require("express");
// const bcrypt = require("bcrypt");
// const { v4: uuidv4 } = require("uuid");

// OLD: const db = require("../database/database");
// NEW: DAO-Pattern - we want to abstract away the database layer and only interact with it through our models
const UserModel = require("../models/userModel");
const { authenticate } = require("../middleware/authorization");
const router = express.Router();

/* 1. POST /auth/login
Access: anyone
Purpose:
- check username + password
- generate token
- save token in database
- return token + role
NOTE: We will use UserModel.login() to check the username and password, 
and UserModel.updateToken() to save the generated token in the database
*/


router.post ("/login", (req, res) => {

    const { username, password } = req.body;

    // reject if username or password is missing from the request
    if(!username || !password ) {
        return res.status(400).json({
            message: "Username and password are required"
        });
    }

    /* --- OLD CODE ---
    const user = db
    .prepare("SELECT * FROM UsersTable WHERE Username = ?")
    .get(username);
    if (!user){
        return res.status(401).json({
            message: "Invalid username or password. Please try again."
        });

    }
     --- NEW CODE --- */
    const user = UserModel.login(username, password);  
    if (!user) {
        return res.status(401).json({
            message: "Invalid username or password. Please try again."
        });
    }

    /* --- OLD CODE ---
    const passwordMatches = bcrypt.compareSync(password, user.Password);
    if (!passwordMatches) {
        return res.status(401).json({
            message: "Invalid username or password. Please try again."
        });
    }
     --- OLD CODE --- */

    /* --- OLD CODE --- 
    const token = uuidv4();
    db.prepare("UPDATE UsersTable SET Token = ? WHERE UserID = ?")
    .run(token, user.UserID);
    return res.status(200).json({
        message: "Successfully logged in!",
        token,
        role: user.Role,
        username: user.Username

    });
    --- NEW CODE ---*/
    const token = "tk_" + Math.random().toString(36).substr(2) + Date.now();
    UserModel.updateToken(user.UserID, token);

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
    /* --- OLD CODE ---
    db.prepare("UPDATE UsersTable SET Token = NULL WHERE UserID = ?")
    .run(req.user.userID);
    return res.status(200).json ({
        message: "Successfully logged out!"
    });
    --- NEW CODE --- */
    UserModel.updateToken(req.user.userID, null);
    return res.status(200).json ({
        message: "Successfully logged out!"
    });

    return res.status(200).json({
        message: "Successfully logged out!"
    });
});

module.exports = router;
