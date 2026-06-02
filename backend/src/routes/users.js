const express = require("express");
const bcrypt = require("bcrypt");

const UserModel = require("../models/userModel");
const { authenticate, authorize } = require("../middleware/authorization");

const router = express.Router();

/*
Function: View all user's list
GET /users (to list all users)
Only admin can access this function
*/
//authenticate() verifies the user's token
//authorize ("admin") ensures only admins can access this route
router.get("/", authenticate, authorize("admin"), (req, res) => {
    const users = UserModel.getAllUsers();

    return res.status(200).json(users);

});

/* 
Function: Admin creates new user
POST/ users
Only admin can access this function
*/
//authenticate() verifies the user's token
//authorize ("admin") ensures only admins can access this route
router.post("/", authenticate, authorize("admin"), (req, res) => {
    const { username, password, role } = req.body;

    if(!username || !password || !role) {
        return res.status(400).json({
            message: "Username, password and role are required"
        });

    }

    //Username validation
    //check that the username only contains letters, numbers, underscores and periods
    if(!/^[A-Za-z0-9_.]+$/.test(username)) {
        return res.status(400).json({
            message: "Username can only include numbers, letters, underscores and periods."
        });
    }

    /* password validation.
    Requirements:
    1. Min 8 characters
    2. Must be different from username
    3. Must contain at least one number
    4. Must contain at least one special character
     */
    if(password.length < 8) {
        return res.status(400).json({
            message: "Password must be at least 8 characters"
        });
    }
    if(password === username) {
        return res.status(400).json({
            message: "Password must be different from username"
        });
    }
    if(!/\d/.test(password)) {
        return res.status(400).json({
            message: "Password must contain at least one number"
        });
    }
    if(!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return res.status(400).json({
            message: "Password must contain at least one special character"
        });
    }


    // Role validation
    if(role !== "admin" && role !== "authorized_user"){
         return res.status(400).json({
            message: "Role must be admin or authorized_user"
        });

    }


    try{
        //hash the passwords before storing into DB
        const hashedPassword = bcrypt.hashSync(password, 10); 
        //store the account creation date in YYYY-MM-DD format
        const joinDate = new Date().toISOString().split("T")[0]; 
        UserModel.createUser(
            username,
            hashedPassword,
            role,
            joinDate
        );

        return res.status(201).json({
            message: "User successfully created!"
        });
      
    } catch (error) {
        return res.status(409).json({
             message: "Username already exists"
        });
    }   

});

module.exports = router;