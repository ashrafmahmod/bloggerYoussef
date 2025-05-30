const jwt = require("jsonwebtoken");
/*
1- get authToken from header req.headers.authorization 
2- check authToken if true transform to array and get 2nd index index 1 coz will be Bearer token so 
first index will be bearer 2nd will be the token and save to variable token
3- extract the token using jwt.verify(token , secret key) and save to variable decodedPayload
4- send this extracting token name decoded to req.user = decodedPayload 
*/
// verify token
function verifyToken(req, res, next) {
  const authToken = req.headers.authorization;
  if (authToken) {
    const token = authToken.split(" ")[1];
    try {
      // token is hashed i need to extract data from it
      const decodedPayload = jwt.verify(token, process.env.JWT_SECRETKEY);
      req.user = decodedPayload; // i send decoded token to req undername user

      next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid Token , Access Denied" });
    }
  } else {
    return res
      .status(401)
      .json({ message: "No Token Provided , Access Denied" });
  }
}

// verify admin and token in one
function verifyAdminAndToken(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.isAdmin) {
      next();
    } else {
      return res.status(403).json({ message: "Not Allowed Only Admin" });
    }
  });
}
// verify token & only user himself
function verifyTokenAndOnlyUser(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.id === req.params.id) {
      next();
    } else {
      return res
        .status(403)
        .json({ message: "Not Allowed Only The User Himself" });
    }
  });
}
// verify token User himself and admin (authorization)
function verifyTokenAuthorization(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.id === req.params.id || req.user.isAdmin) {
      next();
    } else {
      return res
        .status(403)
        .json({ message: "Not Allowed Only The User Himself , Or Admin" });
    }
  });
}

module.exports = {
  verifyToken,
  verifyAdminAndToken,
  verifyTokenAndOnlyUser,
  verifyTokenAuthorization,
};
