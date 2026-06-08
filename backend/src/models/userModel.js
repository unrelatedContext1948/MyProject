/*
 userModel.js - Data Access Object for user-related database operations
 This file defines the UserModel object which provides methods for 
 user authentication and token management.
 It abstracts away the database layer and allows us to interact with user data 
 without directly writing SQL queries in our route handlers.
 We will use this model in our auth routes to handle login and logout functionality.
*/
const db = require("../database/database");
const bcrypt = require("bcrypt"); // for password hashing and comparison

// The UserModel provides the following methods:
const UserModel = {
    // 1. Login - verify username and password, return user info if valid
    login: (username, password) => {
        const sql = "SELECT * FROM UsersTable WHERE Username = ?";
        const user = db.prepare(sql).get(username);
        if (!user) {
            return null;
        }
        const isMatch = (bcrypt.compareSync(password, user.Password);
        return isMatch ? user : null;
    },

    // 2. Token management - update user's token in the database
    updateToken: (userID, token) => {
        const sql = "UPDATE UsersTable SET Token = ? WHERE UserID = ?";
        db.prepare(sql).run(token, userID);
    },
    
    // 3. Get user info by token - used for authentication middleware
    getUserByToken: (token) => {
        const sql = "SELECT UserID, Username, Role FROM UsersTable WHERE Token = ?";
        return db.prepare(sql).get(token);
    },
    
     // 4. Get all users - used for admin user list
    getAllUsers: () => {
        const sql = `
        SELECT UserID, Username, Role, JoinDate 
        FROM UsersTable 
        ORDER BY JoinDate DESC
        `;
        return db.prepare(sql).all();
    },

    // 5. Create user - used when admin adds a new user
    createUser: (username, hashedPassword, role, joinDate) => {
        const sql = `
        INSERT INTO UsersTable
        (Username, Password, JoinDate, Role)
        VALUES (?, ?, ?, ?)
        `;
        return db.prepare(sql).run(
            username,
            hashedPassword,
            joinDate,
            role
        );
    },

    // 6. Delete user - used when admin removes a user
    deleteUser: (userID) => {
        const sql = `
        DELETE FROM UsersTable
        WHERE UserID = ?
        `;
        return db.prepare(sql).run(userID);
    }

};

module.exports = UserModel;



