const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");

const router = express.Router();

//Register
router.post("/register", async(req, res) => {
    const{ firstName, lastName, email, password } = req.body;

    try{
        //check if user exists
        let existingUser = await User.findOne({ email });
        if(existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const fullName =`${firstName} ${lastName}` .trim();
        const user = await User.create({ firstName, lastName, email, password });

        //Generate token
        const token = jwt.sign(
            { id: user._id, role: "user" },
            process.env.JWT_SECRET,
            { expiresIn: "1d"}
        );

        res.status(201).json({
            token,
            user:{
                id:user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email:user.email,
                role: "user",
            },
        });
    } catch(err){
        console.error("Register error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

//Login
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
                firstName: account.firstName,
                lastName: account.lastName,
                email: account.email,
                role,
            }
        });
    } catch (err){
        console.error(err);
        res.status(500).json({ message: "Server error "});
    }
});


module.exports = router;