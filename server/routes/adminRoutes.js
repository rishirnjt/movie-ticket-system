const express = require('express');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router(); 


//Admin Registration Route
router.post('/register', async (req, res) => {
    const { email, password } = req.body; 

    try {
        const adminExists = await Admin.findOne({ email });
        if (adminExists) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        const admin = await Admin.create({ email, password });

        if (admin) {
            res.status(201).json({ message: 'Admin registered successfully' });
        } else {
            res.status(400).json({ message: 'Invalid admin data' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


// Admin Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email });

        if (admin && admin.password === password) {
            const token = jwt.sign(
                { id: admin._id },
                process.env.JWT_SECRET, 
                { expiresIn: '1d' }
            );
            res.json({
                 token,
                 user: {
                    id: admin._id,
                    email: admin.email
                 }
                 });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


// Protected Dashboard Route
router.get('/dashboard', protect, (req, res) => {
    res.json({
        message: `Welcome, ${req.admin.email}. This is your secure dashboard.`
    });
});

module.exports = router;
