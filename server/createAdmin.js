// createAdmin.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.log(err));

async function createAdmin() {
    try {
        const adminExists = await Admin.findOne({ email: 'admin@example.com' });
        if (adminExists) {
            console.log('Admin already exists');
            process.exit();
        }

        const admin = new Admin({
            email: 'admin@example.com',
            password: 'admin123', 
        });

        await admin.save();
        console.log('Admin created successfully');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

createAdmin();
