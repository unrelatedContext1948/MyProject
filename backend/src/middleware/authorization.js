const db = require ("../database/database");
// AUTHENTICATION MIDDLEWARE
// checks if the user that made the request has a valid token which has been stored in the database
/* NOTE: authentication middleware isn't used for /auth/login
         because users do not have the token yet. login route generates token, then protected routes 
         e.g when an authorized user wants to propose an ad break, that is where it goes through this middleware first before the
         actual route */

const authenticate = (req, res, next) => {
    // every request that needs authentication must include an Authorization header
    // example authorization header should follow format: Bearer abc123tokenlmnop
    const authHeader = req.headers.authorization; // req.headers.authorization reads the full header string

    // every protected request must contain: Authorization: Bearer <token>
    // reject the request if authorization header is missing or does not start with "Bearer "
    if(!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "No valid token provided"
        });

    }
    // extract only the token portion
    // e.g: Bearer: abc123xyz, spliy (" ") created: ["Bearer", "abc123xyz"], [1] takes the token part only
    const token = authHeader.split(" ")[1];

    // search database for a user whose token column only matches the token from the request
    // we only select what we need which is for here UserID, username and role
    const user = db
    .prepare("SELECT UserID, Username, Role FROM UsersTable WHERE Token = ?")
    .get(token);

    //if no user matches the token (token invalid, expired or user logged out already), deny their access
    if(!user) {
        return res.status(401).json ({
            message: "Invalid or expired token"
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
        role: user.Role

    };

    // the authentication is successful. meaning the database knows who the user is (based on their token), next middleware or route handler will be carried out
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

