const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const protect = async (req, res, next) => {
    let token = req.headers.authorization?.split(" ")[1];

    if(!token) return res.status(401).json({message: 'Not authorized, no token'});

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = await Admin.findById(decoded.id).select('-password');
        next();
    } catch (err){
        res.status(401).json({message: 'Invalid Token'});
    }
};

module.exports = { protect };