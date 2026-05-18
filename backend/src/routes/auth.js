const express = require("express");
const { v4: uuidv4 } = require("uuid"); // for generating unique and secure tokens

// DAO-Pattern - we want to abstract away the database layer and only interact with it through our models
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


router.post ("/login", express.json(), (req, res) => {

    const { username, password } = req.body;

    // reject if username or password is missing from the request
    if(!username || !password ) {
        return res.status(400).json({
            message: "Username and password are required"
        });
    }

    
    const user = UserModel.login(username, password);  
    if (!user) {
        return res.status(401).json({
            message: "Invalid username or password. Please try again."
        });
    }

    const token = uuidv4();
    UserModel.updateToken(user.UserID, token);

    return res.status(200).json({
        message: "Successfully logged in!",
        token,
        role: user.Role,
        username: user.Username
    });

});



/* 2. POST /auth/logout
Access: authenticated users
Purpose:
- invalidate the user's token in the database (set it to null)
NOTE: We will use the authenticate middleware to ensure only authenticated users can access this route, 
and UserModel.updateToken() to set the user's token to null in the database
*/


router.post("/logout", authenticate, (req,res) => {
    UserModel.updateToken(req.user.userID, null);
    return res.status(200).json ({
        message: "Successfully logged out!"
    });
});

module.exports = router;
