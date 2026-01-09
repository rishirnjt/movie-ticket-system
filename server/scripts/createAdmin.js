require("dotenv").config();
console.log("createAdmin script started");

const connectDB = require("../config/db");
const User = require("../models/User");
const UserType = require("../models/UserType");

const createAdmin = async () => {
  try {
    await connectDB();

    // find admin role
    const adminType = await UserType.findOne({ type: "Admin" });
    if (!adminType) {
      console.log("Admin role not found");
      process.exit(1);
    }

    // check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@cinemax.com" });

    if (existingAdmin) {
      // update password if needed
      existingAdmin.password = "admin@123"; 
      existingAdmin.userType = adminType._id;
      await existingAdmin.save();
      console.log("Admin already existed, password updated");
      process.exit(0);
    }

    // create new admin
    await User.create({
      firstName: "System",
      lastName: "Admin",
      email: "admin@cinemax.com",
      password: "admin@123",
      userType: adminType._id,
    });

    console.log("Admin created successfully");
    process.exit(0);
  } catch (err) {
    console.error("Error creating admin:", err);
    process.exit(1);
  }
};

createAdmin();
