const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");

const router = express.Router();

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try{
        let account = await Admin.findOne({ email });
        let role = "admin";

        if(!account) {
            account = await User.findOne({ email });
            role = "user";
        }

        if(!account){
            return res.status(400).json({message: "Invalid credentials"});
        }

        const isMatch = await bcrypt.compare(password, account.password);
        if(!isMatch) {
            return res.status(400).json({ message: "Invalid credentials"});
        }

        const token = jwt.sign(
            { id: account._id, role},
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            token,
            user: {
                id: account._id,
                email: account.email,
                role
            }
        });
    } catch (err){
        console.error(err);
        res.status(500).json({ message: "Server error "});
    }
});

module.exports = router;