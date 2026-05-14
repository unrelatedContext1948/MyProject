const db = require("../database");
const bcrypt = require("bcrypt");

const UserModel = {
    // 1. Login - verify username and password, return user info if valid
    login: (username, password) => {
        const sql = "SELECT * FROM UsersTable WHERE Username = ?";
        const user = db.prepare(sql).get(username);
        if (!user) {
            return null;
        }
        const isMatch = bcrypt.compareSync(password, user.Password);
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

};

module.exports = UserModel;

