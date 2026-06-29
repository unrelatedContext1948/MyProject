const db = require("../database/database");
const UserModel = require("../models/userModel");

// AUTHENTICATION MIDDLEWARE
// checks if the user that made the request has a valid token which has been stored in the database
/* NOTE: authentication middleware isn't used for /auth/login
         because users do not have the token yet. login route generates token, then protected routes 
         e.g when an authorized user wants to propose an ad break, that is where it goes through this middleware first before the
         actual route */
const authenticate = (req, res, next) => {
    // check if the request has an authorization header and if it starts with "Bearer "
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "No valid token provided"
        });

    }
    // extract only the token portion
    // e.g: Bearer: abc123xyz, spliy (" ") created: ["Bearer", "abc123xyz"], [1] takes the token part only
    const token = authHeader.split(" ")[1];

  // look up the token in database to find matching user
  const user = UserModel.getUserByToken(token);

  //if no user matches the token, deny their acces
  if (!user) {
    return res.status(401).json({
      message: "Invalid token"
    });
  }

    // when the token is valid, attach user information to req.user
    /* this allows future middleware/routes to know
       - who the user is
       - what their role is
       without having to query the database agaiin
      */
  req.user = {
    userID: user.UserID,
    username: user.Username,
    role: user.Role,
  };


  // next middleware will be carried out
  next();
};
// AUTHORIZATION MIDDLEWARE
/* - checks whether the authenticated user has permission to access a route
     (e.g has access to specific functions or not)
   - authorization middleware is always carried out AFTER authenticate ()
   - makes sense because system has to recognize you first before it allows you
     to access specific functions 
 */

/* allowedRoles collects all permitted roles into an array
("admin", "authorized_user") --> ["admin", "authorized_user"]
 it allows one route to be accessible by multiple roles
 e.g POST/queue/submit can be accessed by both admin and authorized_user */
const authorize = (...allowedRoles) => {

    return (req, res, next) => {

        // reject request if:
        /* - req.user does not exist
           - user's role is not inside allowed roles
         */
        
        if(!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Access denied"
            });
        }
        // role is permitted, move on to the next handler
        next();
    };
};

//export both functions to use in route files
module.exports = { authenticate, authorize };
