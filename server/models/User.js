const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true},
    lastName: { type: String, required: true},
    email:{ type: String, required:true, unique: true},
    password: { type: String, required: true},
    userType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserType",
        required: true
    },
    status:{
        type: String,
        enum: ["active", "blocked"],
        default: "active",
    },
    
    resetPasswordToken: String,
    resetPasswordExpire: Date
});

userSchema.pre('save',async function (next) {
    if(!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema); 