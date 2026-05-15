const db = require("../database");
const UserModel = require("../models/userModel");

// checks if the request has a valid token
// identifies who is making the request before anything else

const authenticate = (req, res, next) => {
  // authorization header should follow format: Bearer abc123tokenlmnop
  const authHeader = req.headers.authorization;

  //reject the request if header is missing or not in correct format
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "No valid token provided",
    });
  }

  // extract only the part after the Bearer e.g Bearer ab123lmnop, only "abc123lmnop" is taken
  const token = authHeader.split(" ")[1];

  // look up the token in database to find matching user
  const user = UserModel.getUserByToken(token);

  //if no user matches the token, deny their acces
  if (!user) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }

  // when the token is valid, attach the user's information to the request
  // this allows the next middleware and route to know who is making the request, without having to query the database again

  req.user = {
    userID: user.UserID,
    username: user.Username,
    role: user.Role,
  };

  // next middleware will be carried out
  next();
};

//checks whether user has the required role (to access the specific functions)
// usage: authorize ("admin", "authorized_user")
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // deny the user's access if they are not authenticated
    //  or their role is not permitted to access the specific role functions
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }
    // role is permitted, move on to the next handler
    next();
  };
};

//export both functions to use in route files
module.exports = { authenticate, authorize };
