// REMEMBER only the hash password will be store in database.
//This code is to hash the password of new added user.
const db = require('../database/database');
const bcrypt = require('bcrypt');

// Hash password before storing it in database
async function hashPassword(password, userID) {
    return await bcrypt.hash(password, 10);

}

module.exports = { hashPassword };