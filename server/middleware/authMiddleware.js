const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');

const protect = (role) => async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (role === 'admin') {
        req.admin = await Admin.findById(decoded.id).select('-password');
        if (!req.admin) return res.status(401).json({ message: 'Not authorized as admin' });
      } else {
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) return res.status(401).json({ message: 'Not authorized as user' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
