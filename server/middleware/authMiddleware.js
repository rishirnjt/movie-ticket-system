const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = (roles = []) => async (req, res, next) => {
  let token;

  if(
    req.headers.authorization && 
    req.headers.authorization.startsWith('Bearer')
  ){
    try{
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User
        .findById(decoded.id)
        .populate("userType")
        .select("-password");

      if(!user) {
        return res.status(401).json({ message: "User not found" });
      }
      //role check
      if(
        roles.length > 0 &&
        !roles.map(r => r.toLowerCase()).includes(user.userType.type.toLowerCase())
      ){
        console.log("Access denied:", {
          allowedRoles: roles,
          userRole: user.userType.type
        });
        return res.status(403).json({ message: "Access denied"});
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Token error:", error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }else {
    return res.status(401).json({ message: 'Not authorized,no token'});
  }
};

module.exports = { protect };